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

const RoomList = styled.div`
    margin-top: 20px;
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 10px;
`;

const RoomItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #eee;

    &:last-child {
        border-bottom: none;
    }
`;

const RoomInfo = styled.div`
    flex: 1;
`;

const RoomName = styled.div`
    font-weight: bold;
    margin-bottom: 5px;
`;

const RoomCreator = styled.div`
    color: #666;
    font-size: 0.9em;
`;

export const Game: React.FC = () => {
    // Tạo một ID duy nhất cho mỗi tab
    const [tabId] = useState(() => Math.random().toString(36).substring(7));
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('playerName') || '');
    const [roomName, setRoomName] = useState('');
    const [availableRooms, setAvailableRooms] = useState<GameType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentGame, setCurrentGame] = useState<GameType | null>(() => {
        const savedGame = localStorage.getItem(`currentGame_${tabId}`);
        return savedGame ? JSON.parse(savedGame) : null;
    });
    const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(() => 
        localStorage.getItem(`currentPlayerId_${tabId}`)
    );

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
                    await gameService.joinGame(game.roomName, playerName);
                } catch (error) {
                    console.error('Reconnect error:', error);
                    // Nếu không thể kết nối lại, xóa thông tin game của tab này
                    setCurrentGame(null);
                    setCurrentPlayerId(null);
                    localStorage.removeItem(`currentGame_${tabId}`);
                    localStorage.removeItem(`currentPlayerId_${tabId}`);
                }
            }
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
                    console.log('Game created event:', game);
                    if (mounted) {
                        if (game.player1Name === playerName) {
                            setCurrentGame(game);
                            setCurrentPlayerId(game.player1Id);
                        }
                    }
                });

                gameService.onGameJoined((game: GameType) => {
                    console.log('Game joined event:', game);
                    if (mounted && game) {
                        if (game.player1Name === playerName || game.player2Name === playerName) {
                            setCurrentGame(game);
                            setCurrentPlayerId(game.player2Name === playerName ? game.player2Id || null : game.player1Id);
                        }
                    }
                });

                gameService.onGameUpdated((game: GameType) => {
                    console.log('Game updated event:', game);
                    if (mounted) {
                        if (currentGame && game.id === currentGame.id) {
                            setCurrentGame(game);
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
                        setIsLoading(false);
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
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Setup error:', error);
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        // Thiết lập sự kiện game
        setupGameEvents();

        // Cleanup function
        return () => {
            mounted = false;
        };
    }, [playerName, currentGame?.id]);

    const handleCreateGame = async () => {
        if (!playerName) {
            alert('Vui lòng nhập tên người chơi');
            return;
        }
        if (!roomName) {
            alert('Vui lòng nhập tên phòng');
            return;
        }

        if (availableRooms.some(room => room.roomName === roomName)) {
            alert('Tên phòng đã tồn tại');
            return;
        }

        try {
            setIsLoading(true);
            await gameService.createGame(playerName, roomName);
            setRoomName('');
        } catch (error) {
            console.error('Create game error:', error);
            alert('Không thể tạo game');
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinGame = async (roomName: string) => {
        if (!playerName) {
            alert('Vui lòng nhập tên người chơi');
            return;
        }
        try {
            setIsLoading(true);
            await gameService.joinGame(roomName, playerName);
        } catch (error) {
            console.error('Join game error:', error);
            alert('Không thể tham gia game');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCellClick = async (row: number, col: number) => {
        if (!currentGame || !currentPlayerId) return;
        try {
            await gameService.makeMove(currentGame.id, currentPlayerId, row, col);
        } catch (error) {
            console.error('Make move error:', error);
            alert('Không thể đánh vào ô này');
        }
    };

    // Nếu đang trong game, hiển thị bàn cờ
    if (currentGame) {
        return (
            <Board 
                game={currentGame}
                currentPlayerId={currentPlayerId || undefined}
                onCellClick={handleCellClick}
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
                    />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <Input
                        type="text"
                        placeholder="Tên phòng"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                    />
                </div>
                <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    <Button onClick={handleCreateGame} disabled={isLoading}>
                        {isLoading ? 'Đang xử lý...' : 'Tạo phòng mới'}
                    </Button>
                </div>
            </JoinGameForm>

            <RoomList>
                <h3>Danh sách phòng đang chờ ({availableRooms.length})</h3>
                {isLoading ? (
                    <div>Đang tải danh sách phòng...</div>
                ) : availableRooms.length === 0 ? (
                    <div>Không có phòng nào đang chờ</div>
                ) : (
                    availableRooms.map((room) => (
                        <RoomItem key={room.id}>
                            <RoomInfo>
                                <RoomName>Tên phòng: {room.roomName}</RoomName>
                                <RoomCreator>Người tạo: {room.player1Name}</RoomCreator>
                            </RoomInfo>
                            <Button 
                                onClick={() => handleJoinGame(room.roomName)}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Đang xử lý...' : 'Tham gia'}
                            </Button>
                        </RoomItem>
                    ))
                )}
            </RoomList>
        </GameContainer>
    );
}; 