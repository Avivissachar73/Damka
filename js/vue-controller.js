'use strict';


import EventManager from './EventManager.js';

// import utils from './services/utils.service.js';

// import {Alert, Confirm} from '../alert/alert.js';
import aAlert from '../alert/alert.js';
const alert = new aAlert('.alert-container', true);
const {Alert, Confirm} = alert;

import connectModel from './model/index.js';



const DamkaStyleCmp = {
    name: 'damka-style',
    template: `
        <style>
            <!-- BASE -->
            .damka-section * {
                box-sizing: border-box;
            }
            .damka-section {
                font-family: sans-serif;
                position: relative;
            }
            .damka-section button {
                border: unset;
                background: unset;
                padding: none;
                outline: none;
                border: 1px solid black;
                color: black;
                background-color: #fff;
                border-radius: 5px;
            } .damka-section button:hover {cursor: pointer;}
            .damka-section button:active {
                color: white;
                background-color: black;
                border-color: white;
            }

            <!-- HELPERS -->
            .damka-section .flex {
                display: flex;
            }
            .damka-section .column {
                flex-direction: column;
            }
            .damka-section .align-center {
                align-items: center;
            }
            .damka-section .justify-center {
                justify-content: center;
            }
            .damka-section .space-around {
                justify-content: space-around;
            }
            .damka-section .wrap {
                flex-wrap: wrap;
            }
            .damka-section .width-all {
                width: 100%;
            }

            <!-- LAYOUT -->
            .damka-section {
                /* background-color: #fff; */
                margin: 0 auto;
                width: 100%;
                position: relative;
            }

            <!-- CMPS -->
            <!-- CMPS -->

            <!-- GAME BOARD -->
            .damka-section .board-container {
                width: 100%;
                background-color: #fff;
            }
            .damka-section .board-container table {
                border: 5px solid burlywood;
                border-radius: 5px;
                box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.5);
                margin: 0 auto;
                width: 100%;
                height: 100%;
            }
            .damka-section .board-container table tr:nth-child(even) td:nth-child(even), .damka-section .board-container table tr:nth-child(odd) td:nth-child(odd) {
                background-color: rgb(255, 234, 164);
            }
            .damka-section .board-container table tr:nth-child(even) td:nth-child(odd), .damka-section .board-container table tr:nth-child(odd) td:nth-child(even) {
                background-color: rgb(119, 61, 36);
            }
            .damka-section .board-cell.selected {
                outline: 3px solid gold;
            }
            .damka-section .board-cell.marked {
                background-color: rgb(190, 188, 221) !important;
            }
            .damka-section .board-cell.eatable {
                background-color: rgba(255, 8, 0, 0.5) !important;
                /* background-color: rgb(252, 86, 80) !important; */
            }
            .damka-section .board-cell:hover {
                background-color: beige !important;
                cursor: pointer;
            }
            .damka-section .board-cell .player {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }
            .damka-section .player span {
                font-size: 1em;
                padding-bottom: 3px;
                position: absolute;
                bottom: 50%;
                right: 50%;
                transform: translate(50%, 50%);
            }
            .damka-section .player-1 {
                background-color: rgb(63, 94, 153);
            }
            .damka-section .player-2 {
                background-color: rgb(247, 71, 71);
            }

            <!-- GAME INFO -->
            .damka-section .game-info {
                width: 100%;
                margin: 0 auto;
                margin-bottom: 5px;
            }
            .damka-section .game-info >* {
                margin: 5px;
            }
            .damka-section .player-turn >* {
                margin-left: 5px;
            }
            .damka-section .player-turn span {
                border: 1px solid rgba(90, 89, 89, 0.5);
                box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.5);
                display: flex;
                width: 15px;
                height: 15px;
                border-radius: 50%;
            }
            .damka-section .btn-selected {
                /* background-color: rgb(177, 241, 191); */
                /* box-shadow: 0px 0px 10px 3px rgb(237, 241, 177); */
                border: 1px solid #c4c4c4;
            }
        </style>
    `
}

const CellPreview = {
    name: 'board-cell',
    template: `
        <td class="board-cell" :class="{'marked' : isMarked, 'eatable' : isEatable, 'selected' : isSelected}">
            <div v-if="cell.playerId" class="player" :class="playerClass">
                <span v-if="cell.isKing">♛</span>
            </div>
        </td>
    `,

    props: ['cell', 'eatablePoss', 'markedPoss', 'selectedPos'],

    computed: {
        isMarked() {
            return this.markedPoss.find(pos => pos.i === this.cell.pos.i && pos.j === this.cell.pos.j) ? true : false;
        },
        isEatable() {
            return this.eatablePoss.find(pos => pos.i === this.cell.pos.i && pos.j === this.cell.pos.j) ? true : false;
        },
        isSelected() {
            return this.cell.pos.i === this.selectedPos.i && this.cell.pos.j === this.selectedPos.j;
        },
        playerClass() {
            return `player-${this.cell.playerId}`;
        }
    },
}

