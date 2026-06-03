let boardState = [0, 0, 0, 0, 0, 0, 0, 0, 0];
let model = null;
let gameActive = false;

const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');

function createBoard() {
    boardElement.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.addEventListener('click', () => handlePlayerMove(i));
        boardElement.appendChild(cell);
    }
    updateVisuals();
}

function loadModel() {
    tf.ready()
        .then(() => {
            tf.loadLayersModel('./model.json')
                .then((loadedModel) => {
                    model = loadedModel;
                    statusElement.innerText = '¡Modelo cargado! Tu turno (X)';
                    gameActive = true;
                    createBoard();
                })
                .catch((err) => {
                    console.warn('No se pudo cargar model.json; usando IA básica.', err);
                    statusElement.innerText = 'Modelo no disponible; usando IA básica. Tu turno (X)';
                    gameActive = true;
                    createBoard();
                });
        })
        .catch((err) => {
            console.warn('TensorFlow.js no pudo iniciarse.', err);
            statusElement.innerText = 'No se pudo iniciar TensorFlow.js. Tu turno (X)';
            gameActive = true;
            createBoard();
        });
}

loadModel();

function handlePlayerMove(index) {
    if (!gameActive || boardState[index] !== 0) return;

    boardState[index] = -1;
    updateVisuals();

    if (checkWinner(-1)) {
        endGame('¡Ganaste!');
        return;
    }

    if (!boardState.includes(0)) {
        endGame('¡Empate!');
        return;
    }

    statusElement.innerText = 'La IA está pensando... ( ˘-˘ )';
    gameActive = false;

    setTimeout(() => makeAIMove(), 350);
}

function makeAIMove() {
    const bestMove = model ? getModelMove() : getFallbackMove();

    if (bestMove !== -1) {
        boardState[bestMove] = 1;
        updateVisuals();

        if (checkWinner(1)) {
            endGame('¡La IA gana! (╥﹏╥)');
            return;
        }

        if (!boardState.includes(0)) {
            endGame('¡Empate!');
            return;
        }

        statusElement.innerText = '¡Tu turno (X)!';
        gameActive = true;
    }
}

function getModelMove() {
    let bestMove = -1;
    let highestProb = -Infinity;

    try {
        const inputTensor = tf.tensor2d([boardState]);
        const prediction = model.predict(inputTensor);
        const probabilities = prediction.dataSync();

        for (let i = 0; i < 9; i++) {
            if (boardState[i] === 0 && probabilities[i] > highestProb) {
                highestProb = probabilities[i];
                bestMove = i;
            }
        }

        inputTensor.dispose();
        prediction.dispose();
    } catch (err) {
        console.warn('Predicción del modelo falló; usando IA básica.', err);
        return getFallbackMove();
    }

    return bestMove;
}

function getFallbackMove() {
    const winningMove = findMoveForPlayer(1);
    if (winningMove !== -1) return winningMove;

    const blockingMove = findMoveForPlayer(-1);
    if (blockingMove !== -1) return blockingMove;

    const priorityMoves = [4, 0, 2, 6, 8, 1, 3, 5, 7];
    for (const move of priorityMoves) {
        if (boardState[move] === 0) return move;
    }

    return -1;
}

function findMoveForPlayer(player) {
    for (let i = 0; i < 9; i++) {
        if (boardState[i] !== 0) continue;

        const trial = [...boardState];
        trial[i] = player;

        if (checkBoardWinner(trial, player)) {
            return i;
        }
    }
    return -1;
}

function checkBoardWinner(board, player) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    return winPatterns.some((pattern) => pattern.every((index) => board[index] === player));
}

function updateVisuals() {
    const cells = document.querySelectorAll('.cell');
    for (let i = 0; i < 9; i++) {
        const cell = cells[i];
        if (!cell) continue;

        if (boardState[i] === -1) {
            cell.innerText = 'X';
            cell.style.color = '#ff66a3';
        } else if (boardState[i] === 1) {
            cell.innerText = 'O';
            cell.style.color = '#8e44ad';
        } else {
            cell.innerText = '';
            cell.style.color = '#ff66a3';
        }
    }
}

function checkWinner(player) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    return winPatterns.some((pattern) => pattern.every((index) => boardState[index] === player));
}

function endGame(message) {
    statusElement.innerText = message;
    gameActive = false;
}
