document.getElementById('startBtn').addEventListener('click', initGame);

let boardSize, mode;
let currentPlayer = 1;
let isBotMoving = false; // Новый флаг для отслеживания хода бота
let playerCanShoot = true; // Новый флаг для контроля возможности выстрела игрока
let boards = {}; // boards.player и boards.bot для режима single
let shipPlacementPhase = false;
const shipsCount = () => Math.floor(boardSize / 2);

// Новые переменные для state machine и расстановки кораблей
let gameState = 'setup'; // 'placement', 'battle', 'end'
let shipsToPlace = [];
let currentShipIndex = 0;
let placementStart = null; // {row, col, el}

function initGame() {
    mode = document.getElementById('mode').value;
    boardSize = parseInt(document.getElementById('boardSize').value);
    
    // Определяем набор кораблей в зависимости от размера поля
    if (boardSize === 10) {
        shipsToPlace = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1]; 
    } else if (boardSize === 15) {
        shipsToPlace = [8, 7, 6, 6, 5, 4, 3, 2, 2, 1];
    } else if (boardSize === 20) {
        shipsToPlace = [10, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3];
    }
    
    // Очистка полей
    document.getElementById('board1').innerHTML = '';
    document.getElementById('board2').innerHTML = '';
    
    // Генерация DOM (перенесено сюда)
    generateBoardDOM('board1', boardSize);
    generateBoardDOM('board2', boardSize);
    
    if(mode === 'single') {
        boards = {
            player: createEmptyBoard(boardSize),
            bot: createEmptyBoard(boardSize)
        };
        // Вместо случайного одиночного размещения вызываем функцию расстановки кораблей для бота
        placeBotShips(boards.bot);
        gameState = 'placement';
        currentShipIndex = 0;
        document.getElementById('confirmShipsBtn').style.display = 'none';
        document.getElementById('placementMsg').style.display = 'block';
        document.getElementById('placementMsg').textContent = `Разместите корабль длиной ${shipsToPlace[currentShipIndex]}`;
        document.getElementById('shipHint').style.display = 'block';
        attachPlacementEvents();
    } else {
        // Режим двух игроков
        boards = {
            player1: createEmptyBoard(boardSize),
            player2: createEmptyBoard(boardSize)
        };
        
        gameState = 'placement';
        currentPlayer = 1;
        document.getElementById('player2Title').textContent = 'Игрок 2';
        document.getElementById('placementMsg').style.display = 'block';
        document.getElementById('placementMsg').textContent = `Игрок 1: Разместите корабль длиной ${shipsToPlace[0]}`;
        document.getElementById('shipHint').style.display = 'block';
        document.getElementById('board2').style.pointerEvents = 'none';
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
    boardContainer.style.gridTemplateColumns = `repeat(${size}, 30px)`;
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

// Новая функция для автоматической расстановки кораблей по правилам
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
    // Если клетка уже занята кораблём, пропускаем
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
            // горизонтальное размещение
            const min = Math.min(start.col, col);
            const max = Math.max(start.col, col);
            for(let c = min; c <= max; c++){
                shipCells.push({row: row, col: c});
            }
        } else if(start.col === col) {
            // вертикальное размещение
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
        // Проверяем соответствие требуемой длине
        if(shipCells.length !== shipsToPlace[currentShipIndex]){
            alert(`Длина выбранного корабля должна быть ${shipsToPlace[currentShipIndex]}`);
            clearSelection();
            return;
        }
        // Проверка: корабли не должны касаться (включая диагонали)
        if(!isValidPlacement(shipCells)) {
            alert('Нельзя ставить корабли вплотную друг к другу или перекрывать их.');
            clearSelection();
            return;
        }
        // Размещаем корабль
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
            msg.classList.remove('smaller'); // Вернуть обычный размер для следующей подсказки, если требуется
        } else {
            // Переводим игру в фазу боя, скрываем подсказку для расстановки
            gameState = 'battle';
            document.getElementById('placementMsg').style.display = 'none';
            document.getElementById('shipHint').style.display = 'none';
            detachPlacementEvents();
            // Восстанавливаем возможность клика по полю противника
            document.getElementById('board2').style.pointerEvents = 'auto';
            attachShootingEvents();
        }
    }
}

