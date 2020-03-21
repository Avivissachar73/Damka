'use strict';

import utils from '../services/utils.service.js';


import {PLAYER_1_ID, PLAYER_2_ID} from './index.js';

export const BOARD_SIZE = 6;

export const PLAYERS = {};

export function createGameBoard() {
    PLAYERS[PLAYER_1_ID] = [];
    PLAYERS[PLAYER_2_ID] = [];

    var board = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        board[i] = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
            board[i][j] = createInitializedCell({i,j});
        }
    }
    // board[4][2].isKing = true;
    // board[1][3].isKing = true;
    return board;
}

function createInitializedCell(pos) {
    var {i, j} = pos;
    if (i < Math.floor(BOARD_SIZE/8*3) && (i%2 !== 0 && j%2 !== 0 || i%2 === 0 && j%2 === 0)) {
        let player =  createPlayerCell(PLAYER_1_ID, pos, 1);
        PLAYERS[PLAYER_1_ID].push(player)
        return player;
    } else if (i >= Math.ceil(BOARD_SIZE/8*5) && (i%2 !== 0 && j%2 !== 0 || i%2 === 0 && j%2 === 0)) {
        let player =  createPlayerCell(PLAYER_2_ID, pos, -1);
        PLAYERS[PLAYER_2_ID].push(player)
        return player;
    }
    return createEmptyCell(pos);
}


export function createEmptyCell(pos) {
    return {
        isEmpty: true,
        cellId: utils.getRandomId(),
        pos
    };
}


function createPlayerCell(playerId, pos, movingdiff) {
    return {
        playerId,
        cellId: utils.getRandomId(),
        isKing: false,
        movingdiff,
        pos
    }
}