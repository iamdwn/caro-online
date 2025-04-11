import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Game as GameType } from '../types/game';
import { gameService } from '../services/gameService';
import { Board } from './Board';

const GameContainer = styled.div`
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
`;

const JoinGameForm = styled.div`
    margin-bottom: 20px;
    padding: 20px;
    background-color: #f5f5f5;
    border-radius: 5px;
`;

const Input = styled.input`
    padding: 8px;
    margin-right: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
`;

const Button = styled.button`
    padding: 8px 16px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 10px;

    &:hover {
        background-color: #2980b9;
    }
`;

const RoomListContainer = styled.div`
    display: flex;
    gap: 20px;
    margin-top: 20px;
`;

const RoomList = styled.div`
    flex: 1;
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const RoomListTitle = styled.h3`
    margin-bottom: 15px;
    color: #2c3e50;
    font-size: 18px;
    display: flex;
    align-items: center;
    gap: 8px;

    svg {
        width: 20px;
        height: 20px;
    }
`;

const RoomItem = styled.div`
    padding: 12px;
    border: 1px solid #e1e1e1;
    border-radius: 4px;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8f9fa;
    transition: all 0.3s ease;

    &:hover {
        background: #e9ecef;
        transform: translateY(-2px);
    }
`;

const RoomInfo = styled.div`
    flex: 1;
`;

const RoomName = styled.div`
    font-weight: bold;
    color: #2c3e50;
`;

const PlayerName = styled.div`
    color: #666;
    font-size: 14px;
    margin-top: 4px;
`;

const JoinButton = styled.button`
    padding: 6px 12px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover {
        background-color: #2980b9;
    }
`;

const FinishedGameInfo = styled.div`
    color: #666;
    font-size: 14px;
    margin-top: 4px;
    
    span.winner {
        color: #27ae60;
        font-weight: bold;
    }
