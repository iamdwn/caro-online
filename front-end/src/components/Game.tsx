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
    const [playerName, setPlayerName] = useState('');
    const [roomName, setRoomName] = useState('');
    const [availableRooms, setAvailableRooms] = useState<GameType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentGame, setCurrentGame] = useState<GameType | null>(null);
    const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

    useEffect(() => {
        const setupGameEvents = async () => {
            try {
                gameService.onError((message: string) => {
                    console.error('Error:', message);
                    alert(message);
                });

                gameService.onGameCreated((game: GameType) => {
                    console.log('Game created event:', game);
                    if (game && game.status === "Waiting") {
                        // Nếu là người tạo phòng, vào phòng luôn
                        if (game.player1Name === playerName) {
                            setCurrentGame(game);
                            setCurrentPlayerId(game.player1Id);
                        } else {
                            // Nếu không phải người tạo, thêm vào danh sách phòng
                            setAvailableRooms(prev => {
                                const exists = prev.some(room => room.roomName === game.roomName);
                                if (!exists) {
                                    return [...prev, game];
                                }
                                return prev;
                            });
                        }
                    }
                });

                gameService.onGameJoined((game: GameType) => {
                    console.log('Game joined event:', game);
                    if (game) {
                        // Nếu là người chơi trong phòng này
                        if (game.player1Name === playerName || game.player2Name === playerName) {
                            setCurrentGame(game);
                            setCurrentPlayerId(game.player2Name === playerName ? game.player2Id || null : game.player1Id);
                        }
                        // Xóa phòng khỏi danh sách phòng chờ
                        setAvailableRooms(prev => 
                            prev.filter(room => room.roomName !== game.roomName)
                        );
                    }
                });

                gameService.onAvailableRooms((rooms: GameType[]) => {
                    console.log('Available rooms event:', rooms);
                    if (Array.isArray(rooms)) {
                        setAvailableRooms(prev => {
                            const newRooms = rooms.filter(newRoom => 
                                !prev.some(existingRoom => existingRoom.roomName === newRoom.roomName)
                            );
                            return [...prev, ...newRooms].filter(room => room.status === "Waiting");
                        });
                    }
                    setIsLoading(false);
                });

                // Lấy danh sách phòng lần đầu
                await gameService.getAvailableRooms();
            } catch (error) {
                console.error('Setup error:', error);
                setIsLoading(false);
            }
        };

        setupGameEvents();

        return () => {
            // Cleanup nếu cần
        };
    }, [playerName]);

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