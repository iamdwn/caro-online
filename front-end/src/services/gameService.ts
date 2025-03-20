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

        this.connection = new HubConnectionBuilder()
            .withUrl('http://localhost:5071/gameHub')
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        this.connection.on('connected', (connectionId: string) => {
            console.log('Connected to SignalR hub with ID:', connectionId);
        });

        this.connection.on('gameCreated', (game: Game) => {
            console.log('Game created:', game);
            if (this.gameCreatedCallback) {
                this.gameCreatedCallback(game);
            }
        });

        this.connection.on('gameJoined', (game: Game) => {
            console.log('Game joined:', game);
            if (this.gameJoinedCallback) {
                this.gameJoinedCallback(game);
            }
        });

        this.connection.on('gameUpdated', (game: Game) => {
            console.log('Game updated:', game);
            if (this.gameUpdatedCallback) {
                this.gameUpdatedCallback(game);
            }
        });

        this.connection.on('availableRooms', (rooms: Game[]) => {
            console.log('Available rooms:', rooms);
            if (this.availableRoomsCallback) {
                this.availableRoomsCallback(rooms);
            }
        });

        this.connection.on('error', (message: string) => {
            console.error('Error from server:', message);
            if (this.errorCallback) {
                this.errorCallback(message);
            }
        });

        this.connection.onclose(() => {
            console.log('Connection closed');
            this.connectionPromise = null;
        });

        this.connection.onreconnecting(() => {
            console.log('Reconnecting...');
        });

        this.connection.onreconnected(() => {
            console.log('Reconnected');
            // Lấy lại danh sách phòng sau khi kết nối lại
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
            console.error('SignalR Connection Error:', error);
            this.connectionPromise = null;
            throw error;
        }
    }

    public onError(callback: (message: string) => void) {
        this.errorCallback = callback;
    }

    public onGameCreated(callback: (game: Game) => void) {
        this.gameCreatedCallback = callback;
    }

    public onGameJoined(callback: (game: Game) => void) {
        this.gameJoinedCallback = callback;
    }

    public onGameUpdated(callback: (game: Game) => void) {
        this.gameUpdatedCallback = callback;
    }

    public onAvailableRooms(callback: (rooms: Game[]) => void) {
        this.availableRoomsCallback = callback;
    }

    public async createGame(playerName: string, roomName: string) {
        await this.ensureConnection();
        return await this.connection!.invoke('CreateGame', playerName, roomName);
    }

    public async joinGame(roomName: string, playerName: string) {
        await this.ensureConnection();
        return await this.connection!.invoke('JoinGame', roomName, playerName);
    }

    public async getAvailableRooms() {
        await this.ensureConnection();
        return await this.connection!.invoke('GetAvailableRooms');
    }

    public async makeMove(gameId: string, playerId: string, row: number, col: number) {
        await this.ensureConnection();
        return await this.connection!.invoke('MakeMove', gameId, playerId, row, col);
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
}

export const gameService = new GameService(); 