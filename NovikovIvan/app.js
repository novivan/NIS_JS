function appSeaBattle(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id "${containerId}" not found`);
        return "Sea Battle";
    }
    
    // Создаем структуру приложения
    container.innerHTML = `
        <h1>Морской бой</h1>
        <div id="controls">
            <label for="mode">Режим игры:</label>
            <select id="mode">
                <option value="single">Один против бота</option>
                <option value="two">Два игрока (офлайн)</option>
            </select>
            <label for="boardSize">Размер поля:</label>
            <select id="boardSize">
                <option value="10">10x10</option>
                <option value="15">15x15</option>
                <option value="20">20x20</option>
            </select>
            <button id="startBtn">Старт</button>
            <button id="confirmShipsBtn" style="display:none;">Подтвердить корабли</button>
        </div>
        <div id="game">
            <div id="player1" class="board-container">
                <h2>Игрок</h2>
                <div id="board1" class="board"></div>
            </div>
            <div id="player2" class="board-container">
                <h2 id="player2Title">Бот</h2>
                <div id="board2" class="board"></div>
            </div>
            <div id="transition-screen" style="display: none;" class="transition-screen">
                <h2 id="transition-message">Передайте устройство следующему игроку</h2>
                <button id="ready-btn">Я готов</button>
            </div>
            <p id="placementMsg" style="display:none;">Нажмите на клетки для расстановки кораблей</p>
            <p id="shipHint" style="display:none;">Чтобы поставить корабль, кликните сначала в клетку для носа корабля, затем в клетку для кормы.</p>
            <p id="turnHint" style="display:none;">Ваш ход. Для выстрела нажмите на клетку противника.</p>
        </div>
    `;

    let boardSize, mode;
    let currentPlayer = 1;
    let isBotMoving = false; 
    let playerCanShoot = true; 
    let boards = {}; 
    let shipPlacementPhase = false;
    const shipsCount = () => Math.floor(boardSize / 2);

    let player1Shots = [];  
    let player2Shots = []; 

    let gameState = 'setup'; 
    let shipsToPlace = [];
    let currentShipIndex = 0;
    let placementStart = null;

    function initGame() {
        mode = document.getElementById('mode').value;
        boardSize = parseInt(document.getElementById('boardSize').value);
        
        if (boardSize === 10) {
            shipsToPlace = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1]; 
        } else if (boardSize === 15) {
            shipsToPlace = [8, 7, 6, 6, 5, 4, 3, 2, 2, 1];
        } else if (boardSize === 20) {
            shipsToPlace = [10, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3];
        }
        
        document.getElementById('board1').innerHTML = '';
        document.getElementById('board2').innerHTML = '';
        
        generateBoardDOM('board1', boardSize);
        generateBoardDOM('board2', boardSize);
        
        if(mode === 'single') {
            boards = {
                player: createEmptyBoard(boardSize),
                bot: createEmptyBoard(boardSize)
            };
            placeBotShips(boards.bot);
            gameState = 'placement';
            currentShipIndex = 0;
            document.getElementById('confirmShipsBtn').style.display = 'none';
            document.getElementById('placementMsg').style.display = 'block';
            document.getElementById('placementMsg').textContent = `Разместите корабль длиной ${shipsToPlace[currentShipIndex]}`;
            document.getElementById('shipHint').style.display = 'block';
            attachPlacementEvents();
        } else {
            boards = {
                player1: createEmptyBoard(boardSize),
                player2: createEmptyBoard(boardSize)
            };
            player1Shots = createEmptyBoard(boardSize);
            player2Shots = createEmptyBoard(boardSize);
            
            document.getElementById('board1').style.display = 'grid';
            document.getElementById('board2').style.display = 'grid';
            document.getElementById('board2').style.visibility = 'hidden';
            
            gameState = 'placement';
            currentPlayer = 1;
            
            document.querySelector('#player1 h2').textContent = 'Игрок 1';
            document.getElementById('player2Title').textContent = 'Игрок 2';
            
            document.getElementById('placementMsg').style.display = 'block';
            document.getElementById('placementMsg').textContent = `Игрок 1: Разместите корабль длиной ${shipsToPlace[0]}`;
            document.getElementById('shipHint').style.display = 'block';
            attachTwoPlayerPlacementEvents();
        }
        
        currentPlayer = 1;
    }

    function createEmptyBoard(size) {
        const board = [];
        for (let i = 0; i < size; i++) {
            board.push(new Array(size).fill(0));
        }
        return board;
    }

    function generateBoardDOM(elementId, size) {
        const boardContainer = document.getElementById(elementId);
        boardContainer.style.cssText = '';
        boardContainer.style.gridTemplateColumns = `repeat(${size}, 30px)`;
        
        boardContainer.innerHTML = '';
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = i;
                cell.dataset.col = j;
                boardContainer.appendChild(cell);
            }
        }
    }

    function placeBotShips(board) {
        shipsToPlace.forEach(function(shipLength) {
            let placed = false;
            while(!placed) {
                const horizontal = Math.random() < 0.5;
                const row = horizontal ? Math.floor(Math.random() * boardSize) : Math.floor(Math.random() * (boardSize - shipLength + 1));
                const col = horizontal ? Math.floor(Math.random() * (boardSize - shipLength + 1)) : Math.floor(Math.random() * boardSize);
                let shipCells = [];
                for(let i = 0; i < shipLength; i++){
                    shipCells.push({
                        row: horizontal ? row : row + i,
                        col: horizontal ? col + i : col
                    });
                }
                if(isValidPlacementBot(shipCells, board)) {
                    shipCells.forEach(pos => board[pos.row][pos.col] = 1);
                    placed = true;
                }
            }
        });
    }

    function isValidPlacementBot(shipCells, board) {
        for (let pos of shipCells) {
            if(board[pos.row][pos.col] === 1) return false;
            for(let dr = -1; dr <= 1; dr++){
                for(let dc = -1; dc <= 1; dc++){
                    const nr = pos.row + dr, nc = pos.col + dc;
                    if(nr < 0 || nr >= boardSize || nc < 0 || nc >= boardSize) continue;
                    if(board[nr][nc] === 1) return false;
                }
            }
        }
        return true;
    }

    function attachPlacementEvents() {
        const boardCells = document.getElementById('board1').querySelectorAll('.cell');
        boardCells.forEach(cell => {
            cell.addEventListener('click', placementHandler);
        });
    }

    function detachPlacementEvents() {
        const boardCells = document.getElementById('board1').querySelectorAll('.cell');
        boardCells.forEach(cell => {
            cell.removeEventListener('click', placementHandler);
        });
    }

    function placementHandler(e) {
        if(gameState !== 'placement') return;
        const cell = e.target;
        const row = Number(cell.dataset.row);
        const col = Number(cell.dataset.col);


        if(cell.classList.contains('ship')) return;
        
        if(!placementStart) {
            placementStart = {row, col, el: cell};
            cell.classList.add('selected');
            document.getElementById('placementMsg').textContent = 
                `Выберите другой конец корабля длиной ${shipsToPlace[currentShipIndex]}`;
            document.getElementById('placementMsg').classList.add('smaller');
        } else {
            const start = placementStart;
            let shipCells = [];
            if(start.row === row) {
                const min = Math.min(start.col, col);
                const max = Math.max(start.col, col);
                for(let c = min; c <= max; c++){
                    shipCells.push({row: row, col: c});
                }
            } else if(start.col === col) {
                const min = Math.min(start.row, row);
                const max = Math.max(start.row, row);
                for(let r = min; r <= max; r++){
                    shipCells.push({row: r, col: col});
                }
            } else {
                alert('Корабль должен размещаться по прямой линии.');
                clearSelection();
                return;
            }
            if(shipCells.length !== shipsToPlace[currentShipIndex]){
                alert(`Длина выбранного корабля должна быть ${shipsToPlace[currentShipIndex]}`);
                clearSelection();
                return;
            }
            if(!isValidPlacement(shipCells)) {
                alert('Нельзя ставить корабли вплотную друг к другу или перекрывать их.');
                clearSelection();
                return;
            }
            shipCells.forEach(pos => {
                const cellEl = document.querySelector(`#board1 .cell[data-row='${pos.row}'][data-col='${pos.col}']`);
                cellEl.classList.add('ship');
                boards.player[pos.row][pos.col] = 1;
            });
            currentShipIndex++;
            clearSelection();
            const msg = document.getElementById('placementMsg');
            if(currentShipIndex < shipsToPlace.length) {
                msg.textContent = `Разместите корабль длиной ${shipsToPlace[currentShipIndex]}`;
                msg.classList.remove('smaller');
            } else {
                gameState = 'battle';
                document.getElementById('placementMsg').style.display = 'none';
                document.getElementById('shipHint').style.display = 'none';
                detachPlacementEvents();
                document.getElementById('board2').style.pointerEvents = 'auto';
                attachShootingEvents();
            }
        }
    }

    function clearSelection() {
        const board = mode === 'single' ? 'board1' : `board${currentPlayer}`;
        const selected = document.getElementById(board).querySelectorAll('.cell.selected');
        selected.forEach(cell => cell.classList.remove('selected'));
        placementStart = null;
    }

    function isValidPlacement(shipCells) {
        for (let pos of shipCells) {
            if(boards.player[pos.row][pos.col] === 1) return false;
            for(let dr = -1; dr <= 1; dr++){
                for(let dc = -1; dc <= 1; dc++){
                    let nr = pos.row + dr, nc = pos.col + dc;
                    if(nr < 0 || nr >= boardSize || nc < 0 || nc >= boardSize) continue;
                    if(boards.player[nr][nc] === 1) return false;
                }
            }
        }
        return true;
    }

    function attachShootingEvents() {
        const boardCells = document.getElementById('board2').querySelectorAll('.cell');
        boardCells.forEach(cell => {
            cell.addEventListener('click', shootingHandler);
        });
        document.getElementById('turnHint').style.display = 'block';
    }

    function detachShootingEvents() {
        const boardCells = document.getElementById('board2').querySelectorAll('.cell');
        boardCells.forEach(cell => {
            cell.removeEventListener('click', shootingHandler);
        });
        document.getElementById('turnHint').style.display = 'none';
    }

    function shootingHandler(e) {
        if(gameState !== 'battle' || isBotMoving || !playerCanShoot) {
            e.stopImmediatePropagation();
            e.preventDefault();
            return;
        }
        playerCanShoot = false; 
        const cell = e.target;
        const row = Number(cell.dataset.row);
        const col = Number(cell.dataset.col);
        if(cell.classList.contains('hit') || cell.classList.contains('miss')) return;
        
        cell.classList.add('shooting');
        setTimeout(() => {
            cell.classList.remove('shooting');
            if(boards.bot[row][col] === 1) {
                cell.classList.add('hit');
                if(isShipSunk(row, col)) {
                    markSurrounding(row, col);
                }
                if(checkVictory(boards.bot, '#board2')) {
                    gameEnd('victory');
                    return;
                }
                setTimeout(() => {
                    playerCanShoot = true;
                    attachShootingEvents();
                }, 500);
            } else {
                cell.classList.add('miss');
                setTimeout(botMove, 500);
            }
        }, 500);
    }

    function isShipSunk(row, col) {
        let shipCells = [];
        let visited = {};
        function dfs(r, c) {
            const key = `${r},${c}`;
            if(visited[key]) return;
            visited[key] = true;
            if(boards.bot[r][c] === 1) {
                let cellEl = document.querySelector(`#board2 .cell[data-row='${r}'][data-col='${c}']`);
                if(cellEl) {
                    shipCells.push(cellEl);
                    const directions = [[1,0],[-1,0],[0,1],[0,-1]];
                    directions.forEach(d => {
                        const nr = r + d[0], nc = c + d[1];
                        if(nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && boards.bot[nr][nc] === 1) {
                            dfs(nr, nc);
                        }
                    });
                }
            }
        }
        dfs(row, col);
        return shipCells.every(cell => cell.classList.contains('hit'));
    }

    function markSurrounding(row, col) {
        let shipPositions = [];
        let visited = {};
        function dfs(r, c) {
            const key = `${r},${c}`;
            if(visited[key]) return;
            visited[key] = true;
            if(boards.bot[r][c] === 1) {
                shipPositions.push({r, c});
                const directions = [[1,0],[-1,0],[0,1],[0,-1]];
                directions.forEach(d => {
                    const nr = r + d[0], nc = c + d[1];
                    if(nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && boards.bot[nr][nc] === 1) {
                        dfs(nr, nc);
                    }
                });
            }
        }
        dfs(row, col);
        shipPositions.forEach(pos => {
            for(let dr = -1; dr <= 1; dr++){
                for(let dc = -1; dc <= 1; dc++){
                    const nr = pos.r + dr, nc = pos.c + dc;
                    if(nr < 0 || nr >= boardSize || nc < 0 || nc >= boardSize) continue;
                    let neighbor = document.querySelector(`#board2 .cell[data-row='${nr}'][data-col='${nc}']`);
                    if(neighbor && !neighbor.classList.contains('hit') && !neighbor.classList.contains('miss')){
                        neighbor.classList.add('miss');
                    }
                }
            }
        });
    }

    function botMove() {
        isBotMoving = true; 
        detachShootingEvents(); 
        document.getElementById('board2').style.pointerEvents = 'none';
        let row, col, cell;
        do {
            row = Math.floor(Math.random() * boardSize);
            col = Math.floor(Math.random() * boardSize);
            cell = document.querySelector(`#board1 .cell[data-row='${row}'][data-col='${col}']`);
        } while(cell.classList.contains('hit') || cell.classList.contains('miss')); 
        

        return new Promise(resolve => {
            cell.classList.add('shooting');
            
            setTimeout(() => {
                cell.classList.remove('shooting');
                
                if(boards.player[row][col] === 1) {
                    cell.classList.add('hit');
                    if(isShipSunkPlayer(row, col)) {
                        markSurroundingPlayer(row, col);
                    }
                    if(checkVictory(boards.player, '#board1')) {
                        gameEnd('defeat');
                        return;
                    }
                    setTimeout(() => { botMove().then(resolve); }, 500);
                } else {
                    cell.classList.add('miss');
                    isBotMoving = false; 
                    document.getElementById('board2').style.pointerEvents = 'auto'; 
                    attachShootingEvents(); 
                    playerCanShoot = true; 
                    resolve();
                }
            }, 500);
        });
    }


    function isShipSunkPlayer(row, col) {
        let shipCells = [];
        let visited = {};
        function dfs(r, c) {
            const key = `${r},${c}`;
            if(visited[key]) return;
            visited[key] = true;
            if(boards.player[r][c] === 1) {
                let cellEl = document.querySelector(`#board1 .cell[data-row='${r}'][data-col='${c}']`);
                if(cellEl) {
                    shipCells.push(cellEl);
                    const directions = [[1,0],[-1,0],[0,1],[0,-1]];
                    directions.forEach(d => {
                        const nr = r + d[0], nc = c + d[1];
                        if(nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && boards.player[nr][nc] === 1) {
                            dfs(nr, nc);
                        }
                    });
                }
            }
        }
        dfs(row, col);
        return shipCells.every(cell => cell.classList.contains('hit'));
    }

    function markSurroundingPlayer(row, col) {
        let shipPositions = [];
        let visited = {};
        function dfs(r, c) {
            const key = `${r},${c}`;
            if(visited[key]) return;
            visited[key] = true;
            if(boards.player[r][c] === 1) {
                shipPositions.push({r, c});
                const directions = [[1,0],[-1,0],[0,1],[0,-1]];
                directions.forEach(d => {
                    const nr = r + d[0], nc = c + d[1];
                    if(nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && boards.player[nr][nc] === 1) {
                        dfs(nr, nc);
                    }
                });
            }
        }
        dfs(row, col);
        shipPositions.forEach(pos => {
            for(let dr = -1; dr <= 1; dr++){
                for(let dc = -1; dc <= 1; dc++){
                    const nr = pos.r + dr, nc = pos.c + dc;
                    if(nr < 0 || nr >= boardSize || nc < 0 || nc >= boardSize) continue;
                    let neighbor = document.querySelector(`#board1 .cell[data-row='${nr}'][data-col='${nc}']`);
                    if(neighbor && !neighbor.classList.contains('hit') && !neighbor.classList.contains('miss')){
                        neighbor.classList.add('miss');
                    }
                }
            }
        });
    }

    function attachCellEvents() {
        const board1Cells = document.getElementById('board1').querySelectorAll('.cell');
        board1Cells.forEach(cell => {
            cell.addEventListener('click', () => handlePlayerAction(1, cell));
        });
        const board2Cells = document.getElementById('board2').querySelectorAll('.cell');
        board2Cells.forEach(cell => {
            cell.addEventListener('click', () => handlePlayerAction(2, cell));
        });
    }

    function handlePlayerAction(cell) {
        const row = cell.dataset.row;
        const col = cell.dataset.col;
        if(cell.classList.contains('hit') || cell.classList.contains('miss')) return;
        
        if(boards.bot[row][col] === 1) {
            cell.classList.add('hit');
        } else {
            cell.classList.add('miss');
        }
        setTimeout(botMove, 500);
    }



    function checkVictory(board, boardSelector) {
        let shipCellsCount = 0;
        let hitCellsCount = 0;
        
        for(let i = 0; i < boardSize; i++) {
            for(let j = 0; j < boardSize; j++) {
                if(board[i][j] === 1) {
                    shipCellsCount++;
                    let cell = document.querySelector(`${boardSelector} .cell[data-row='${i}'][data-col='${j}']`);
                    if(cell && cell.classList.contains('hit')) {
                        hitCellsCount++;
                    }
                }
            }
        }
        
        return shipCellsCount === hitCellsCount;
    }


    function gameEnd(result) {
        gameState = 'end';
        if(result === 'victory'){
            alert("Поздравляем! Вы победили!");
        } else {
            alert("Вы проиграли!");
        }
        const menuBtn = document.createElement('button');
        menuBtn.textContent = "В главное меню";
        menuBtn.addEventListener('click', () => {
            location.reload();
        });
        document.body.appendChild(menuBtn);
    }

    function attachTwoPlayerPlacementEvents() {
        const board = currentPlayer === 1 ? 'board1' : 'board2';
        const boardCells = document.getElementById(board).querySelectorAll('.cell');
        boardCells.forEach(cell => {
            cell.addEventListener('click', twoPlayerPlacementHandler);
        });
    }

    function twoPlayerPlacementHandler(e) {
        if(gameState !== 'placement') return;
        const cell = e.target;
        const row = Number(cell.dataset.row);
        const col = Number(cell.dataset.col);
        const currentBoard = boards[`player${currentPlayer}`];
        
        if(cell.classList.contains('ship')) return;
        
        if(!placementStart) {
            placementStart = {row, col, el: cell};
            cell.classList.add('selected');
            document.getElementById('placementMsg').textContent = 
                `Игрок ${currentPlayer}: Выберите другой конец корабля длиной ${shipsToPlace[currentShipIndex]}`;
        } else {
            const shipCells = calculateShipCells(placementStart, {row, col});
            if(!shipCells || !isValidTwoPlayerPlacement(shipCells, currentBoard)) {
                clearSelection();
                return;
            }
            
            placeShipOnBoard(shipCells, currentPlayer);
            currentShipIndex++;
            clearSelection();
            
            if(currentShipIndex >= shipsToPlace.length) {
                if(currentPlayer === 1) {
                    switchToSecondPlayer();
                } else {
                    startTwoPlayerBattle();
                }
            } else {
                document.getElementById('placementMsg').textContent = 
                    `Игрок ${currentPlayer}: Разместите корабль длиной ${shipsToPlace[currentShipIndex]}`;
            }
        }
    }

    function switchToSecondPlayer() {
        currentPlayer = 2;
        currentShipIndex = 0;
        showTransitionScreen(
            "Передайте устройство Игроку 2 для расстановки кораблей",
            () => {
                document.getElementById('board1').style.visibility = 'hidden';
                document.getElementById('board2').style.visibility = 'visible';
                document.getElementById('placementMsg').textContent = `Игрок 2: Разместите корабль длиной ${shipsToPlace[0]}`;
                clearSelection();
                attachTwoPlayerPlacementEvents();
            }
        );
    }

    function startTwoPlayerBattle() {
        gameState = 'battle';
        currentPlayer = 1;
        showTransitionScreen(
            "Начинаем битву! Передайте устройство Игроку 1",
            () => {
                document.getElementById('placementMsg').style.display = 'none';
                document.getElementById('shipHint').style.display = 'none';
                updateBoardsDisplay();
                document.getElementById('board1').style.visibility = 'visible';
                document.getElementById('board2').style.visibility = 'visible';
                attachTwoPlayerBattleEvents();
                updateTurnMessage();
            }
        );
    }

    function hideShips() {
        const targetBoard = currentPlayer === 1 ? 'board2' : 'board1';
        const ships = document.getElementById(targetBoard).querySelectorAll('.ship:not(.hit)');
        ships.forEach(cell => {
            cell.style.backgroundColor = '#add8e6';
        });
    }

    function attachTwoPlayerBattleEvents() {
        const board1Cells = document.getElementById('board1').querySelectorAll('.cell');
        const board2Cells = document.getElementById('board2').querySelectorAll('.cell');
        
        board1Cells.forEach(cell => {
            cell.removeEventListener('click', twoPlayerBattleHandler);
        });
        board2Cells.forEach(cell => {
            cell.removeEventListener('click', twoPlayerBattleHandler);
        });
        
        if(currentPlayer === 1) {
            board2Cells.forEach(cell => {
                cell.addEventListener('click', twoPlayerBattleHandler);
            });
        } else {
            board1Cells.forEach(cell => {
                cell.addEventListener('click', twoPlayerBattleHandler);
            });
        }
    }

    function twoPlayerBattleHandler(e) {
        if(gameState !== 'battle') return;
        const cell = e.target;
        if(cell.classList.contains('hit') || cell.classList.contains('miss')) return;
        
        const row = Number(cell.dataset.row);
        const col = Number(cell.dataset.col);
        const targetBoard = currentPlayer === 1 ? boards.player2 : boards.player1;
        const shotsArray = currentPlayer === 1 ? player1Shots : player2Shots;
        
        if(shotsArray[row][col] !== 0) return;
        
        cell.classList.add('shooting');
        setTimeout(() => {
            cell.classList.remove('shooting');
            if(targetBoard[row][col] === 1) {
                shotsArray[row][col] = 2; 
                cell.classList.add('hit');
                cell.classList.add('ship');
                
                if(isShipDestroyed(row, col, targetBoard)) {
                    markDestroyedShipArea(row, col, targetBoard, shotsArray);
                }
                
                if(checkVictory(targetBoard, '#board2')) {  
                    gameEnd(`victory_player${currentPlayer}`);
                    return;
                }
            } else {
                shotsArray[row][col] = 1; 
                cell.classList.add('miss');
                switchPlayer();
            }
        }, 500);
    }

    function isShipDestroyed(row, col, board) {
        const visited = new Set();
        const shipCells = [];
        
        function dfs(r, c) {
            const key = `${r},${c}`;
            if(visited.has(key)) return;
            visited.add(key);
            
            if(board[r][c] === 1) {
                shipCells.push({row: r, col: c});
                [[0,1], [0,-1], [1,0], [-1,0]].forEach(([dr, dc]) => {
                    const newR = r + dr;
                    const newC = c + dc;
                    if(newR >= 0 && newR < boardSize && newC >= 0 && newC < boardSize && board[newR][newC] === 1) {
                        dfs(newR, newC);
                    }
                });
            }
        }
        
        dfs(row, col);
        
        const shotsArray = currentPlayer === 1 ? player1Shots : player2Shots;
        return shipCells.every(cell => shotsArray[cell.row][cell.col] === 2);
    }

    function markDestroyedShipArea(row, col, board, shotsArray) {
        const visited = new Set();
        const shipCells = [];
        
        function findShip(r, c) {
            const key = `${r},${c}`;
            if(visited.has(key)) return;
            visited.add(key);
            
            if(board[r][c] === 1) {
                shipCells.push({row: r, col: c});
                [[0,1], [0,-1], [1,0], [-1,0]].forEach(([dr, dc]) => {
                    const newR = r + dr;
                    const newC = c + dc;
                    if(newR >= 0 && newR < boardSize && newC >= 0 && newC < boardSize && board[newR][newC] === 1) {
                        findShip(newR, newC);
                    }
                });
            }
        }
        
        findShip(row, col);
        
        shipCells.forEach(({row, col}) => {
            for(let dr = -1; dr <= 1; dr++) {
                for(let dc = -1; dc <= 1; dc++) {
                    const newR = row + dr;
                    const newC = col + dc;
                    if(newR >= 0 && newR < boardSize && newC >= 0 && newC < boardSize) {
                        if(board[newR][newC] !== 1 && shotsArray[newR][newC] === 0) {
                            shotsArray[newR][newC] = 1;
                            const cell = document.querySelector(`#board2 .cell[data-row='${newR}'][data-col='${newC}']`);
                            if(cell) {
                                cell.classList.add('miss');
                            }
                        }
                    }
                }
            }
        });
    }

    function isTwoPlayerShipSunk(row, col, board, boardSelector) {
        let shipCells = [];
        let visited = {};
        
        function dfs(r, c) {
            const key = `${r},${c}`;
            if(visited[key]) return;
            visited[key] = true;
            if(board[r][c] === 1) {
                let cellEl = document.querySelector(`${boardSelector} .cell[data-row='${r}'][data-col='${c}']`);
                if(cellEl) {
                    shipCells.push(cellEl);
                    const directions = [[1,0],[-1,0],[0,1],[0,-1]];
                    directions.forEach(d => {
                        const nr = r + d[0], nc = c + d[1];
                        if(nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && board[nr][nc] === 1) {
                            dfs(nr, nc);
                        }
                    });
                }
            }
        }
        
        dfs(row, col);
        return shipCells.every(cell => cell.classList.contains('hit'));
    }

    function markTwoPlayerSurrounding(row, col, board, boardSelector) {
        let shipPositions = [];
        let visited = {};
        
        function dfs(r, c) {
            const key = `${r},${c}`;
            if(visited[key]) return;
            visited[key] = true;
            if(board[r][c] === 1) {
                shipPositions.push({r, c});
                const directions = [[1,0],[-1,0],[0,1],[0,-1]];
                directions.forEach(d => {
                    const nr = r + d[0], nc = c + d[1];
                    if(nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && board[nr][nc] === 1) {
                        dfs(nr, nc);
                    }
                });
            }
        }
        
        dfs(row, col);
        shipPositions.forEach(pos => {
            for(let dr = -1; dr <= 1; dr++){
                for(let dc = -1; dc <= 1; dc++){
                    const nr = pos.r + dr, nc = pos.c + dc;
                    if(nr < 0 || nr >= boardSize || nc < 0 || nc >= boardSize) continue;
                    let neighbor = document.querySelector(`${boardSelector} .cell[data-row='${nr}'][data-col='${nc}']`);
                    if(neighbor && !neighbor.classList.contains('hit') && !neighbor.classList.contains('miss')) {
                        neighbor.classList.add('miss');
                    }
                }
            }
        });
    }

    function switchPlayer() {
        if(currentPlayer === 1) {
            currentPlayer = 2;
            showTransitionScreen(
                "Передайте устройство Игроку 2",
                () => {
                    updateBoardsDisplay();
                    document.getElementById('board1').style.visibility = 'visible';
                    document.getElementById('board2').style.visibility = 'visible';
                    attachTwoPlayerBattleEvents();
                    updateTurnMessage();
                }
            );
        } else {
            currentPlayer = 1;
            showTransitionScreen(
                "Передайте устройство Игроку 1",
                () => {
                    updateBoardsDisplay();
                    document.getElementById('board1').style.visibility = 'visible';
                    document.getElementById('board2').style.visibility = 'visible';
                    attachTwoPlayerBattleEvents();
                    updateTurnMessage();
                }
            );
        }
    }

    function updateTurnMessage() {
        const turnHint = document.getElementById('turnHint');
        turnHint.style.display = 'block';
        turnHint.textContent = `Ход Игрока ${currentPlayer}`;
    }

    function gameEnd(result) {
        gameState = 'end';
        if(result === 'victory') {
            alert("Поздравляем! Вы победили бота!");
        } else if(result === 'defeat') {
            alert("Вы проиграли боту!");
        } else if(result === 'victory_player1') {
            alert("Победил Игрок 1!");
        } else if(result === 'victory_player2') {
            alert("Победил Игрок 2!");
        }
        
        const menuBtn = document.createElement('button');
        menuBtn.textContent = "В главное меню";
        menuBtn.addEventListener('click', () => location.reload());
        document.body.appendChild(menuBtn);
    }


    function calculateShipCells(start, end) {
        let shipCells = [];
        if(start.row === end.row) {
            const min = Math.min(start.col, end.col);
            const max = Math.max(start.col, end.col);
            if(max - min + 1 !== shipsToPlace[currentShipIndex]) {
                alert(`Длина корабля должна быть ${shipsToPlace[currentShipIndex]}`);
                return null;
            }
            for(let c = min; c <= max; c++) {
                shipCells.push({row: start.row, col: c});
            }
        } else if(start.col === end.col) {
            const min = Math.min(start.row, end.row);
            const max = Math.max(start.row, end.row);
            if(max - min + 1 !== shipsToPlace[currentShipIndex]) {
                alert(`Длина корабля должна быть ${shipsToPlace[currentShipIndex]}`);
                return null;
            }
            for(let r = min; r <= max; r++) {
                shipCells.push({row: r, col: start.col});
            }
        } else {
            alert('Корабль должен размещаться по прямой линии');
            return null;
        }
        return shipCells;
    }

    function isValidTwoPlayerPlacement(shipCells, board) {
        for (let pos of shipCells) {
            if(board[pos.row][pos.col] === 1) return false;
            for(let dr = -1; dr <= 1; dr++){
                for(let dc = -1; dc <= 1; dc++){
                    const nr = pos.row + dr, nc = pos.col + dc;
                    if(nr < 0 || nr >= boardSize || nc < 0 || nc >= boardSize) continue;
                    if(board[nr][nc] === 1) return false;
                }
            }
        }
        return true;
    }

    function placeShipOnBoard(shipCells, playerNum) {
        const board = playerNum === 1 ? 'board1' : 'board2';
        const boardData = boards[`player${playerNum}`];
        
        shipCells.forEach(pos => {
            const cellEl = document.querySelector(`#${board} .cell[data-row='${pos.row}'][data-col='${pos.col}']`);
            cellEl.classList.add('ship');
            boardData[pos.row][pos.col] = 1;
        });
    }


    function showTransitionScreen(message, callback) {
        const transitionScreen = document.getElementById('transition-screen');
        const transitionMessage = document.getElementById('transition-message');
        const readyBtn = document.getElementById('ready-btn');
        

        document.getElementById('board1').style.visibility = 'hidden';
        document.getElementById('board2').style.visibility = 'hidden';
        
        transitionMessage.textContent = message;
        transitionScreen.style.display = 'flex';
        

        const newReadyBtn = readyBtn.cloneNode(true);
        readyBtn.parentNode.replaceChild(newReadyBtn, readyBtn);
        
        newReadyBtn.addEventListener('click', () => {
            transitionScreen.style.display = 'none';
            if (callback) callback();
        });
    }

    function updateBoardsDisplay() {
        const board1 = document.getElementById('board1');
        const board2 = document.getElementById('board2');
        const player1Title = document.querySelector('#player1 h2');
        const player2Title = document.querySelector('#player2 h2');

        if (currentPlayer === 1) {
            player1Title.textContent = 'Ваше поле (Игрок 1)';
            player2Title.textContent = 'Поле противника (Игрок 2)';
            
            board1.innerHTML = '';
            generateBoardDOM('board1', boardSize);
            board1.querySelectorAll('.cell').forEach(cell => {
                const row = Number(cell.dataset.row);
                const col = Number(cell.dataset.col);
                if (boards.player1[row][col] === 1) {
                    cell.classList.add('ship');
                    cell.style.backgroundColor = '#00008b';
                }
                if (player2Shots[row][col] === 2) cell.classList.add('hit');
                if (player2Shots[row][col] === 1) cell.classList.add('miss');
            });
            board2.innerHTML = '';
            generateBoardDOM('board2', boardSize);
            board2.querySelectorAll('.cell').forEach(cell => {
                const row = Number(cell.dataset.row);
                const col = Number(cell.dataset.col);
                if (player1Shots[row][col] === 2) {
                    cell.classList.add('hit');
                    if (boards.player2[row][col] === 1) cell.classList.add('ship');
                }
                if (player1Shots[row][col] === 1) cell.classList.add('miss');
            });
        } else {
            player1Title.textContent = 'Ваше поле (Игрок 2)';
            player2Title.textContent = 'Поле противника (Игрок 1)';
            
            board1.innerHTML = '';
            generateBoardDOM('board1', boardSize);
            board1.querySelectorAll('.cell').forEach(cell => {
                const row = Number(cell.dataset.row);
                const col = Number(cell.dataset.col);
                if (boards.player2[row][col] === 1) {
                    cell.classList.add('ship');
                    cell.style.backgroundColor = '#00008b';
                }
                if (player1Shots[row][col] === 2) cell.classList.add('hit');
                if (player1Shots[row][col] === 1) cell.classList.add('miss');
            });
            
            board2.innerHTML = '';
            generateBoardDOM('board2', boardSize);
            board2.querySelectorAll('.cell').forEach(cell => {
                const row = Number(cell.dataset.row);
                const col = Number(cell.dataset.col);
                if (player2Shots[row][col] === 2) {
                    cell.classList.add('hit');
                    if (boards.player1[row][col] === 1) cell.classList.add('ship');
                }
                if (player2Shots[row][col] === 1) cell.classList.add('miss');
            });
        }

        board1.style.pointerEvents = 'none';  
        board2.style.pointerEvents = 'auto';  

        attachTwoPlayerBattleEvents();
    }

    function attachTwoPlayerBattleEvents() {
        const board1Cells = document.getElementById('board1').querySelectorAll('.cell');
        const board2Cells = document.getElementById('board2').querySelectorAll('.cell');
        
        board1Cells.forEach(cell => {
            cell.removeEventListener('click', twoPlayerBattleHandler);
        });
        board2Cells.forEach(cell => {
            cell.removeEventListener('click', twoPlayerBattleHandler);
        });
        
        board2Cells.forEach(cell => {
            cell.addEventListener('click', twoPlayerBattleHandler);
        });
    }

    // Инициализация после создания DOM элементов
    document.getElementById('startBtn').addEventListener('click', initGame);

    return "Sea Battle";
}
