'use strict';

/* //// '$' means the function emits events to the event manager; //// */
/* //// '$' means the function emits events to the event manager; //// */
/* //// '$' means the function emits events to the event manager; //// */

import EventManager from '../EventManager.js';

import {copy} from '../services/utils.service.js';

export default function connectEvents() {
    EventManager.on('set-game', (isVsCom) => {
        // gState.isVsCom = isVsCom;
        $init(isVsCom);
    });
    EventManager.on('cell-clicked', ({i,j}) => {
        $cellClicked({i,j});
    });
    EventManager.on('skip-turn', () => {
        if (gState.isVsCom && gState.currPlayerIdTurn === PLAYER_COM_ID) return;
        $setGameNextTurn();
        if (gState.isVsCom && gState.currPlayerIdTurn === PLAYER_COM_ID) doComTurn(gState, true);
    })
}

import {createGameBoard, createEmptyCell, PLAYERS, BOARD_SIZE} from './board.service.js';
import {getAllEatMovesFromPos, getAllValidMovesFromPos, KING_ROW_STEP} from './move.service.js';

import {getComMove} from './com_service.js';

export const PLAYER_1_ID = 1;
export const PLAYER_2_ID = 2;
const PLAYER_COM_ID = PLAYER_2_ID;

// var gIsVsCom = false;

var gState;

function $init(isVsCom) {
    gState = setState(isVsCom);
    window.gState = gState;
    EventManager.emit('game-seted', copy(gState));
    $setGameNextTurn()
}

function setState(isVsCom) {
    var state = {
        board: createGameBoard(),
        selectedPos: null,
        validMovesPoss: [],
        validEatPoss: [],
        players: {},
        playersPoints: {},
        currPlayerIdTurn: null,
        amountOfPiecesOnBoard: 0,
        isReTurn: false,
        isGameOn: true,
        isVsCom
    }
    state.amountOfPiecesOnBoard = PLAYERS[PLAYER_1_ID].length + PLAYERS[PLAYER_2_ID].length;

    state.players = {...PLAYERS}

    state.playersPoints[PLAYER_1_ID] = 0;
    state.playersPoints[PLAYER_2_ID] = 0;

    return state;
}


async function $cellClicked(currSelectedPos) {
    if (!gState.isGameOn) return;
    var prevSelectedPos = gState.selectedPos;
    var {i,j} = currSelectedPos;
    var {board} = gState;
    var clickedCell = gState.board[i][j];
    
    if (gState.isVsCom && clickedCell.playerId === PLAYER_COM_ID) return;

    if (gState.isReTurn && 
        !gState.validEatPoss.find(pos => pos.i === currSelectedPos.i && pos.j === currSelectedPos.j)) {
        return;
    }

    if (!prevSelectedPos) {
        if (clickedCell.playerId === gState.currPlayerIdTurn) {
            toggleSelectCellByPos(currSelectedPos, gState);
    
            let validMoves = getAllValidMovesFromPos(currSelectedPos, board);
            gState.validMovesPoss = validMoves;
            let validEatMoves = getAllEatMovesFromPos(currSelectedPos, board, gState.isReTurn);
            gState.validEatPoss = validEatMoves;
    
            if (!validMoves.length && !validEatMoves.length) {
                gState.selectedPos = null;
                return;
            }
            EventManager.emit('cell-selected', copy(currSelectedPos), 
                                               copy(validMoves), 
                                               copy(validEatMoves));
            return
        } else {
            return;
        }
    } 
    else if (!(gState.validMovesPoss.find(pos => pos.i === currSelectedPos.i && pos.j === currSelectedPos.j) ||
               gState.validEatPoss.find(pos => pos.i === currSelectedPos.i && pos.j === currSelectedPos.j))) {
        
        gState.selectedPos = null;
        EventManager.emit('un-select');
        return;
    }
    else {
        let moveRes = movePiece(gState, prevSelectedPos, currSelectedPos);
        EventManager.emit('un-select');
        await $doHandleMoveRes(moveRes);
    }
}

