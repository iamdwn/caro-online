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
    flex-wrap: wrap;
`;

const RoomList = styled.div`
    flex: 1;
    min-width: 300px;
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

const Modal = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

const ModalContent = styled.div`
    background: white;
    padding: 20px;
    border-radius: 8px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
`;

const CloseButton = styled.button`
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    
    &:hover {
        color: #000;
    }
`;

const GameReplayInfo = styled.div`
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f5f5f5;
    border-radius: 5px;
`;

const GameGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(15, 30px);
    gap: 1px;
    background-color: #ddd;
    padding: 1px;
    border: 1px solid #999;
    margin: 20px auto;
`;

const GameCell = styled.div<{ value: number }>`
    width: 30px;
    height: 30px;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    border: 1px solid #ddd;
    color: ${props => props.value === 1 ? '#e74c3c' : props.value === 2 ? '#3498db' : 'transparent'};
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
    const [selectedGame, setSelectedGame] = useState<GameType | null>(null);

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

    const handleViewGameHistory = (game: GameType) => {
        setSelectedGame(game);
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
            {!currentGame && (
                <>
                    <JoinGameForm>
                        <Input
                            type="text"
                            placeholder="Nhập tên của bạn"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                        />
                        <Input
                            type="text"
                            placeholder="Nhập tên phòng"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                        />
                        <Button onClick={handleCreateGame} disabled={isCreating}>
                            {isCreating ? 'Đang tạo...' : 'Tạo phòng'}
                        </Button>
                    </JoinGameForm>

                    <RoomListContainer>
                        <RoomList>
                            <RoomListTitle>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2zm-7-3.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
                                </svg>
                                Phòng có sẵn ({availableRooms.length})
                            </RoomListTitle>
                            {availableRooms.map((room) => (
                                <RoomItem key={room.id}>
                                    <RoomInfo>
                                        <RoomName>{room.roomName}</RoomName>
                                        <PlayerName>Chủ phòng: {room.player1Name}</PlayerName>
                                    </RoomInfo>
                                    <JoinButton onClick={() => handleJoinGame(room.roomName)} disabled={isJoining}>
                                        {isJoining ? 'Đang vào...' : 'Vào phòng'}
                                    </JoinButton>
                                </RoomItem>
                            ))}
                            {availableRooms.length === 0 && (
                                <div style={{ textAlign: 'center', color: '#666' }}>
                                    Không có phòng nào
                                </div>
                            )}
                        </RoomList>

                        <RoomList>
                            <RoomListTitle>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                                </svg>
                                Lịch sử trận đấu ({finishedGames.length})
                            </RoomListTitle>
                            {finishedGames.map((game) => (
                                <RoomItem 
                                    key={game.id} 
                                    onClick={() => handleViewGameHistory(game)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <RoomInfo>
                                        <RoomName>{game.roomName}</RoomName>
                                        <PlayerName>
                                            {game.player1Name} vs {game.player2Name}
                                        </PlayerName>
                                        <FinishedGameInfo>
                                            Người thắng: <span className="winner">
                                                {game.winner === game.player1Id ? game.player1Name : game.player2Name}
                                            </span>
                                        </FinishedGameInfo>
                                    </RoomInfo>
                                </RoomItem>
                            ))}
                            {finishedGames.length === 0 && (
                                <div style={{ textAlign: 'center', color: '#666' }}>
                                    Chưa có trận đấu nào kết thúc
                                </div>
                            )}
                        </RoomList>
                    </RoomListContainer>
                </>
            )}

            {currentGame && (
                <Board
                    game={currentGame}
                    currentPlayerId={currentPlayerId ?? undefined}
                    onCellClick={handleCellClick}
                    onExitRoom={handleExitRoom}
                />
            )}

            {selectedGame && (
                <Modal onClick={() => setSelectedGame(null)}>
                    <ModalContent onClick={e => e.stopPropagation()}>
                        <CloseButton onClick={() => setSelectedGame(null)}>&times;</CloseButton>
                        <GameReplayInfo>
                            <h3>Chi tiết trận đấu</h3>
                            <div>Phòng: {selectedGame.roomName}</div>
                            <div>Người chơi 1 (X): {selectedGame.player1Name}</div>
                            <div>Người chơi 2 (O): {selectedGame.player2Name}</div>
                            <div>Người thắng: <span style={{ color: '#27ae60', fontWeight: 'bold' }}>
                                {selectedGame.winner === selectedGame.player1Id ? selectedGame.player1Name : selectedGame.player2Name}
                            </span></div>
                            <div>Thời gian: {new Date(selectedGame.createdAt).toLocaleString()}</div>
                        </GameReplayInfo>
                        <GameGrid>
                            {selectedGame.board?.map((value, index) => (
                                <GameCell key={index} value={value}>
                                    {value === 1 ? 'X' : value === 2 ? 'O' : ''}
                                </GameCell>
                            ))}
                        </GameGrid>
                    </ModalContent>
                </Modal>
            )}
        </GameContainer>
    );
}; 