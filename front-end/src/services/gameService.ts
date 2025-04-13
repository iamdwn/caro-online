import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { Game } from '../types/game';
import { HubConnectionState } from '@microsoft/signalr';

class GameService {
    private connection: HubConnection | null = null;
    private connectionPromise: Promise<void> | null = null;
    private errorCallback: ((message: string) => void) | null = null;
    private gameCreatedCallback: ((game: Game) => void) | null = null;
    private gameJoinedCallback: ((game: Game) => void) | null = null;
    private gameUpdatedCallback: ((game: Game) => void) | null = null;
    private availableRoomsCallback: ((rooms: Game[]) => void) | null = null;

    constructor() {
        this.setupConnection();
    }

    private async setupConnection() {
        if (this.connection) return;

        // const apiUrl = process.env.REACT_APP_API_BASE_URL;
        // const apiUrl = 'https://caro-be.iamdwn.dev';
        const apiUrl = 'http://localhost:5071';

        if (!apiUrl) {
            console.error('API Base URL not defined');
            return;
        }

        this.connection = new HubConnectionBuilder()
            // .withUrl('https://caro-be.iamdwn.dev/gameHub')
            .withUrl(apiUrl + '/gameHub')
            .withAutomaticReconnect([0, 1000, 2000, 5000])
            .configureLogging(LogLevel.Warning)
            .build();

        this.connection.on('connected', () => {
            console.log('Connected event received from server');
        });     

        this.connection.on('gameCreated', (game: Game) => {
            if (this.gameCreatedCallback) {
                this.gameCreatedCallback(game);
            }
        });

        this.connection.on('gameJoined', (game: Game) => {
            if (this.gameJoinedCallback) {
                this.gameJoinedCallback(game);
            }
        });

        this.connection.on('gameUpdated', (game: Game) => {
            if (this.gameUpdatedCallback) {
                this.gameUpdatedCallback(game);
            }
        });

        this.connection.on('availableRooms', (rooms: Game[]) => {
            if (this.availableRoomsCallback) {
                this.availableRoomsCallback(rooms);
            }
        });

        this.connection.on('error', (message: string) => {
            if (this.errorCallback) {
                this.errorCallback(message);
            }
        });

        this.connection.onclose(() => {
            this.connectionPromise = null;
        });

        this.connection.onreconnecting(() => {
            console.log('Reconnecting...');
        });

        this.connection.onreconnected(() => {
            this.getAvailableRooms();
        });
    }

    private async ensureConnection() {
        if (!this.connection) {
            await this.setupConnection();
        }

        if (this.connection?.state === HubConnectionState.Disconnected) {
            this.connectionPromise = this.connection.start();
        }

        if (!this.connectionPromise) {
            this.connectionPromise = this.connection!.start();
        }

        try {
            await this.connectionPromise;
        } catch (error) {
            this.connectionPromise = null;
            throw error;
        }
    }

    public onError(callback: (message: string) => void) {
        this.errorCallback = callback;
    }

    public onGameCreated(callback: (game: Game) => void) {
        if (!this.connection) return;
        this.connection.on('GameCreated', callback);
    }

    public offGameCreated(callback: (game: Game) => void) {
        if (!this.connection) return;
        this.connection.off('GameCreated', callback);
    }

    public onGameJoined(callback: (game: Game) => void) {
        if (!this.connection) return;
        this.connection.on('GameJoined', callback);
    }

    public offGameJoined(callback: (game: Game) => void) {
        if (!this.connection) return;
        this.connection.off('GameJoined', callback);
    }

    public onGameUpdated(callback: (game: Game) => void) {
        if (!this.connection) return;
        this.connection.on('GameUpdated', callback);
    }

    public offGameUpdated(callback: (game: Game) => void) {
        if (!this.connection) return;
        this.connection.off('GameUpdated', callback);
    }

    public onAvailableRooms(callback: (rooms: Game[]) => void) {
        this.availableRoomsCallback = callback;
    }

    public async createGame(playerName: string, roomName: string, userId: string, password: string = ""): Promise<Game> {
        await this.ensureConnection();
        try {
            return await this.connection!.invoke('CreateGame', playerName, roomName, userId, password);
        } catch (error) {
            console.error('Error creating game:', error);
            throw error;
        }
    }

    public async joinGame(roomName: string, playerName: string, userId: string, password: string = ""): Promise<Game> {
        await this.ensureConnection();
        try {
            return await this.connection!.invoke('JoinGame', roomName, playerName, userId, password);
        } catch (error) {
            console.error('Error joining game:', error);
            throw error;
        }
    }

    public async getAvailableRooms() {
        await this.ensureConnection();
        return await this.connection!.invoke('GetAvailableRooms');
    }

    public async makeMove(gameId: string, playerId: string, row: number, col: number) {
        try {
            await this.ensureConnection();
            return await this.connection!.invoke('MakeMove', gameId, playerId, row, col);
        } catch (error) {
            console.error('Make move error:', error);
            throw error;
        }
    }

    public async deleteRoom(roomName: string): Promise<void> {
        await this.connection!.invoke('DeleteRoom', roomName);
    }

    public async leaveRoom(roomName: string, playerName: string): Promise<void> {
        await this.connection!.invoke('LeaveRoom', roomName, playerName);
    }

    public onGameDeleted(callback: (roomName: string) => void) {
        this.connection!.on('GameDeleted', callback);
    }

    public onPlayerLeft(callback: (game: Game) => void) {
        this.connection!.on('PlayerLeft', callback);
    }

    async getFinishedGames(): Promise<Game[]> {
        try {
            await this.ensureConnection();
            if (!this.connection) {
                throw new Error('Connection is not initialized');
            }
            const response = await this.connection.invoke('GetFinishedGames');
            return response;
        } catch (error) {
            console.error('Error getting finished games:', error);
            return [];
        }
    }

    onGameFinished(callback: (game: Game) => void) {
        if (!this.connection) return;
        this.connection.on('GameFinished', callback);
    }

    offGameFinished(callback: (game: Game) => void) {
        if (!this.connection) return;
        this.connection.off('GameFinished', callback);
    }

    public async getGameMoves(gameId: string): Promise<Array<{row: number, col: number, playerId: string}>> {
        try {
            await this.ensureConnection();
            if (!this.connection) {
                throw new Error('Connection is not initialized');
            }
            const response = await this.connection.invoke('GetGameMoves', gameId);
            return response;
        } catch (error) {
            console.error('Error getting game moves:', error);
            return [];
        }
    }

    public showError(message: string) {
        if (this.errorCallback) {
            this.errorCallback(message);
        }
    }
}

export const gameService = new GameService(); 