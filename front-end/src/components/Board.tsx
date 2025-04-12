import React, { useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { Game } from '../types/game';

const BoardContainer = styled.div`
    max-width: 800px;
    margin: 0 auto;
    padding: 24px;
    position: relative;
    background: linear-gradient(145deg, #ffffff, #f5f7fa);
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
`;

const GameInfo = styled.div`
    margin-bottom: 30px;
    padding: 20px;
    background: #ffffff;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.03);
`;

const TopBar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
`;

const RoomTitle = styled.h2`
    color: #2d3748;
    font-size: 22px;
    font-weight: 600;
    font-family: 'Segoe UI', system-ui, sans-serif;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0;
    flex: 1;
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);

    &::before {
        content: '';
        width: 36px;
        height: 32px;
        background: linear-gradient(135deg, #fee2e2, #fecaca);
        border-radius: 8px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        animation: roomFloat 4s infinite ease-in-out;
    }

    &::after {
        content: 'X O';
        position: absolute;
        left: 24px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 15px;
        font-weight: bold;
        background: linear-gradient(90deg, #e74c3c, #3498db);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: textFloat 4s infinite ease-in-out;
        width: 32px;
        text-align: center;
        transform-origin: center center;
        letter-spacing: 2px;
    }

    .shimmer {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 50%;
        height: 100%;
        background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0) 20%,
            rgba(255, 255, 255, 0.8) 50%,
            rgba(255, 255, 255, 0) 80%,
            transparent 100%
        );
        animation: shimmer 6s infinite;
        transform: skewX(-20deg);
    }

    @keyframes shimmer {
        0% {
            transform: translateX(-150%) skewX(-20deg);
        }
        50%, 100% {
            transform: translateX(200%) skewX(-20deg);
        }
    }

    @keyframes roomFloat {
        0%, 100% { 
            transform: translateY(0px); 
        }
        50% { 
            transform: translateY(-2px); 
        }
    }

    @keyframes textFloat {
        0%, 100% { 
            transform: translateY(-50%);
            letter-spacing: 0;
        }
        25% {
            transform: translateY(-50%);
            letter-spacing: 1px;
        }
        75% {
            transform: translateY(-50%);
            letter-spacing: 1px;
        }
    }
`;

const PlayersContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    width: 100%;
`;

const PlayerCard = styled.div<{ isCurrentPlayer?: boolean; isWinner?: boolean }>`
    padding: 20px;
    background: ${props => 
        props.isWinner 
            ? 'linear-gradient(135deg, #4ade80, #22c55e)'
            : props.isCurrentPlayer 
                ? 'linear-gradient(135deg, #60a5fa, #3b82f6)'
                : '#ffffff'
    };
    border-radius: 12px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    box-shadow: ${props => 
        (props.isCurrentPlayer || props.isWinner) 
            ? '0 8px 20px rgba(0,0,0,0.1)' 
            : '0 4px 12px rgba(0,0,0,0.05)'
    };
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: ${props => 
            props.isWinner 
                ? '#22c55e'
                : props.isCurrentPlayer 
                    ? '#3b82f6'
                    : '#e2e8f0'
        };
    }
`;

const PlayerSymbol = styled.div<{ isX?: boolean; isMyTurn?: boolean }>`
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 12px;
    color: ${props => props.isX ? '#e74c3c' : '#3498db'};
    text-shadow: ${props => 
        props.isX 
            ? '0 0 15px rgba(231, 76, 60, 0.3)'
            : '0 0 15px rgba(52, 152, 219, 0.3)'
    };
    background: ${props => 
        props.isX 
            ? 'linear-gradient(135deg, #fee2e2, #fecaca)'
            : 'linear-gradient(135deg, #dbeafe, #bfdbfe)'
    };
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    position: relative;

    &::before {
        content: ${props => props.isMyTurn ? '"⚔️"' : '"🛡️"'};
        position: absolute;
        font-size: 20px;
        bottom: -8px;
        right: -8px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        animation: ${props => props.isMyTurn ? 'swordFloat' : 'shieldFloat'} 3s infinite ease-in-out;
    }

    @keyframes swordFloat {
        0%, 100% { transform: translate(0, 0) rotate(-5deg); }
        50% { transform: translate(-1px, -1px) rotate(5deg); }
    }

    @keyframes shieldFloat {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(-1px, -1px) scale(1.1); }
    }
`;

