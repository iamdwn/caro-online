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
    // Tạo một ID duy nhất cho mỗi tab
    const [tabId] = useState(() => Math.random().toString(36).substring(7));
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

    // Lưu playerName khi thay đổi (dùng chung cho tất cả các tab)
    useEffect(() => {
        if (playerName) {
            localStorage.setItem('playerName', playerName);
        }
    }, [playerName]);

    // Lưu thông tin game hiện tại cho tab này
    useEffect(() => {
        if (currentGame) {
            localStorage.setItem(`currentGame_${tabId}`, JSON.stringify(currentGame));
        } else {
            localStorage.removeItem(`currentGame_${tabId}`);
        }
    }, [currentGame, tabId]);

    // Lưu currentPlayerId cho tab này
    useEffect(() => {
        if (currentPlayerId) {
            localStorage.setItem(`currentPlayerId_${tabId}`, currentPlayerId);
        } else {
            localStorage.removeItem(`currentPlayerId_${tabId}`);
        }
    }, [currentPlayerId, tabId]);

    // Tự động kết nối lại vào phòng khi refresh (chỉ cho tab này)
    useEffect(() => {
        const reconnectToGame = async () => {
            const savedGame = localStorage.getItem(`currentGame_${tabId}`);
            const savedPlayerId = localStorage.getItem(`currentPlayerId_${tabId}`);
            
            if (savedGame && savedPlayerId && playerName) {
                const game = JSON.parse(savedGame);
                try {
                    // Kiểm tra xem là người tạo phòng hay người tham gia
                    if (game.player1Name === playerName) {
                        // Nếu là người tạo phòng, tạo lại phòng với thông tin cũ
                        const reconnectedGame = await gameService.createGame(playerName, game.roomName);
                        setCurrentGame(reconnectedGame);
                        setCurrentPlayerId(reconnectedGame.player1Id);
                    } else {
                        // Nếu là người tham gia, join lại vào phòng
                        const reconnectedGame = await gameService.joinGame(game.roomName, playerName);
                        setCurrentGame(reconnectedGame);
                        setCurrentPlayerId(reconnectedGame.player2Id);
                    }
                } catch (error) {
                    console.error('Reconnect error:', error);
                    // Nếu không thể kết nối lại, xóa thông tin game của tab này
                    setCurrentGame(null);
                    setCurrentPlayerId(null);
                    localStorage.removeItem(`currentGame_${tabId}`);
                    localStorage.removeItem(`currentPlayerId_${tabId}`);
                }
            }
            
            // Luôn lấy danh sách phòng mới nhất sau khi reconnect
            try {
                const rooms = await gameService.getAvailableRooms();
                if (Array.isArray(rooms)) {
                    const availableRooms = rooms.filter(room => 
                        room.status === "Waiting" && room.player1Name !== playerName
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
        let intervalId: NodeJS.Timeout;

        const setupGameEvents = async () => {
            try {
                gameService.onError((message: string) => {
                    console.error('Error:', message);
                    alert(message);
                });

                gameService.onGameCreated((game: GameType) => {
                    console.log('Game created event:', game);
                    if (mounted) {
                        if (game.player1Name === playerName) {
                            setCurrentGame(game);
                            setCurrentPlayerId(game.player1Id);
                            localStorage.setItem(`currentGame_${tabId}`, JSON.stringify(game));
                            localStorage.setItem(`currentPlayerId_${tabId}`, game.player1Id);
                        }
                        // Luôn cập nhật danh sách phòng khi có phòng mới được tạo
                        gameService.getAvailableRooms().then(rooms => {
                            if (mounted && Array.isArray(rooms)) {
                                const availableRooms = rooms.filter(room => 
                                    room.status === "Waiting" && room.player1Name !== playerName
                                );
                                console.log('Updated rooms after creation:', availableRooms);
                                setAvailableRooms(availableRooms);
                            }
                        });
                    }
                });

                gameService.onGameJoined((game: GameType) => {
                    console.log('Game joined event:', game);
                    if (mounted && game) {
                        if (game.player1Name === playerName || game.player2Name === playerName) {
                            setCurrentGame(game);
                            const playerId = game.player2Name === playerName ? game.player2Id : game.player1Id;
                            setCurrentPlayerId(playerId || null);
                            localStorage.setItem(`currentGame_${tabId}`, JSON.stringify(game));
                            if (playerId) {
                                localStorage.setItem(`currentPlayerId_${tabId}`, playerId);
                            }
                        }
                        // Luôn cập nhật danh sách phòng khi có người tham gia
                        gameService.getAvailableRooms().then(rooms => {
                            if (mounted && Array.isArray(rooms)) {
                                const availableRooms = rooms.filter(room => 
                                    room.status === "Waiting" && room.player1Name !== playerName
                                );
                                console.log('Updated rooms after join:', availableRooms);
                                setAvailableRooms(availableRooms);
                            }
                        });
                    }
                });

                gameService.onGameUpdated((game: GameType) => {
                    console.log('Game updated event:', game);
                    if (mounted) {
                        if (currentGame && game.id === currentGame.id) {
                            setCurrentGame(game);
                            localStorage.setItem(`currentGame_${tabId}`, JSON.stringify(game));
                        }
                    }
                });

                gameService.onAvailableRooms((rooms: GameType[]) => {
                    console.log('Available rooms event received:', rooms);
                    if (mounted && Array.isArray(rooms)) {
                        const availableRooms = rooms.filter(room => 
                            room.status === "Waiting" && room.player1Name !== playerName
                        );
                        console.log('Filtered available rooms:', availableRooms);
                        setAvailableRooms(availableRooms);
                    }
                });

                // Lấy danh sách phòng lần đầu
                const initialRooms = await gameService.getAvailableRooms();
                if (mounted && Array.isArray(initialRooms)) {
                    const availableRooms = initialRooms.filter(room => 
                        room.status === "Waiting" && room.player1Name !== playerName
                    );
                    console.log('Initial rooms:', availableRooms);
                    setAvailableRooms(availableRooms);
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

        // Cập nhật danh sách phòng mỗi 3 giây
        intervalId = setInterval(() => {
            if (mounted) {
                gameService.getAvailableRooms().then(rooms => {
                    if (mounted && Array.isArray(rooms)) {
                        const availableRooms = rooms.filter(room => 
                            room.status === "Waiting" && room.player1Name !== playerName
                        );
                        console.log('Interval update rooms:', availableRooms);
                        setAvailableRooms(availableRooms);
                    }
                }).catch(error => {
                    console.error('Interval fetch rooms error:', error);
                });
            }
        }, 3000);

        return () => {
            mounted = false;
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [playerName, currentGame?.id, tabId]);

    useEffect(() => {
        if (!gameService) return;

        const handleGameCreated = (game: GameType) => {
            if (game.player1Name === playerName) {
                setCurrentGame(game);
                setCurrentPlayerId(game.player1Id);
                localStorage.setItem(`currentGame_${tabId}`, JSON.stringify(game));
                localStorage.setItem(`currentPlayerId_${tabId}`, game.player1Id);
            }
            setIsCreating(false);
        };

        const handleGameJoined = (game: GameType) => {
            if (game.player1Name === playerName || game.player2Name === playerName) {
                setCurrentGame(game);
                const playerId = game.player2Name === playerName ? game.player2Id : game.player1Id;
                setCurrentPlayerId(playerId || null);
                localStorage.setItem(`currentGame_${tabId}`, JSON.stringify(game));
                if (playerId) {
                    localStorage.setItem(`currentPlayerId_${tabId}`, playerId);
                }
            }
            setIsJoining(false);
        };

        const handleGameUpdated = (game: GameType) => {
            if (currentGame && game.id === currentGame.id) {
                setCurrentGame(game);
                localStorage.setItem(`currentGame_${tabId}`, JSON.stringify(game));
            }
        };

        const handleGameFinished = (game: GameType) => {
            setFinishedGames(prev => {
                const exists = prev.some(g => g.id === game.id);
                if (exists) return prev;
                return [game, ...prev];
            });
        };

        gameService.onGameCreated(handleGameCreated);
        gameService.onGameJoined(handleGameJoined);
        gameService.onGameUpdated(handleGameUpdated);
        gameService.onGameFinished(handleGameFinished);

        return () => {
            gameService.offGameCreated(handleGameCreated);
            gameService.offGameJoined(handleGameJoined);
            gameService.offGameUpdated(handleGameUpdated);
            gameService.offGameFinished(handleGameFinished);
        };
    }, [gameService, playerName, currentGame?.id, tabId]);

    useEffect(() => {
        let mounted = true;
        let intervalId: NodeJS.Timeout;

        const fetchRooms = async () => {
            try {
                const [availableRoomsData, finishedGamesData] = await Promise.all([
                    gameService.getAvailableRooms(),
                    gameService.getFinishedGames()
                ]);
                if (mounted) {
                    setAvailableRooms(availableRoomsData || []);
                    setFinishedGames(finishedGamesData || []);
                }
            } catch (error) {
                console.error('Error fetching rooms:', error);
                if (mounted) {
                    setAvailableRooms([]);
                    setFinishedGames([]);
                }
            }
        };

        // Lấy danh sách phòng ngay khi component mount
        fetchRooms();

        // Cập nhật mỗi 3 giây thay vì 2 giây
        intervalId = setInterval(fetchRooms, 3000);

        return () => {
            mounted = false;
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, []);

    const handleCreateGame = async () => {
        if (!playerName || !roomName) {
            alert('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        if (availableRooms.some(room => room.roomName === roomName)) {
            alert('Tên phòng đã tồn tại');
            return;
        }

        try {
            setIsCreating(true);
            await gameService.createGame(playerName, roomName);
            setRoomName('');
        } catch (error) {
            console.error('Create game error:', error);
            alert('Không thể tạo game');
            setIsCreating(false);
        }
    };

    const handleJoinGame = async (roomName: string) => {
        if (!playerName) {
            alert('Vui lòng nhập tên người chơi');
            return;
        }
        try {
            setIsJoining(true);
            await gameService.joinGame(roomName, playerName);
        } catch (error) {
            console.error('Join game error:', error);
            alert('Không thể tham gia game');
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
            alert('Không thể đánh vào ô này');
        } finally {
            setIsMakingMove(false);
        }
    };

    const handleExitRoom = async () => {
        try {
            if (currentGame) {
                // Nếu là người tạo phòng, xóa phòng
                if (currentGame.player1Name === playerName) {
                    await gameService.deleteRoom(currentGame.roomName);
                }
                // Nếu là người chơi 2, rời phòng
                else if (currentGame.player2Name === playerName) {
                    await gameService.leaveRoom(currentGame.roomName, playerName);
                }
            }
            // Xóa thông tin game của tab này
            setCurrentGame(null);
            setCurrentPlayerId(null);
            localStorage.removeItem(`currentGame_${tabId}`);
            localStorage.removeItem(`currentPlayerId_${tabId}`);
        } catch (error) {
            console.error('Exit room error:', error);
            alert('Không thể thoát phòng');
        }
    };

    // Nếu đang trong game, hiển thị bàn cờ
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

    // Nếu không, hiển thị giao diện tạo/tham gia phòng
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