export default {
    name: 'Damka-Cmp',
    template: `
        <section ref="BoardContainer" class="damka-section flex column align-center justify-center">
                <DamkaStyleCmp/>
                <div class="alert-container"></div>
        
                <section class="game-info width-all flex align-center space-around wrap">
                    <button :class="{'btn-selected': !isVsCom}" id="regMode" @click="onInit(false)">2 Players</button>
                    <button :class="{'btn-selected': isVsCom}" id="comMode" @click="onInit(true)">VS Com</button>
                    <button @click="onSkipTurn()">Skip Turn</button>
                    <div class="player-turn flex align-center"><p>Player: </p><span :class="currPlayerClass"></span></div>
                </section>
        
        
                <div id="board" class="board-container">
                    <table :style="{width: boardSizePx, height: boardSizePx, fontSize: fontSizePx}">
                        <tr v-for="(row, i) in board" :key="i">
                            <CellPreview v-for="(cell, j) in row" :key="cell.cellId" @click.native="onCellClicked(i,j)" 
                                    :selectedPos="selectedPos" 
                                    :cell="cell" 
                                    :eatablePoss="eatablePoss" 
                                    :markedPoss="markedPoss"/>
                        </tr>
                    </table>
                </div>
            </section>
    `,

    data() {
        return {
            board: [],
            isVsCom: false,
            selectedPos: {},
            eatablePoss: [],
            markedPoss: [],
            currPlayerTurn: null,
            currPlayerId: null,

            boardSize: '100%'
        }
    },
    
    computed: {
        currPlayerClass() {
            return `player-${this.currPlayerId}`
        },
        boardSizePx() {
            return this.boardSize + 'px'
        },
        fontSizePx() {
            return this.boardSize/12 + 'px'
        }
    },

    methods: {
        onInit(isVsCom) {
            EventManager.emit('set-game', isVsCom);
        },
        onSkipTurn() {
            EventManager.emit('skip-turn');
        },
        onCellClicked(i, j) {
            EventManager.emit('cell-clicked', {i, j});
        },

        reSizeBoard() {
            this.boardSize = this.$refs.BoardContainer.offsetWidth;
        },

        selectCellByPos(pos) {
            this.selectedPos = pos;
        },

        toggleMarkCells(poss) {
            if (this.markedPoss.lenth) this.markedPoss = [];
            else this.markedPoss = poss;
        },
        
        toggleMarkEatCells(poss) {
            if (this.eatablePoss.lenth) this.eatablePoss = [];
            else this.eatablePoss = poss;
        },

        connectEvents() {
            EventManager.on('game-seted', ({board, isVsCom}) => {
                this.board = board;
                this.isVsCom = isVsCom; 
        
                // this.reSizeBoard();
            });
            EventManager.on('select-el', pos => {
                this.selectCellByPos(pos);
            });
            EventManager.on('player-moved', (fromPos, toPos, board) => {
                board = board;
                this.board[fromPos.i][fromPos.j] = board[fromPos.i][fromPos.j];
                this.board[toPos.i][toPos.j] = board[toPos.i][toPos.j];
            });
            EventManager.on('cell-selected', (currSelectedPos, validMoves, validEatMoves) => {
                this.selectCellByPos(currSelectedPos);
                this.toggleMarkCells(validMoves);
                this.toggleMarkEatCells(validEatMoves);
            });
            EventManager.on('un-select', () => {
                this.selectedPos = {};
                this.markedPoss = [];
                this.eatablePoss = [];
            });
            EventManager.on('player-eaten', (pos, board) => {
                this.board[pos.i][pos.j] = board[pos.i][pos.j];
            });
            EventManager.on('game-over', (winnerId, isVsCom, isComWinner) => {
                if (isVsCom) {
                    console.log(isComWinner);
                    if (isComWinner) Alert(`You Lose!`);
                    else Alert(`You Win!`);
                } 
                else Alert(`Player ${winnerId} won!`);
            });
            EventManager.on('turn-setted', currPlayerId => {
                this.currPlayerId = currPlayerId;
            });
        },
        
        setReSizeBoard() {
            this.reSizeBoard();
            // window.addEventListener('resize', () => {
            //     this.reSizeBoard();
            // })
            window.onresize = this.reSizeBoard;
        },

    },
    
    mounted() {
        connectModel();
        this.connectEvents();
        this.onInit(false);
        // this.reSizeBoard();
        this.setReSizeBoard();
    },

    destroyed() {
        // window.removeEventListener('resize');
        window.onresize = null;
        // console.log('removed????');
    },

    components: {
        CellPreview,
        DamkaStyleCmp
    }
}