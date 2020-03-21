'use strict';

import EventManager from './EventManager.js';

// import utils from './services/utils.service.js';
import A_Alert from '../alert/alert.js';
const {Alert, Confirm} = new A_Alert();

import connectModel from './model/index.js';


const BOARD_SELECTOR = '#board';
const MARKED_CLASS = 'marked';
const SELECTED_CLASS = 'selected'
const MARKED_TO_EAT_CLASS = 'eatable'

document.body.onload = () => {
    connectModel();
    connectEvents();
    init(true);
    setReSizeBoard();
}
window.cellClicked = cellClicked;
window.onSkipTurn = onSkipTurn;
window.init = init;

function init(isVsCom) {
    EventManager.emit('set-game', isVsCom);
}

function connectEvents() {
    EventManager.on('game-seted', ({board, isVsCom}) => {
        renderBoard(board);

        reSizeBoard();
        isVsCom ? 
            selectBtn('comMode') :
            selectBtn('regMode') ;
    });
    EventManager.on('select-el', pos => {
        selectElByPos(pos);
    });
    EventManager.on('clear-select', () => {
        clearAllElsClass(SELECTED_CLASS);
    });
    EventManager.on('player-moved', (fromPos, toPos, board) => {
        renderCellByPos(fromPos, board);
        renderCellByPos(toPos, board);
    });
    EventManager.on('cell-selected', (currSelectedPos, validMoves, validEatMoves) => {
        toggleSelectCellByPos(currSelectedPos);
        toggleMarkCells(validMoves);
        // console.log('toggling moves,', validMoves)
        toggleMarkEatCells(validEatMoves);
    });
    EventManager.on('un-select', () => {
        clearAllElsClass(SELECTED_CLASS);
        clearAllElsClass(MARKED_CLASS);
        clearAllElsClass(MARKED_TO_EAT_CLASS);
    });
    EventManager.on('player-eaten', (pos, board) => {
        renderCellByPos(pos, board);
    });
    EventManager.on('game-over', winnerId => {
        Alert(`Player ${winnerId} won!`);
        // init();
    });
    EventManager.on('turn-setted', currPlayerId => {
        renderCurrPlayerTurn(currPlayerId);
    });
}

function cellClicked(i, j) {
    EventManager.emit('cell-clicked', {i, j});
}

function renderBoard(board) {
    var htmlStr = '<table>';
    for (let i = 0; i < board.length; i++) {
        htmlStr += '<tr>';
        for (let j = 0; j < board[i].length; j++) {
            htmlStr += `<td  id="${getCellIdByPos({i,j})}" class="board-cell" onclick="cellClicked(${i}, ${j})">
                            ${getCellHtmlStr(board[i][j])}
                        </td>`
        }
        htmlStr += '</tr>';
    }
    htmlStr += '</table>';
    document.querySelector(BOARD_SELECTOR).innerHTML = htmlStr;
}


function toggleSelectCellByPos({i, j}) {
    var el = getElementByPos({i, j});
    el.classList.toggle(SELECTED_CLASS);
}

function clearAllElsClass(className) {
    var els = document.querySelectorAll(`.${className}`);
    els.forEach(curr => curr.classList.remove(className));
}

function getElementByPos(pos) {
    var elCellId = getCellIdByPos(pos);
    return document.querySelector(`#${elCellId}`);
}

function getCellIdByPos({i,j}) {
    return `cell-${i}-${j}`;
}

function renderCellByPos(pos, board) {
    var cellId = getCellIdByPos(pos);
    var value = getCellHtmlStr(board[pos.i][pos.j]);
    document.querySelector(`#${cellId}`).innerHTML = value;
}

function getCellHtmlStr(cell) {
    // '♔♕ K ♚♛';
    if (cell.isEmpty) return '';
    else return `<div class="player player-${cell.playerId}">${cell.isKing? '<span>♛</span>' : ''}</div>`;
}

function  selectElByPos(pos) {
    clearAllElsClass(SELECTED_CLASS);
    var elCell = getElementByPos(pos);
    elCell.classList.add(SELECTED_CLASS);
}

function addClassToCellsByPosses(poses, selector) {
    let els = getElsByPoses(poses)
    els.forEach(curr => curr.classList.add(selector));
}

function getElsByPoses(poss) {
    return poss.map(currPos => {
        return getElementByPos(currPos);
    });
}

function toggleMarkCells(validMoves) {
    var markedEls = document.querySelectorAll(`.${MARKED_CLASS}`);
    if (markedEls.length) clearAllElsClass(MARKED_CLASS);
    else addClassToCellsByPosses(validMoves, MARKED_CLASS);
}

function toggleMarkEatCells(poses) {
    var markedEls = document.querySelectorAll(`.${MARKED_TO_EAT_CLASS}`);
    if (markedEls.length) clearAllElsClass(MARKED_TO_EAT_CLASS);
    else addClassToCellsByPosses(poses, MARKED_TO_EAT_CLASS);
}

function onSkipTurn() {
    EventManager.emit('skip-turn');
}

function renderCurrPlayerTurn(currPlayerId) {
    var elTurnSpan = document.querySelector('.player-turn span');
    elTurnSpan.classList = `player-${currPlayerId}`;
}



function selectBtn(btnId) {
    const btnSelectedClass = 'btn-selected';
    document.querySelectorAll(`.${btnSelectedClass}`).forEach(elBtn => {
        elBtn.classList.remove(btnSelectedClass);
    });
    document.querySelector(`#${btnId}`).classList.add(btnSelectedClass);
}


function setReSizeBoard() {
    reSizeBoard();
    window.addEventListener('resize', () => {
        reSizeBoard();
    });
}
function reSizeBoard() {
    var elBoard = document.querySelector(BOARD_SELECTOR);
    var boardWidth = elBoard.offsetWidth;
    let elBoardTable = elBoard.querySelector('table');
    elBoardTable.style.width = boardWidth + 'px';
    elBoardTable.style.height = boardWidth + 'px';
    elBoardTable.style['font-size'] = boardWidth/12 + 'px';
}