const PlayerName = styled.div<{ isActive?: boolean }>`
    font-size: 18px;
    font-weight: 600;
    color: ${props => props.isActive ? '#ffffff' : '#4a5568'};
    margin-bottom: 8px;
`;

const PlayerLabel = styled.div<{ isActive?: boolean }>`
    font-size: 14px;
    color: ${props => props.isActive ? 'rgba(255,255,255,0.9)' : '#718096'};
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const PlayerStatus = styled.div<{ isActive?: boolean }>`
    font-size: 15px;
    padding: 8px 16px;
    background: ${props => props.isActive ? 'rgba(255,255,255,0.2)' : '#f1f5f9'};
    color: ${props => props.isActive ? '#ffffff' : '#64748b'};
    border-radius: 20px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: auto;

    .waiting {
        display: inline-block;
        animation: rotate 2s infinite linear;
        transform-origin: center;
    }

    .controller {
        display: inline-block;
        animation: wiggle 1s infinite ease-in-out;
        transform-origin: center;
    }

    @keyframes rotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    @keyframes wiggle {
        0% { transform: translateY(-2px) rotate(-15deg); }
        25% { transform: translateY(-2px) rotate(0deg) scale(1.1); }
        50% { transform: translateY(-2px) rotate(15deg); }
        75% { transform: translateY(-2px) rotate(0deg) scale(1.1); }
        100% { transform: translateY(-2px) rotate(-15deg); }
    }
