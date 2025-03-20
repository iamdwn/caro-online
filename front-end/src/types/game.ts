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
    player2Id?: string;
    player2Name?: string;
    status: 'Waiting' | 'InProgress' | 'Finished' | 'Cancelled';
} 