function clearSelection() {
    // Убираем выделение со всех клеток
    const selected = document.getElementById('board1').querySelectorAll('.cell.selected');
    selected.forEach(cell => cell.classList.remove('selected'));
    placementStart = null;
}

// Проверка корректности расстановки корабля: клетка и все её соседние не должны быть заняты
function isValidPlacement(shipCells) {
    for (let pos of shipCells) {
        if(boards.player[pos.row][pos.col] === 1) return false;
        // Проверяем соседей (8 направлений)
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

// Изменённый attachShootingEvents: в режиме 'battle' клики доступны только по полю бота
function attachShootingEvents() {
    const boardCells = document.getElementById('board2').querySelectorAll('.cell');
    boardCells.forEach(cell => {
        cell.addEventListener('click', shootingHandler);
    });
    // Отображаем подсказку для хода игрока
    document.getElementById('turnHint').style.display = 'block';
}

// Новая функция для отключения кликов по полю бота
function detachShootingEvents() {
    const boardCells = document.getElementById('board2').querySelectorAll('.cell');
    boardCells.forEach(cell => {
        cell.removeEventListener('click', shootingHandler);
    });
    // Скрываем подсказку, когда ход не игрока
    document.getElementById('turnHint').style.display = 'none';
}

// Изменённый обработчик выстрела игрока:
function shootingHandler(e) {
    if(gameState !== 'battle' || isBotMoving || !playerCanShoot) {
        e.stopImmediatePropagation();
        e.preventDefault();
        return;
    }
    // Убираем detachShootingEvents() здесь, чтобы не блокировать клики преждевременно
    playerCanShoot = false; // блокируем повторный выстрел
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
            // При попадании даём игроку возможность стрелять сразу
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

// Функция проверки уничтожения корабля на поле бота (board2)
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

// Функция, которая для уничтоженного корабля на поле бота закрашивает все соседние клетки (все 8 направлений)
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

// Аналогичная логика для хода бота: он ходит по полю игрока (board1)
function botMove() {
    isBotMoving = true; // Бот начинает ход
    detachShootingEvents(); // отключаем клики по полю противника
    document.getElementById('board2').style.pointerEvents = 'none'; // блокируем клики по полю противника
    let row, col, cell;
    do {
        row = Math.floor(Math.random() * boardSize);
        col = Math.floor(Math.random() * boardSize);
        cell = document.querySelector(`#board1 .cell[data-row='${row}'][data-col='${col}']`);
    } while(cell.classList.contains('hit') || cell.classList.contains('miss')); // удалена проверка на .ship
    
    // Делаем анимацию выстрела
    return new Promise(resolve => {
        // Добавляем класс анимации
        cell.classList.add('shooting');
        
        // Ждем окончания анимации
        setTimeout(() => {
            cell.classList.remove('shooting');
            
            // Показываем результат выстрела
            if(boards.player[row][col] === 1) {
                cell.classList.add('hit');
                if(isShipSunkPlayer(row, col)) {
                    markSurroundingPlayer(row, col);
                }
                if(checkVictory(boards.player, '#board1')) {
                    gameEnd('defeat');
                    return;
                }
                // Бот стреляет снова при попадании
                setTimeout(() => { botMove().then(resolve); }, 500);
            } else {
                cell.classList.add('miss');
                isBotMoving = false; // Бот завершил свои выстрелы, даём ход игроку
                document.getElementById('board2').style.pointerEvents = 'auto'; // восстанавливаем клики по полю противника
                attachShootingEvents(); // восстанавливаем обработчик кликов по клеткам
                playerCanShoot = true; // разрешаем ход игрока после окончания хода бота
                resolve();
            }
        }, 500);
    });
}

// Проверка уничтожения корабля на поле игрока (board1)
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

// Закраска соседних клеток вокруг уничтоженного корабля игрока
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
            // Исправляем опечатку здесь: было dr <= 1, стало dc <= 1
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
    // Для режима двух игроков (оригинальный обработчик)
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
    // Игрок стреляет по доске бота ( режима single )
    const row = cell.dataset.row;
    const col = cell.dataset.col;
    if(cell.classList.contains('hit') || cell.classList.contains('miss')) return;
    
    if(boards.bot[row][col] === 1) {
        cell.classList.add('hit');
    } else {
        cell.classList.add('miss');
    }
    // Ход бота: стреляет по полю игрока (board1)
    setTimeout(botMove, 500);
}


// Функция проверки победы по заданной доске (board) и селектору DOM-контейнера
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

// Функция завершения игры. result = 'victory' или 'defeat'
function gameEnd(result) {
    gameState = 'end';
    if(result === 'victory'){
        alert("Поздравляем! Вы победили!");
    } else {
        alert("Вы проиграли!");
    }
    // Создаём кнопку "В главное меню"
    const menuBtn = document.createElement('button');
    menuBtn.textContent = "В главное меню";
    menuBtn.addEventListener('click', () => {
        location.reload();
    });
    // Добавляем кнопку в элемент управления или body
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
    
    if(!placementStart) {
        placementStart = {row, col, el: cell};
        cell.classList.add('selected');
        document.getElementById('placementMsg').textContent = 
            `Игрок ${currentPlayer}: Выберите другой конец корабля длиной ${shipsToPlace[currentShipIndex]}`;
    } else {
        // Логика размещения корабля (аналогично существующей)
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
                // Переход к расстановке второго игрока
                currentPlayer = 2;
                currentShipIndex = 0;
                document.getElementById('board1').style.pointerEvents = 'none';
                document.getElementById('board2').style.pointerEvents = 'auto';
                document.getElementById('placementMsg').textContent = 
                    `Игрок 2: Разместите корабль длиной ${shipsToPlace[0]}`;
                attachTwoPlayerPlacementEvents();
            } else {
                // Начало битвы
                startTwoPlayerBattle();
            }
        } else {
            document.getElementById('placementMsg').textContent = 
                `Игрок ${currentPlayer}: Разместите корабль длиной ${shipsToPlace[currentShipIndex]}`;
        }
    }
}

