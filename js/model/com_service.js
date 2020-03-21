'use strict';

import {getRandomInt} from '../services/utils.service.js';

// import {createEmptyCell} from './board.service.js';
import {getAllEatMovesFromPos, getAllValidMovesFromPos} from './move.service.js';

import {movePiece, setNextTurn, checkVictory, getOtherId} from './index.js';

var gAmountOfMovesToCheck = 3;

export function getComMove(state, amountOfMovesToPlay = gAmountOfMovesToCheck, isRoot) {
    state = JSON.parse(JSON.stringify(state));
    var currPlayerId = state.currPlayerIdTurn;

    var players = state.players[currPlayerId];

    var allValidMoves = [];
    var allValidEatMoves = [];

    var isReTurn = state.isReTurn;

    var playersToCheck = players;
    if (isReTurn) {
        playersToCheck = [state.board[state.selectedPos.i][state.selectedPos.j]];
        // if (isRoot) console.log('another turn to COM, players to check:', playersToCheck);
    }

    playersToCheck.forEach(curr => {
        let currValids = getAllValidMovesFromPos(curr.pos, state.board);
        currValids.forEach(pos => {
            allValidMoves.push({fromPos: curr.pos, toPos: pos, isEat: false});
        });

        let currEatValids = getAllEatMovesFromPos(curr.pos, state.board, state.isReTurn);
        currEatValids.forEach(pos => {
            allValidEatMoves.push({fromPos: curr.pos, toPos: pos, isEat: true});
        });
    });

    var allMoves = [...allValidEatMoves, ...allValidMoves];
    // if (isRoot) console.log('moves:', allValidMoves, '\neats:', allValidEatMoves);
    if (!allMoves.length) return;

    return getBestMove(allMoves, state, isRoot, amountOfMovesToPlay);
    // return getSimpleNextMove(allMoves, state);
    // if (isRoot) return getBestMove(allMoves, state, isRoot);
    // else return getSimpleNextMove(allMoves, state);
}

function getSimpleNextMove(moves) {
    var eatMoves = moves.filter(move => move.isEat);
    var regMoves = moves.filter(move => !move.isEat);

    if (eatMoves.length) {
        return eatMoves[getRandomInt(0, eatMoves.length-1)];
    } else {
        return regMoves[getRandomInt(0, regMoves.length-1)];
    }
}

function getBestMove(moves, state, isRoot, amountOfMovesToPlay) {
    state = JSON.parse(JSON.stringify(state));
    
    var friendlyId = state.currPlayerIdTurn;
    var enemyId = getOtherId(friendlyId);

    var prevPoints = {...state.playersPoints};

    for (let move of moves) {
        let currPoints = playNthMovesFromMove(move, amountOfMovesToPlay, state, isRoot).playersPoints;

        move.score = (currPoints[friendlyId] - prevPoints[friendlyId]) - (currPoints[enemyId] - prevPoints[enemyId]);
    }
    // if (isRoot) console.log('moves setted:', moves);
            
    var bestScore = moves.sort((a, b) => b.score - a.score)[0].score;
    var bestMoves = moves.filter(move => move.score === bestScore);
    var moveToReturn = bestMoves[getRandomInt(0, bestMoves.length-1)];
    return moveToReturn;
}


function comPlay(state, move, amountOfMovesToPlay) {
    if (!state.isGameOn || !move) return;
    if (!move.isEat) state.validMovesPoss = [move.toPos];
    else state.validEatPoss = [move.toPos];
    // state.validMovesPoss = getAllValidMovesFromPos(fromPos, state.board);
    // state.validEatPoss = getAllEatMovesFromPos(fromPos, state.board, state.isReTurn);
    var moveRes = movePiece(state, move.fromPos, move.toPos);
    if (moveRes.isReTurn) {
        comPlay(state, getComMove(state, amountOfMovesToPlay, false));
    } else {
        checkVictory(state);
        setNextTurn(state);
    }
}


function playNthMovesFromMove(move, amountOfMovesToPlay, state, isRoot) {
    state = JSON.parse(JSON.stringify(state));
    var moveToPlay = {...move};

    if (amountOfMovesToPlay <= 0) return state;

    for (let i = 0; i < amountOfMovesToPlay; i++) {
        if (!state.isGameOn || amountOfMovesToPlay <= 0) break;
        for (let playerKey in state.players) {
            if (!state.isGameOn || amountOfMovesToPlay <= 0) break;
            comPlay(state, moveToPlay, amountOfMovesToPlay--);
            moveToPlay = getComMove(state, amountOfMovesToPlay--, false);
        }
    }
    return state;
}