function $checkGameVictory() {
    let possibleWinnerId = checkVictory(gState);
    if (possibleWinnerId) {
        EventManager.emit('game-over', possibleWinnerId, gState.isVsCom, possibleWinnerId === PLAYER_COM_ID);
    }
}

function $setGameNextTurn() {
    setNextTurn(gState);
    EventManager.emit('un-select');
    EventManager.emit('turn-setted', gState.currPlayerIdTurn);
}

function toggleSelectCellByPos({i, j}, state) {
    var {board} = state;

    if ((!state.selectedPos || (state.selectedPos.i !== i || state.selectedPos.j !== j)) && !board[i][j].isEmpty) {
        state.selectedPos = {i,j};
    } else {
        state.selectedPos = null;
    }
}

export function movePiece(state, fromPos, toPos) {
    var {board} = state;
    state.selectedPos = null;

    var currPiece = board[fromPos.i][fromPos.j];

    var toPosInValidMoves = state.validMovesPoss.find(curr => toPos.i === curr.i && toPos.j === curr.j);
    var toPosInValidEats = state.validEatPoss.find(curr => toPos.i === curr.i && toPos.j === curr.j);

    if (!toPosInValidMoves && !toPosInValidEats) return;

    state.validMovesPoss = [];
    state.validEatPoss = [];

    board[fromPos.i][fromPos.j].pos = toPos;
    board[toPos.i][toPos.j].pos = fromPos;
    let temp = board[fromPos.i][fromPos.j];
    board[fromPos.i][fromPos.j] = board[toPos.i][toPos.j];
    board[toPos.i][toPos.j] = temp;


    var isEaten = false;
    var eatenPos = null;
    if (toPosInValidEats) {
        isEaten = true;
        eatenPos = handleEat(fromPos, toPos, state, currPiece);
    }

    if ((toPos.i === BOARD_SIZE-1 && currPiece.movingdiff > 0) || (toPos.i === 0 && currPiece.movingdiff < 0)) {
        if (!currPiece.isKing) {
            currPiece.isKing = true;
            state.playersPoints[currPiece.playerId]++;
        }
    }
    // if  currPiece.isKing = true;

    var isMoved = true;

    let possibleNextEatPoss = getAllEatMovesFromPos(toPos, board, true);
    if (isEaten && possibleNextEatPoss.length) {
        state.isReTurn = true;
        state.selectedPos = toPos;
        state.validEatPoss = possibleNextEatPoss;
    } else {
        state.isReTurn = false;
    }

    // console.table(board.map(arr => arr.map(obj => `${obj.pos.i},${obj.pos.j}${obj.playerId && `--p${obj.playerId}` || ''}`)));
    // console.table(board.map(arr => arr.map(obj => `${obj.cellId.split('-')[2]}${obj.playerId && `--p${obj.playerId}` || ''}`)));

    return {isMoved, isReTurn: state.isReTurn, isEaten, eatenPos, fromPos, toPos};
}

function handleEat(fromPos, toPos, state, eater) {
    var {board} = state;
    let eatenPos = getEatenPos(fromPos, toPos, board);
    let eatenCell = board[eatenPos.i][eatenPos.j];
    // console.log('handling Eat', eatenCell);
    let players = state.players;
    board[eatenPos.i][eatenPos.j] = createEmptyCell(eatenPos);
    
    // try {
        let eatenIdx = players[eatenCell.playerId].findIndex(curr => curr.cellId === eatenCell.cellId);
        players[eatenCell.playerId].splice(eatenIdx, 1);
    // } catch(err) {
    //     console.log('faild to eat,', eatenCell, fromPos, toPos, eater);
    //     throw new Error();
    //     return;
    // }
    
    // if (!state.playersPoints[eater.playerId]) state.playersPoints[eater.playerId] = 0;
    state.playersPoints[eater.playerId]++;
    
    // console.log(players);
    // console.log(state.playersPoints);
    return eatenPos;
}

