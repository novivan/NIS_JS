document.getElementById('startBtn').addEventListener('click', initGame);

let boardSize, mode;
let currentPlayer = 1;
let isBotMoving = false; 
let playerCanShoot = true; 
let boards = {}; 
let shipPlacementPhase = false;
const shipsCount = () => Math.floor(boardSize / 2);


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
        
        document.getElementById('board1').style.display = 'grid';
        document.getElementById('board2').style.display = 'grid';
        document.getElementById('board2').style.visibility = 'hidden';
        
        gameState = 'placement';
        currentPlayer = 1;
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
    for(let i = 0; i < boardSize; i++){
        for(let j = 0; j < boardSize; j++){
            if(board[i][j] === 1) {
                let cell = document.querySelector(`${boardSelector} .cell[data-row='${i}'][data-col='${j}']`);
                if(cell && !cell.classList.contains('hit')) return false;
            }
        }
    }
    return true;
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
    document.getElementById('board1').style.visibility = 'hidden';
    document.getElementById('board2').style.visibility = 'visible';
    document.getElementById('placementMsg').textContent = `Игрок 2: Разместите корабль длиной ${shipsToPlace[0]}`;
    clearSelection();
    attachTwoPlayerPlacementEvents();
}

function startTwoPlayerBattle() {
    gameState = 'battle';
    currentPlayer = 1;
    document.getElementById('placementMsg').style.display = 'none';
    document.getElementById('shipHint').style.display = 'none';
    
    document.getElementById('board1').style.visibility = 'visible';
    document.getElementById('board2').style.visibility = 'visible';
    
    hideShips();
    attachTwoPlayerBattleEvents();
    updateTurnMessage();
}

function hideShips() {
    const ships1 = document.getElementById('board1').querySelectorAll('.ship:not(.hit)'); 
    const ships2 = document.getElementById('board2').querySelectorAll('.ship:not(.hit)');
    [...ships1, ...ships2].forEach(cell => {
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
    
    const targetBoard = currentPlayer === 1 ? 'board2' : 'board1';
    const targetCells = document.getElementById(targetBoard).querySelectorAll('.cell');
    targetCells.forEach(cell => {
        cell.addEventListener('click', twoPlayerBattleHandler);
    });
}

function twoPlayerBattleHandler(e) {
    if(gameState !== 'battle') return;
    const cell = e.target;
    if(cell.classList.contains('hit') || cell.classList.contains('miss')) return;
    
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const targetBoard = currentPlayer === 1 ? boards.player2 : boards.player1;
    
    cell.classList.add('shooting');
    setTimeout(() => {
        cell.classList.remove('shooting');
        if(targetBoard[row][col] === 1) {
            cell.classList.add('hit');
            cell.classList.add('ship'); 
            if(isTwoPlayerShipSunk(row, col, targetBoard, currentPlayer === 1 ? '#board2' : '#board1')) {
                markTwoPlayerSurrounding(row, col, targetBoard, currentPlayer === 1 ? '#board2' : '#board1');
            }
            if(checkVictory(targetBoard, currentPlayer === 1 ? '#board2' : '#board1')) {
                gameEnd(`victory_player${currentPlayer}`);
                return;
            }
        } else {
            cell.classList.add('miss');
            switchPlayer();
        }
    }, 500);
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
        for(let dr = -1; dr <= 1; dr++) {
            for(let dc = -1; dc <= 1; dc++) {
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
    const board1 = document.getElementById('board1');
    const board2 = document.getElementById('board2');
    
    if(currentPlayer === 1) {
        currentPlayer = 2;
        board1.style.pointerEvents = 'auto';
        board2.style.pointerEvents = 'none';
    } else {
        currentPlayer = 1;
        board1.style.pointerEvents = 'none';
        board2.style.pointerEvents = 'auto';
    }
    
    attachTwoPlayerBattleEvents();
    updateTurnMessage();
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