function startTwoPlayerBattle() {
    gameState = 'battle';
    currentPlayer = 1;
    document.getElementById('placementMsg').style.display = 'none';
    document.getElementById('shipHint').style.display = 'none';
    document.getElementById('board1').style.pointerEvents = 'none';
    document.getElementById('board2').style.pointerEvents = 'auto';
    attachTwoPlayerBattleEvents();
    updateTurnMessage();
}

function attachTwoPlayerBattleEvents() {
    const targetBoard = currentPlayer === 1 ? 'board2' : 'board1';
    const boardCells = document.getElementById(targetBoard).querySelectorAll('.cell');
    boardCells.forEach(cell => {
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
    updateTurnMessage();
}

function updateTurnMessage() {
    const turnHint = document.getElementById('turnHint');
    turnHint.style.display = 'block';
    turnHint.textContent = `Ход Игрока ${currentPlayer}`;
}

// Модифицируем функцию gameEnd для поддержки двух игроков
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

// Добавляем недостающую функцию calculateShipCells
function calculateShipCells(start, end) {
    let shipCells = [];
    if(start.row === end.row) {
        // горизонтальное размещение
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
        // вертикальное размещение
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

// Добавляем функцию проверки размещения для режима двух игроков
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

// Добавляем функцию размещения корабля на доске
function placeShipOnBoard(shipCells, playerNum) {
    const board = playerNum === 1 ? 'board1' : 'board2';
    const boardData = boards[`player${playerNum}`];
    
    shipCells.forEach(pos => {
        const cellEl = document.querySelector(`#${board} .cell[data-row='${pos.row}'][data-col='${pos.col}']`);
        cellEl.classList.add('ship');
        boardData[pos.row][pos.col] = 1;
    });
}