function getEatenPos(fromPos, toPos) {
    var diffI = 0;
    var diffJ = 0;
    let multDiff = 1
    if (fromPos.j === toPos.j || fromPos.i === toPos.i) multDiff = KING_ROW_STEP;

    if (fromPos.i > toPos.i)  diffI = 1*multDiff;
    else if (fromPos.i < toPos.i)  diffI = -1*multDiff;

    if (fromPos.j > toPos.j)  diffJ = 1*multDiff;
    else if (fromPos.j < toPos.j)  diffJ = -1*multDiff;

    return {i: toPos.i + diffI, j: toPos.j + diffJ};
}

export function setNextTurn(state) {
    state.isReTurn = false;
    state.validMovesPoss = [];
    state.validEatPoss = [];
    state.selectedPos = null;
    
    if (!state.currPlayerIdTurn) state.currPlayerIdTurn = PLAYER_1_ID;
    else state.currPlayerIdTurn = state.currPlayerIdTurn === PLAYER_1_ID ? PLAYER_2_ID : PLAYER_1_ID;
}

export function checkVictory(state) {
    // var points = state.playersPoints;
    // var pointsToWin = state.amountOfPiecesOnBoard / 2;

    // for (let key in points) {
    //     if (points[key] === pointsToWin) {
    //         state.isGameOn = false;
    //         return key;
    //     }
    // }
    var players = state.players;
    for (let playerId in players) {
        if (players[playerId].length === 0) {
            return getOtherId(playerId);
        }
    }
}


async function $doHandleMoveRes(moveRes = {}) {
    if (moveRes.isMoved) {
        EventManager.emit('player-moved', copy(moveRes.fromPos), copy(moveRes.toPos), copy(gState.board));
    }
    if (moveRes.isEaten) {
        EventManager.emit('player-eaten', copy(moveRes.eatenPos), copy(gState.board), gState.playersPoints);
    }
    if (moveRes.isReTurn) {
        if (gState.isVsCom && gState.currPlayerIdTurn === PLAYER_COM_ID) {
            doComTurn(gState, true);
        }
        else EventManager.emit('cell-selected', copy(moveRes.toPos), [], copy(gState.validEatPoss));
    } else {
            $checkGameVictory();
            $setGameNextTurn();
            if (gState.isVsCom && gState.currPlayerIdTurn === PLAYER_COM_ID) {
                await doComTurn(gState, true);
            }
    }
}

// function handleMoveRes(moveRes = {}, state, isDelay) {
//     // if (moveRes.isReturn) return;
//     // let winner = checkVictory(state);
//     // setNextTurn(state);
//     // return winner;

//     if (moveRes.isReTurn) {
//         doComTurn(state, isDelay);
//         return {isReTurn: true};
//     } else {
//         checkVictory(state);
//         setNextTurn(state);
//     }
// }

function doComTurn(state, isDelay) {
    if (!state.isGameOn) return;
    if (isDelay) {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                await computerTurn(state);
                resolve();
            }, 100);
        
        }) 
    } else return computerTurn(state);
}

async function computerTurn(state) {
    if (!state.isGameOn) return;
    var comMove = getComMove(state, undefined, true);
    if (!comMove) {
        // console.log('not a valid move available, skipped turn');
        return $setGameNextTurn();
        // return setNextTurn(srtate);
    } else {
        // console.log('got Com Move:', comMove);
        var {fromPos, toPos, isEat} = comMove;
        if (!isEat) state.validMovesPoss = [toPos];
        else state.validEatPoss = [toPos];
        // state.validMovesPoss = getAllValidMovesFromPos(fromPos, state.board);
        // state.validEatPoss = getAllEatMovesFromPos(fromPos, state.board, state.isReTurn);
        var moveRes = movePiece(state, fromPos, toPos);
        await $doHandleMoveRes(moveRes);
        // $checkGameVictory();
    }
}

export function getOtherId(id) {
    id = +id;
    return id === PLAYER_1_ID ? PLAYER_2_ID : PLAYER_1_ID;
}