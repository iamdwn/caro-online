import React, { useEffect, useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import type { Game as GameType } from '../types/game';
import { GameStatus, parseBoard, type Board, type BoardCell } from '../types/game';
import { gameService } from '../services/gameService';
import { Board as GameBoard } from './Board';
import { HistoryBoard } from './HistoryBoard';

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
    border-radius: 20px;
    width: 90vw;
    height: 90vh;
    max-width: 1200px;
    max-height: 800px;
    position: relative;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
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

const GameReplayContainer = styled.div`
    max-width: 1200px;
    margin: 0 auto;
    height: 90vh;
    display: flex;
    flex-direction: column;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    animation: slideIn 0.5s ease-out;
    overflow: hidden;

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

const GameReplayHeader = styled.div`
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: linear-gradient(135deg, #f8fafc, #ffffff);
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    border: 1px solid #e2e8f0;
    animation: fadeIn 0.6s ease-out;

    .title {
        display: flex;
        align-items: center;
        gap: 24px;

        h3 {
            margin: 0;
            font-size: 20px;
            color: #1e293b;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            position: relative;
            overflow: hidden;

            &::before {
                content: '🎮';
                font-size: 24px;
                animation: float 2s infinite ease-in-out;
            }

            &::after {
                content: '';
                position: absolute;
                left: 0;
                bottom: -2px;
                width: 100%;
                height: 2px;
                background: linear-gradient(90deg, #3b82f6, #2563eb);
                transform: translateX(-100%);
                animation: slideRight 0.8s ease-out forwards;
            }
        }

        .info {
            display: flex;
            gap: 20px;
            animation: fadeInUp 0.8s ease-out;

            .item {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 15px;
                color: #64748b;
                padding: 6px 12px;
                background: #f1f5f9;
                border-radius: 8px;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;

                &::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.2));
                    transform: translateX(-100%);
                    transition: transform 0.5s ease;
                }

                &:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);

                    &::before {
                        transform: translateX(100%);
                    }
                }

                .label {
                    color: #94a3b8;
                    transition: color 0.3s ease;
                }

                &.winner {
                    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
                    color: #16a34a;
                    animation: pulse 2s infinite;

                    .label {
                        color: #22c55e;
                    }

                    &:hover {
                        background: linear-gradient(135deg, #bbf7d0, #86efac);
                    }
                }
            }
        }
    }

    button {
        padding: 10px 20px;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        font-size: 15px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        position: relative;
        overflow: hidden;

        &::before {
            content: '⬅️';
            font-size: 18px;
            transition: transform 0.3s ease;
        }

        &::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.2), rgba(255,255,255,0));
            transform: translateX(-100%);
            transition: transform 0.5s ease;
        }

        &:hover {
            transform: translateX(-2px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

            &::before {
                transform: translateX(-4px);
            }

            &::after {
                transform: translateX(100%);
            }
        }

        &:active {
            transform: scale(0.98);
        }
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes float {
        0%, 100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-4px);
        }
    }

    @keyframes slideRight {
        to {
            transform: translateX(0);
        }
    }

    @keyframes pulse {
        0% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
        }
        70% {
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
        }
        100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
        }
    }
`;

const GameReplayBoard = styled.div`
    flex: 1;
    position: relative;
    overflow: hidden;
    touch-action: none;
    background: #f8fafc;
    margin: 20px;
    border-radius: 8px;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
`;

interface GameGridProps {
    $x: number;
    $y: number;
    $scale: number;
}

const GameGrid = styled.div<GameGridProps>`
    display: grid;
    grid-template-columns: repeat(50, 35px);
    grid-template-rows: repeat(50, 35px);
    gap: 1px;
    background-color: #e2e8f0;
    transform: translate3d(${props => props.$x}px, ${props => props.$y}px, 0) scale(${props => props.$scale});
    will-change: transform;
    transition: transform 0.1s ease;
    position: absolute;
    border: 1px solid #e2e8f0;
`;

const GameCell = styled.div<{ value: number }>`
    width: 35px;
    height: 35px;
    background-color: ${props => {
        switch (props.value) {
            case 1: return '#ffebee';
            case 2: return '#e3f2fd';
            default: return 'white';
        }
    }};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: bold;
    color: ${props => {
        switch (props.value) {
            case 1: return '#f44336';
            case 2: return '#2196f3';
            default: return 'transparent';
        }
    }};
    border: 2px solid ${props => {
        switch (props.value) {
            case 1: return '#ef9a9a';
            case 2: return '#90caf9';
            default: return '#e2e8f0';
        }
    }};
    position: relative;
    transition: all 0.2s ease;

    &:after {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: ${props => {
            switch (props.value) {
                case 1: return 'rgba(244, 67, 54, 0.1)';
                case 2: return 'rgba(33, 150, 243, 0.1)';
                default: return 'transparent';
            }
        }};
        pointer-events: none;
    }
