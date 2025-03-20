export enum GameStatus {
    Waiting = 'Waiting',
    InProgress = 'InProgress',
    Finished = 'Finished',
    Cancelled = 'Cancelled'
}

export interface Game {
    id: string;
    roomName: string;
    player1Id: string;
    player1Name: string;
    player2Id?: string | null;
    player2Name?: string | null;
    status: string;
    currentTurn?: string;
    board?: number[];
    winner?: string;
    createdAt: Date;
} 