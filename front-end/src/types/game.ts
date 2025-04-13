export enum GameStatus {
    Waiting = 'Waiting',
    InProgress = 'InProgress',
    Finished = 'Finished',
    Cancelled = 'Cancelled'
}

export type BoardCell = 0 | 1 | 2;
export type Board = BoardCell[];

export interface Move {
    row: number;
    col: number; 
    playerId: string;
}

export interface Game {
    id: string;
    roomName: string;
    player1Id: string | null;
    player1Name: string | null;
    player2Id: string | null;
    player2Name: string | null;
    board: Board;
    status: GameStatus;
    currentTurn?: string | null;
    winner: string | null;
    moves: Move[];
    createdAt: string;
    finishedAt: string;
    endedAt: string | null;
    duration: string | null;
}

export const BOARD_SIZE = 50;
export const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;

export function createEmptyBoard(): Board {
    return new Array(TOTAL_CELLS).fill(0);
}

export function parseBoard(boardData: string | number[]): Board {
    if (Array.isArray(boardData)) {
        return boardData as Board;
    }
    
    try {
        const parsed = JSON.parse(boardData);
        if (Array.isArray(parsed) && parsed.length === TOTAL_CELLS) {
            return parsed as Board;
        }
    } catch (e) {
        console.error('Failed to parse board data:', e);
    }

    return createEmptyBoard();
}

export function getBoardCell(board: Board, row: number, col: number): BoardCell {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
        return 0;
    }
    return board[row * BOARD_SIZE + col];
}

export function setBoardCell(board: Board, row: number, col: number, value: BoardCell): Board {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
        return board;
    }
    const newBoard = [...board];
    newBoard[row * BOARD_SIZE + col] = value;
    return newBoard;
}

export function reconstructBoardFromMoves(moves: Move[]): Board {
    const board = createEmptyBoard();
    moves.forEach((move, index) => {
        const value = (index % 2 === 0) ? 1 : 2;
        setBoardCell(board, move.row, move.col, value as BoardCell);
    });
    return board;
} 