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

        // Setup SignalR connection
        this.connection = new HubConnectionBuilder()
            .withUrl(`https://caro-be.iamdwn.dev/gameHub`)
            .withAutomaticReconnect([0, 1000, 2000, 5000])
            .configureLogging(LogLevel.Warning)
            .build();

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

        // Log connection events for debugging
        this.connection.onclose((error) => {
            console.error('Connection closed:', error);
            this.connectionPromise = null;
        });

        this.connection.onreconnecting(() => {
            console.log('Reconnecting...');
        });

        this.connection.onreconnected(() => {
            console.log('Reconnected');
            this.getAvailableRooms();
        });
    }

    private async ensureConnection() {
        if (!this.connection) {
            await this.setupConnection();
        }

        if (this.connection.state === HubConnectionState.Disconnected && !this.connectionPromise) {
            this.connectionPromise = this.connection.start();
        }

        try {
            await this.connectionPromise;
        } catch (error) {
            this.connectionPromise = null;
            console.error('Failed to establish connection:', error);
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

    public async createGame(playerName: string, roomName: string) {
        try {
            await this.ensureConnection();
            return await this.connection!.invoke('CreateGame', playerName, roomName);
        } catch (error) {
            console.error('Create game error:', error);
            throw error;
        }
    }

    public async joinGame(roomName: string, playerName: string) {
        try {
            await this.ensureConnection();
            return await this.connection!.invoke('JoinGame', roomName, playerName);
        } catch (error) {
            console.error('Join game error:', error);
            throw error;
        }
    }

    public async getAvailableRooms() {
        try {
            await this.ensureConnection();
            return await this.connection!.invoke('GetAvailableRooms');
        } catch (error) {
            console.error('Get available rooms error:', error);
            throw error;
        }
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
        try {
            await this.connection!.invoke('DeleteRoom', roomName);
        } catch (error) {
            console.error('Delete room error:', error);
            throw error;
        }
    }

    public async leaveRoom(roomName: string, playerName: string): Promise<void> {
        try {
            await this.connection!.invoke('LeaveRoom', roomName, playerName);
        } catch (error) {
            console.error('Leave room error:', error);
            throw error;
        }
    }

    public onGameDeleted(callback: (roomName: string) => void) {
        if (!this.connection) return;
        this.connection.on('GameDeleted', callback);
    }

    public onPlayerLeft(callback: (game: Game) => void) {
        if (!this.connection) return;
        this.connection.on('PlayerLeft', callback);
    }

    async getFinishedGames(): Promise<Game[]> {
        try {
            if (!this.connection) {
                throw new Error('Connection is not initialized');
            }
            const response = await this.connection.invoke('GetFinishedGames');
            return response;
        } catch (error) {
            console.error('Error getting finished games:', error);
            throw error;  // Propagate error so the caller is aware
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
}

export const gameService = new GameService();