`;

const ExitButton = styled.button`
    padding: 12px 24px;
    background: linear-gradient(135deg, #f87171, #ef4444);
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 140px;
    justify-content: center;
    position: relative;
    overflow: hidden;
    height: 48px;

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(239, 68, 68, 0.2);
    }

    &:active {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.9;
        cursor: not-allowed;
        transform: none;
    }

    @keyframes drive {
        0% {
            transform: translateX(-120%) scale(0.8);
        }
        15% {
            transform: translateX(-50%) scale(1);
        }
        75% {
            transform: translateX(30%) scale(1);
        }
        100% {
            transform: translateX(200%) scale(0.8) rotate(-5deg);
        }
    }

    @keyframes bounce {
        0%, 100% {
            transform: translateY(0) rotate(-1deg);
        }
        50% {
            transform: translateY(-2px) rotate(1deg);
        }
    }

    @keyframes smoke {
        0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.8;
            filter: blur(2px);
        }
        100% {
            transform: translate(-15px, -10px) scale(0);
            opacity: 0;
            filter: blur(4px);
        }
    }

    @keyframes flame {
        0% {
            transform: scaleX(1);
            opacity: 0.9;
            filter: blur(1px);
        }
        100% {
            transform: scaleX(0.3);
            opacity: 0;
            filter: blur(2px);
        }
    }

    .car-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .car {
        position: relative;
        width: 40px;
        height: 18px;
        animation: drive 1.5s cubic-bezier(0.3, 0, 0.3, 1) infinite;
    }

    .car-body {
        position: absolute;
        bottom: 0;
        width: 40px;
        height: 12px;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        border-radius: 6px;
        animation: bounce 0.5s ease-in-out infinite;

        &::before {
            content: '';
            position: absolute;
            top: -7px;
            left: 8px;
            width: 24px;
            height: 9px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-radius: 8px 8px 0 0;
            transform: skewX(-10deg);
        }

        &::after {
            content: '';
            position: absolute;
            bottom: 2px;
            right: 4px;
            width: 4px;
            height: 4px;
            background: #60a5fa;
            border-radius: 50%;
            box-shadow: 0 0 4px #60a5fa;
        }
    }

    .wheel {
        position: absolute;
        bottom: -2px;
        width: 8px;
        height: 8px;
        background: #1e293b;
        border-radius: 50%;
        box-shadow: inset 0 0 2px rgba(255,255,255,0.5);
        
        &::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 4px;
            height: 4px;
            background: #94a3b8;
            border-radius: 50%;
            transform: translate(-50%, -50%);
        }
        
        &.front {
            right: 4px;
        }
        
        &.back {
            left: 4px;
        }
    }

    .smoke {
        position: absolute;
        left: 2px;
        bottom: 2px;
        width: 6px;
        height: 6px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        animation: smoke 0.3s linear infinite;
        box-shadow: 0 0 4px rgba(255,255,255,0.6);
    }

    .flame {
        position: absolute;
        left: -2px;
        bottom: 4px;
        width: 12px;
        height: 4px;
        background: linear-gradient(90deg, #fbbf24, #f87171);
        border-radius: 4px;
        animation: flame 0.1s linear infinite;
        box-shadow: 0 0 8px rgba(251, 191, 36, 0.6);
    }

    .wind-line {
        position: absolute;
        height: 1px;
        background: rgba(255,255,255,0.4);
        animation: smoke 0.2s linear infinite;

        &:nth-child(1) {
            width: 12px;
            left: -14px;
            top: 2px;
        }

        &:nth-child(2) {
            width: 8px;
            left: -10px;
            top: 6px;
        }

        &:nth-child(3) {
            width: 10px;
            left: -12px;
            top: 10px;
        }
    }

    .exit-text {
        opacity: ${props => props.disabled ? 0 : 1};
        transition: opacity 0.3s ease;
    }
`;

const GridContainer = styled.div`
    background: #f8fafc;
    padding: 10px;
    border-radius: 12px;
    margin: 0 auto;
    width: 100%;
    max-width: 800px;
    height: 600px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    position: relative;
    overflow: hidden;
    touch-action: none;
`;

const GridScroller = styled.div<{ $isDragging: boolean }>`
    width: 100%;
    height: 100%;
    overflow: hidden;
    padding: 20px;
    box-sizing: border-box;
    cursor: ${props => props.$isDragging ? 'grabbing' : 'grab'};
    user-select: none;
    touch-action: none;
`;

const Grid = styled.div<{ $x: number; $y: number; $scale: number }>`
    display: grid;
    grid-template-columns: repeat(50, 35px);
    grid-template-rows: repeat(50, 35px);
    gap: 0;
    background: #f8fafc;
    margin: 0 auto;
    width: fit-content;
    transform: translate3d(${props => props.$x}px, ${props => props.$y}px, 0) scale(${props => props.$scale});
    will-change: transform;
    transition: transform 0.1s ease;
`;

const Cell = styled.div<{ $isWinningCell?: boolean }>`
    width: 35px;
    height: 35px;
    background-color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
    border: 1px solid #e2e8f0;
    
    ${props => props.$isWinningCell && `
        background: linear-gradient(135deg, #4ade80, #22c55e);
        color: white;
        box-shadow: 0 0 8px rgba(74, 222, 128, 0.3);
    `}

    &:hover {
        background-color: ${props => props.$isWinningCell ? '#22c55e' : '#f1f5f9'};
        z-index: 2;
    }

    &:active {
        transform: scale(0.95);
    }
`;

const WinnerModal = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(6px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

const WinnerContent = styled.div`
    background: linear-gradient(145deg, #ffffff, #f8fafc);
    padding: 35px;
    border-radius: 20px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    max-width: 90%;
    width: 400px;

    @keyframes popIn {
        0% {
            transform: scale(0.9);
            opacity: 0;
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
`;

const WinnerTitle = styled.h2<{ $isWinner: boolean }>`
    color: ${props => props.$isWinner ? '#16a34a' : '#dc2626'};
    margin-bottom: 20px;
    font-size: 32px;
    font-weight: 700;
    line-height: 1.2;
`;

const WinnerText = styled.p<{ $isWinner: boolean }>`
    font-size: 18px;
    margin-bottom: 30px;
    color: ${props => props.$isWinner ? '#16a34a' : '#dc2626'};
    line-height: 1.4;
`;

const PlayAgainButton = styled.button`
    padding: 14px 28px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 18px;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
    }

    &:active {
        transform: translateY(0);
    }
`;

interface BoardProps {
    game: Game;
    currentPlayerId?: string;
    onCellClick: (row: number, col: number) => void;
    onExitRoom: () => void;
}

export const Board: React.FC<BoardProps> = ({ game, currentPlayerId, onCellClick, onExitRoom }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(0.8);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const gridRef = useRef<HTMLDivElement>(null);
    const isMyTurn = game.currentTurn === currentPlayerId;
    const isPlayer1 = currentPlayerId === game.player1Id;

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;
        
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    }, [isDragging, dragStart]);

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setScale(prev => Math.min(2, Math.max(0.3, prev * delta)));
        } else {
            const speed = 1;
            setPosition(prev => ({
                x: prev.x - e.deltaX * speed,
                y: prev.y - e.deltaY * speed
            }));
        }
    }, []);

    React.useEffect(() => {
        if (!gridRef.current) return;

        const containerRect = gridRef.current.getBoundingClientRect();
        const gridSize = 50 * 35;
        const initialScale = 0.8;
        const scaledSize = gridSize * initialScale;
        
        setPosition({
            x: (containerRect.width - scaledSize) / 2,
            y: (containerRect.height - scaledSize) / 2
        });
        setScale(initialScale);
    }, []);

    const renderCell = useCallback((index: number) => {
        const row = Math.floor(index / 50);
        const col = index % 50;
        
        const boardIndex = row * 50 + col;
        const value = game.board?.[boardIndex] ?? 0;
        
        let symbol = '';
        if (value === 1) symbol = 'X';
        if (value === 2) symbol = 'O';

        const canPlay = isMyTurn && !value;

        return (
            <Cell 
                key={`${row}-${col}`}
                onClick={() => canPlay && onCellClick(row, col)}
                $isWinningCell={false}
                style={{
                    color: value === 1 ? '#e74c3c' : '#3498db',
                    cursor: canPlay ? 'pointer' : 'not-allowed',
                    background: value ? '#ffffff' : '#f8fafc',
                    borderColor: '#e2e8f0'
                }}
            >
                {symbol}
            </Cell>
        );
    }, [game.board, isMyTurn, onCellClick]);

    const handleExit = async () => {
        setIsExiting(true);
        try {
            const exitPromise = onExitRoom();
            await Promise.all([
                exitPromise,
                new Promise(resolve => setTimeout(resolve, 1900))
            ]);
        } finally {
            await new Promise(resolve => setTimeout(resolve, 200));
            setIsExiting(false);
        }
    };

    const getWinnerName = () => {
        if (!game.winner) return null;
        return game.winner === game.player1Id ? game.player1Name : game.player2Name;
    };

    const amIWinner = game.winner === currentPlayerId;

    return (
        <BoardContainer>
            <GameInfo>
                <TopBar>
                    <RoomTitle>
                        Phòng: {game.roomName}
                        <div className="shimmer"></div>
                    </RoomTitle>
                    <ExitButton onClick={handleExit} disabled={isExiting}>
                        {isExiting ? (
                            <>
                                <span className="car-container">
                                    <div className="car">
                                        <div className="car-body">
                                            <div className="wheel front"></div>
                                            <div className="wheel back"></div>
                                        </div>
                                        <div className="flame"></div>
                                        <div className="smoke"></div>
                                        <div className="wind-line"></div>
                                        <div className="wind-line"></div>
                                        <div className="wind-line"></div>
                                    </div>
                                </span>
                                <span style={{ opacity: 0 }}>
                                    {game.status === "Finished" ? 'Đang tải lại...' : 'Đang thoát...'}
                                </span>
                            </>
                        ) : (
                            <span className="exit-text">
                                {game.status === "Finished" ? 'Chơi lại' : 'Thoát phòng'}
                            </span>
                        )}
                    </ExitButton>
                </TopBar>
                <PlayersContainer>
                    <PlayerCard 
                        isCurrentPlayer={isPlayer1} 
                        isWinner={game.winner === game.player1Id}
                    >
                        <PlayerSymbol isX={true} isMyTurn={isPlayer1 && isMyTurn}>X</PlayerSymbol>
                        <PlayerLabel isActive={isPlayer1 || game.winner === game.player1Id}>
                            Người chơi 1
                        </PlayerLabel>
                        <PlayerName isActive={isPlayer1 || game.winner === game.player1Id}>
                            {game.player1Name} {isPlayer1 && '(Bạn)'}
                        </PlayerName>
                        {game.status === "InProgress" && isPlayer1 && (
                            <PlayerStatus isActive={true}>
                                {isMyTurn ? <><span className="controller">🎮</span> Đến lượt bạn</> : <><span className="waiting">⌛</span> Chờ đối thủ</>}
                            </PlayerStatus>
                        )}
                    </PlayerCard>

                    <PlayerCard 
                        isCurrentPlayer={!isPlayer1} 
                        isWinner={game.winner === game.player2Id}
                    >
                        <PlayerSymbol isX={false} isMyTurn={!isPlayer1 && isMyTurn}>O</PlayerSymbol>
                        <PlayerLabel isActive={!isPlayer1 || game.winner === game.player2Id}>
                            Người chơi 2
                        </PlayerLabel>
                        {game.player2Name ? (
                            <>
                                <PlayerName isActive={!isPlayer1 || game.winner === game.player2Id}>
                                    {game.player2Name} {!isPlayer1 && '(Bạn)'}
                                </PlayerName>
                                {game.status === "InProgress" && !isPlayer1 && (
                                    <PlayerStatus isActive={true}>
                                        {isMyTurn ? <><span className="controller">🎮</span> Đến lượt bạn</> : <><span className="waiting">⌛</span> Chờ đối thủ</>}
                                    </PlayerStatus>
                                )}
                            </>
                        ) : (
                            <PlayerStatus>
                                <span className="waiting">⌛</span> 
                                Đang chờ người chơi...
                            </PlayerStatus>
                        )}
                    </PlayerCard>
                </PlayersContainer>
            </GameInfo>
            <GridContainer>
                <GridScroller
                    ref={gridRef}
                    $isDragging={isDragging}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                >
                    <Grid $x={position.x} $y={position.y} $scale={scale}>
                        {Array(2500).fill(null).map((_, index) => renderCell(index))}
                    </Grid>
                </GridScroller>
            </GridContainer>

            {game.status === "Finished" && game.winner && (
                <WinnerModal>
                    <WinnerContent>
                        <WinnerTitle $isWinner={amIWinner}>
                            {amIWinner ? '🎉 Chúc mừng! 🎉' : '😢 Thua cuộc! 😢'}
                        </WinnerTitle>
                        <WinnerText $isWinner={amIWinner}>
                            {amIWinner 
                                ? "Bạn đã chiến thắng một thằng thua cuộc!" 
                                : `${getWinnerName()} đã chiến thắng rồi thằng thua cuộc!`}
                        </WinnerText>
                        <PlayAgainButton onClick={onExitRoom}>
                            Chơi lại
                        </PlayAgainButton>
                    </WinnerContent>
                </WinnerModal>
            )}
        </BoardContainer>
    );
}; 