`;

const GameGridScroller = styled.div<{ $isDragging: boolean }>`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    cursor: ${props => props.$isDragging ? 'grabbing' : 'grab'};
    user-select: none;
    touch-action: none;
    display: flex;
    align-items: center;
    justify-content: center;
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
    const [historyPosition, setHistoryPosition] = useState({ x: 0, y: 0 });
    const [historyScale, setHistoryScale] = useState(1);
    const [historyIsDragging, setHistoryIsDragging] = useState(false);
    const [historyDragStart, setHistoryDragStart] = useState({ x: 0, y: 0 });
    const historyGridRef = useRef<HTMLDivElement>(null);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [replayMoves, setReplayMoves] = useState<{row: number, col: number, value: number}[]>([]);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const autoPlayIntervalRef = useRef<NodeJS.Timeout>();

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
        const boardData = parseBoard(game.board);
        setSelectedGame({
            ...game,
            board: boardData
        });
    };

    const handlePrevMove = () => {
        if (currentMoveIndex > 0) {
            setCurrentMoveIndex(prev => prev - 1);
            updateBoardState(currentMoveIndex - 1);
        }
    };

    const handleNextMove = () => {
        if (currentMoveIndex < replayMoves.length) {
            setCurrentMoveIndex(prev => prev + 1);
            updateBoardState(currentMoveIndex + 1);
        }
    };

    const updateBoardState = (moveIndex: number) => {
        if (!selectedGame) return;

        console.log('Updating board state to move:', moveIndex);
        console.log('Total moves:', replayMoves.length);

        let newBoard: number[] = new Array(2500).fill(0);
        if (typeof selectedGame.board === 'string') {
            try {
                const parsed = JSON.parse(selectedGame.board);
                if (Array.isArray(parsed)) {
                    newBoard = [...parsed];
                }
            } catch {
                const stringData = selectedGame.board as string;
                newBoard = stringData.split(',').map((num: string) => parseInt(num, 10) || 0);
            }
        } else if (Array.isArray(selectedGame.board)) {
            newBoard = [...selectedGame.board];
        }

        newBoard.fill(0);

        for (let i = 0; i < moveIndex; i++) {
            const move = replayMoves[i];
            if (move) {
                const index = move.row * 50 + move.col;
                newBoard[index] = move.value;
                console.log(`Applied move ${i + 1}: (${move.row}, ${move.col}) = ${move.value}`);
            }
        }

        setSelectedGame(prev => {
            if (!prev) return null;
            const boardData = parseBoard(prev.board);
            const updated: GameType = {
                ...prev,
                board: boardData
            };
            return updated;
        });
    };

    const toggleAutoPlay = () => {
        if (isAutoPlaying) {
            if (autoPlayIntervalRef.current) {
                clearInterval(autoPlayIntervalRef.current);
            }
            setIsAutoPlaying(false);
        } else {
            setIsAutoPlaying(true);
            autoPlayIntervalRef.current = setInterval(() => {
                setCurrentMoveIndex(prev => {
                    if (prev >= replayMoves.length) {
                        clearInterval(autoPlayIntervalRef.current);
                        setIsAutoPlaying(false);
                        return prev;
                    }
                    updateBoardState(prev + 1);
                    return prev + 1;
                });
            }, 1000);
        }
    };

    useEffect(() => {
        return () => {
            if (autoPlayIntervalRef.current) {
                clearInterval(autoPlayIntervalRef.current);
            }
        };
    }, []);

    const handleHistoryMouseDown = (e: React.MouseEvent) => {
        setHistoryIsDragging(true);
        const rect = historyGridRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        setHistoryDragStart({
            x: e.clientX - historyPosition.x,
            y: e.clientY - historyPosition.y
        });
    };

    const handleHistoryMouseUp = () => {
        setHistoryIsDragging(false);
    };

    const handleHistoryWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const speed = 15;
        const newX = historyPosition.x - e.deltaX * speed;
        const newY = historyPosition.y - e.deltaY * speed;

        const container = historyGridRef.current?.parentElement;
        const grid = historyGridRef.current?.querySelector('[class^="GameGrid"]');
        if (!container || !grid) return;

        const containerRect = container.getBoundingClientRect();
        const gridRect = grid.getBoundingClientRect();

        const minX = containerRect.width - gridRect.width;
        const minY = containerRect.height - gridRect.height;

        setHistoryPosition({
            x: Math.min(0, Math.max(minX, newX)),
            y: Math.min(0, Math.max(minY, newY))
        });
    }, [historyPosition]);

    const handleHistoryMouseMove = useCallback((e: React.MouseEvent) => {
        if (!historyIsDragging) return;

        const newX = e.clientX - historyDragStart.x;
        const newY = e.clientY - historyDragStart.y;

        const container = historyGridRef.current?.parentElement;
        const grid = historyGridRef.current?.querySelector('[class^="GameGrid"]');
        if (!container || !grid) return;

        const containerRect = container.getBoundingClientRect();
        const gridRect = grid.getBoundingClientRect();

        const minX = containerRect.width - gridRect.width;
        const minY = containerRect.height - gridRect.height;

        setHistoryPosition({
            x: Math.min(0, Math.max(minX, newX)),
            y: Math.min(0, Math.max(minY, newY))
        });
    }, [historyIsDragging, historyDragStart]);

    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            body {
                touch-action: pan-x pan-y !important;
                -ms-content-zooming: none;
                -ms-touch-action: pan-x pan-y;
            }
            
            html {
                touch-action: manipulation;
            }
        `;
        document.head.appendChild(style);

        const preventZoom = (e: KeyboardEvent | TouchEvent | WheelEvent) => {
            if (e instanceof KeyboardEvent) {
                if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '_')) {
                    e.preventDefault();
                    return false;
                }
            } else if (e instanceof WheelEvent) {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    return false;
                }
            } else if (e instanceof TouchEvent) {
                if (e.touches.length > 1) {
                    e.preventDefault();
                    return false;
                }
            }
        };

        window.addEventListener('keydown', preventZoom as any);
        window.addEventListener('wheel', preventZoom as any, { passive: false });
        window.addEventListener('touchstart', preventZoom as any, { passive: false });

        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('gesturechange', (e) => e.preventDefault());
        document.addEventListener('gestureend', (e) => e.preventDefault());

        return () => {
            document.head.removeChild(style);
            window.removeEventListener('keydown', preventZoom as any);
            window.removeEventListener('wheel', preventZoom as any);
            window.removeEventListener('touchstart', preventZoom as any);
            document.removeEventListener('gesturestart', (e) => e.preventDefault());
            document.removeEventListener('gesturechange', (e) => e.preventDefault());
            document.removeEventListener('gestureend', (e) => e.preventDefault());
        };
    }, []);

    useEffect(() => {
        if (selectedGame) {
            return () => {
                setHistoryPosition({ x: 0, y: 0 });
                setHistoryScale(1);
            };
        }
    }, [selectedGame]);

    const calculateFocusArea = (board: number[]) => {
        const size = 50;
        let minRow = size;
        let maxRow = 0;
        let minCol = size;
        let maxCol = 0;
        let hasMove = false;

        board.forEach((value, index) => {
            if (value !== 0) {
                hasMove = true;
                const row = Math.floor(index / size);
                const col = index % size;
                minRow = Math.min(minRow, row);
                maxRow = Math.max(maxRow, row);
                minCol = Math.min(minCol, col);
                maxCol = Math.max(maxCol, col);
            }
        });

        if (!hasMove) {
            const center = Math.floor(size / 2);
            return {
                x: -center * 35,
                y: -center * 35,
                width: 15 * 35,
                height: 15 * 35
            };
        }

        const padding = 2;
        minRow = Math.max(0, minRow - padding);
        maxRow = Math.min(size - 1, maxRow + padding);
        minCol = Math.max(0, minCol - padding);
        maxCol = Math.min(size - 1, maxCol + padding);

        if (maxRow - minRow < 8) {
            const center = Math.floor((maxRow + minRow) / 2);
            minRow = Math.max(0, center - 4);
            maxRow = Math.min(size - 1, center + 4);
        }
        if (maxCol - minCol < 8) {
            const center = Math.floor((maxCol + minCol) / 2);
            minCol = Math.max(0, center - 4);
            maxCol = Math.min(size - 1, center + 4);
        }

        const width = (maxCol - minCol + 1) * 35;
        const height = (maxRow - minRow + 1) * 35;
        const x = -minCol * 35;
        const y = -minRow * 35;

        return { x, y, width, height };
    };

    if (currentGame) {
        return (
            <GameBoard 
                game={currentGame}
                currentPlayerId={currentPlayerId || undefined}
                onCellClick={handleCellClick}
                onExitRoom={handleExitRoom}
            />
        );
    }

    return (
        <GameContainer>
            {!currentGame && !selectedGame && (
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
                <GameBoard
                    game={currentGame}
                    currentPlayerId={currentPlayerId ?? undefined}
                    onCellClick={handleCellClick}
                    onExitRoom={handleExitRoom}
                />
            )}

            {selectedGame && (
                <GameReplayContainer>
                    <GameReplayHeader>
                        <div className="title">
                            <h3>Chi tiết trận đấu</h3>
                            <div className="info">
                                <div className="item">
                                    <span className="label">Phòng:</span>
                                    {selectedGame.roomName}
                                </div>
                                <div className="item">
                                    <span className="label">X:</span>
                                    {selectedGame.player1Name}
                                </div>
                                <div className="item">
                                    <span className="label">O:</span>
                                    {selectedGame.player2Name}
                                </div>
                                <div className="item winner">
                                    <span className="label">Thắng:</span>
                                    {selectedGame.winner === selectedGame.player1Id ? selectedGame.player1Name : selectedGame.player2Name}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedGame(null)}>Quay lại</button>
                    </GameReplayHeader>
                    <GameReplayBoard>
                        <HistoryBoard game={selectedGame} />
                    </GameReplayBoard>
                </GameReplayContainer>
            )}
        </GameContainer>
    );
}; 