`;

export const Game: React.FC = () => {
    const [tabId] = useState(() => Math.random().toString(36).substring(7));
    const [userId] = useState(() => localStorage.getItem('userId') || Math.random().toString(36).substring(7));
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('playerName') || '');
    const [roomName, setRoomName] = useState('');
    const [availableRooms, setAvailableRooms] = useState<GameType[]>([]);
    const [finishedGames, setFinishedGames] = useState<GameType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentGame, setCurrentGame] = useState<GameType | null>(() => {
        const savedGame = localStorage.getItem(`currentGame_${tabId}`);
        return savedGame ? JSON.parse(savedGame) : null;
    });
    const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(() => 
        localStorage.getItem(`currentPlayerId_${tabId}`)
    );
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [isMakingMove, setIsMakingMove] = useState(false);

    useEffect(() => {
        localStorage.setItem('userId', userId);
    }, [userId]);

    useEffect(() => {
        if (playerName) {
            localStorage.setItem('playerName', playerName);
        }
    }, [playerName]);

    useEffect(() => {
        if (currentGame) {
            localStorage.setItem(`currentGame_${tabId}`, JSON.stringify(currentGame));
        } else {
            localStorage.removeItem(`currentGame_${tabId}`);
        }
    }, [currentGame, tabId]);

    useEffect(() => {
        if (currentPlayerId) {
            localStorage.setItem(`currentPlayerId_${tabId}`, currentPlayerId);
        } else {
            localStorage.removeItem(`currentPlayerId_${tabId}`);
        }
    }, [currentPlayerId, tabId]);

    useEffect(() => {
        const reconnectToGame = async () => {
            const savedGame = localStorage.getItem(`currentGame_${tabId}`);
            const savedPlayerId = localStorage.getItem(`currentPlayerId_${tabId}`);
            
            if (savedGame && savedPlayerId && playerName) {
                const game = JSON.parse(savedGame);
                try {
                    if (game.player1Name === playerName) {
                        const reconnectedGame = await gameService.createGame(playerName, game.roomName, userId);
                        setCurrentGame(reconnectedGame);
                        setCurrentPlayerId(reconnectedGame.player1Id ?? null);
                    } else {
                        const reconnectedGame = await gameService.joinGame(game.roomName, playerName, userId);
                        setCurrentGame(reconnectedGame);
                        setCurrentPlayerId(reconnectedGame.player2Id ?? null);
                    }
                } catch (error) {
                    console.error('Reconnect error:', error);
                    setCurrentGame(null);
                    setCurrentPlayerId(null);
                    localStorage.removeItem(`currentGame_${tabId}`);
                    localStorage.removeItem(`currentPlayerId_${tabId}`);
                }
            }
            
            try {
                const rooms = await gameService.getAvailableRooms();
                if (Array.isArray(rooms)) {
                    const availableRooms = rooms.filter(room => 
                        room.status === "Waiting" && 
                        (room.player1Name !== playerName || (room.player1Name === playerName && room.player1Id !== userId))
                    );
                    console.log('Rooms after reconnect:', availableRooms);
                    setAvailableRooms(availableRooms);
                }
            } catch (error) {
                console.error('Get rooms error:', error);
            }
            setIsLoading(false);
        };

        reconnectToGame();
    }, [tabId, playerName]);

    useEffect(() => {
        let mounted = true;

        const setupGameEvents = async () => {
            try {
                gameService.onError((message: string) => {
                    console.error('Error:', message);
                    alert(message);
                });

                gameService.onGameCreated((game: GameType) => {
                    if (mounted) {
                        if (game.player1Name === playerName && game.player1Id === userId) {
                            setCurrentGame(game);
                            setCurrentPlayerId(game.player1Id);
                            localStorage.setItem(`currentGame_${tabId}`, JSON.stringify(game));
                            localStorage.setItem(`currentPlayerId_${tabId}`, game.player1Id);
                        }
                        setIsCreating(false);
                    }
                });

                gameService.onGameJoined((game: GameType) => {
                    if (mounted && game) {
                        const isPlayer1 = game.player1Name === playerName && game.player1Id === userId;
                        const isPlayer2 = game.player2Name === playerName && game.player2Id === userId;
                        
                        if (isPlayer1 || isPlayer2) {
                            setCurrentGame(game);
                            const playerId = isPlayer2 ? game.player2Id : game.player1Id;
                            setCurrentPlayerId(playerId || null);
                            localStorage.setItem(`currentGame_${tabId}`, JSON.stringify(game));
                            if (playerId) {
                                localStorage.setItem(`currentPlayerId_${tabId}`, playerId);
                            }
                        }
                        setIsJoining(false);
                    }
                });

                gameService.onGameUpdated((game: GameType) => {
                    if (mounted && currentGame && game.id === currentGame.id) {
                        setCurrentGame(game);
                        localStorage.setItem(`currentGame_${tabId}`, JSON.stringify(game));
                    }
                });

                gameService.onAvailableRooms((rooms: GameType[]) => {
                    if (mounted && Array.isArray(rooms)) {
                        const availableRooms = rooms.filter(room => 
                            room.status === "Waiting" && 
                            (room.player1Name !== playerName || (room.player1Name === playerName && room.player1Id !== userId))
                        );
                        setAvailableRooms(availableRooms);
                    }
                });

                gameService.onGameFinished((game: GameType) => {
                    if (mounted) {
                        setFinishedGames(prev => {
                            const exists = prev.some(g => g.id === game.id);
                            if (exists) return prev;
                            return [game, ...prev];
                        });
                    }
                });

                const [initialRooms, finishedGames] = await Promise.all([
                    gameService.getAvailableRooms(),
                    gameService.getFinishedGames()
                ]);

                if (mounted) {
                    if (Array.isArray(initialRooms)) {
                        const availableRooms = initialRooms.filter(room => 
                            room.status === "Waiting" && 
                            (room.player1Name !== playerName || (room.player1Name === playerName && room.player1Id !== userId))
                        );
                        setAvailableRooms(availableRooms);
                    }
                    if (Array.isArray(finishedGames)) {
                        setFinishedGames(finishedGames);
                    }
                }
            } catch (error) {
                console.error('Setup error:', error);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        setupGameEvents();

        return () => {
            mounted = false;
        };
    }, [playerName, currentGame?.id, tabId]);

    const handleCreateGame = async () => {
        if (!playerName || !roomName) {
            gameService.showError('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        if (availableRooms.some(room => room.roomName === roomName)) {
            gameService.showError('Tên phòng đã tồn tại');
            return;
        }

        try {
            setIsCreating(true);
            await gameService.createGame(playerName, roomName, userId);
            setRoomName('');
        } catch (error) {
            console.error('Create game error:', error);
            gameService.showError('Không thể tạo game');
            setIsCreating(false);
        }
    };

    const handleJoinGame = async (roomName: string) => {
        if (!playerName) {
            gameService.showError('Vui lòng nhập tên người chơi');
            return;
        }
        try {
            setIsJoining(true);
            await gameService.joinGame(roomName, playerName, userId);
        } catch (error) {
            console.error('Join game error:', error);
            gameService.showError('Không thể tham gia game');
            setIsJoining(false);
        }
    };

    const handleCellClick = async (row: number, col: number) => {
        if (!currentGame || !currentPlayerId || isMakingMove) return;
        
        try {
            setIsMakingMove(true);
            await gameService.makeMove(currentGame.id, currentPlayerId, row, col);
        } catch (error) {
            console.error('Make move error:', error);
            gameService.showError('Không thể đánh vào ô này');
        } finally {
            setIsMakingMove(false);
        }
    };

    const handleExitRoom = async () => {
        try {
            if (currentGame) {
                if (currentGame.status === "Finished") {
                    setCurrentGame(null);
                    setCurrentPlayerId(null);
                    localStorage.removeItem(`currentGame_${tabId}`);
                    localStorage.removeItem(`currentPlayerId_${tabId}`);
                    return;
                }

                await gameService.leaveRoom(currentGame.roomName, userId);
                setTimeout(() => {
                    setCurrentGame(null);
                    setCurrentPlayerId(null);
                    localStorage.removeItem(`currentGame_${tabId}`);
                    localStorage.removeItem(`currentPlayerId_${tabId}`);
                }, 2000);
            }
        } catch (error) {
            console.error('Exit room error:', error);
            gameService.showError('Không thể thoát phòng');
        }
    };

    if (currentGame) {
        return (
            <Board 
                game={currentGame}
                currentPlayerId={currentPlayerId || undefined}
                onCellClick={handleCellClick}
                onExitRoom={handleExitRoom}
            />
        );
    }

    return (
        <GameContainer>
            <JoinGameForm>
                <h2>Tham gia game</h2>
                <div>
                    <Input
                        type="text"
                        placeholder="Tên người chơi"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        disabled={isCreating || isJoining}
                    />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <Input
                        type="text"
                        placeholder="Tên phòng"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        disabled={isCreating || isJoining}
                    />
                </div>
                <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    <Button 
                        onClick={handleCreateGame} 
                        disabled={isCreating || isJoining}
                    >
                        {isCreating ? 'Đang tạo phòng...' : 'Tạo phòng mới'}
                    </Button>
                </div>
            </JoinGameForm>

            <RoomListContainer>
                <RoomList>
                    <RoomListTitle>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Danh sách phòng đang chờ ({availableRooms.length})
                    </RoomListTitle>
                    {availableRooms.length === 0 ? (
                        <div>Không có phòng nào đang chờ</div>
                    ) : (
                        availableRooms.map(room => (
                            <RoomItem key={room.id}>
                                <RoomInfo>
                                    <RoomName>Tên phòng: {room.roomName}</RoomName>
                                    <PlayerName>Người tạo: {room.player1Name}</PlayerName>
                                </RoomInfo>
                                <JoinButton 
                                    onClick={() => handleJoinGame(room.roomName)}
                                    disabled={isJoining}
                                >
                                    {isJoining ? 'Đang tham gia...' : 'Tham gia'}
                                </JoinButton>
                            </RoomItem>
                        ))
                    )}
                </RoomList>

                <RoomList>
                    <RoomListTitle>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Trận đấu đã kết thúc ({finishedGames.length})
                    </RoomListTitle>
                    {finishedGames.length === 0 ? (
                        <div>Chưa có trận đấu nào kết thúc</div>
                    ) : (
                        finishedGames.map(game => (
                            <RoomItem key={game.id}>
                                <RoomInfo>
                                    <RoomName>Tên phòng: {game.roomName}</RoomName>
                                    <FinishedGameInfo>
                                        {game.player1Name} vs {game.player2Name}
                                    </FinishedGameInfo>
                                    <FinishedGameInfo>
                                        Người thắng: <span className="winner">
                                            {game.winner === game.player1Id ? game.player1Name : game.player2Name}
                                        </span>
                                    </FinishedGameInfo>
                                </RoomInfo>
                            </RoomItem>
                        ))
                    )}
                </RoomList>
            </RoomListContainer>
        </GameContainer>
    );
}; 