import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { Game } from '../types/game';

class GameService {
    private connection: HubConnection | null = null;
    private errorCallback: ((message: string) => void) | null = null;
    private gameCreatedCallback: ((game: Game) => void) | null = null;
    private gameJoinedCallback: ((game: Game) => void) | null = null;
    private availableRoomsCallback: ((rooms: Game[]) => void) | null = null;

    constructor() {
        this.ensureConnection();
    }

    private async ensureConnection() {
        if (this.connection) return;

        try {
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

            await this.connection.start();
            console.log('SignalR Connection started');
        } catch (error) {
            console.error('SignalR Connection Error:', error);
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

    public onAvailableRooms(callback: (rooms: Game[]) => void) {
        this.availableRoomsCallback = callback;
    }

    public async createGame(playerName: string, roomName: string): Promise<void> {
        await this.ensureConnection();
        if (this.connection) {
            await this.connection.invoke('CreateGame', playerName, roomName);
        }
    }

    public async joinGame(roomName: string, playerName: string): Promise<void> {
        await this.ensureConnection();
        if (this.connection) {
            await this.connection.invoke('JoinGame', roomName, playerName);
        }
    }

    public async getAvailableRooms(): Promise<void> {
        await this.ensureConnection();
        if (this.connection) {
            await this.connection.invoke('GetAvailableRooms');
        }
    }
}

export const gameService = new GameService(); 