import React, { useState } from 'react';
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
    justify-content: space-between;
    align-items: flex-start;
    box-shadow: 0 4px 15px rgba(0,0,0,0.03);
`;

const PlayerInfo = styled.div`
    flex: 1;
`;

const RoomTitle = styled.h2`
    color: #2d3748;
    margin-bottom: 20px;
    font-size: 22px;
    font-weight: 600;
    font-family: 'Segoe UI', system-ui, sans-serif;
`;

const PlayerStatus = styled.div<{ isCurrentPlayer?: boolean; isWinner?: boolean }>`
    padding: 10px 16px;
    margin: 8px 0;
    background: ${props => 
        props.isWinner 
            ? 'linear-gradient(135deg, #4ade80, #22c55e)'
            : props.isCurrentPlayer 
                ? 'linear-gradient(135deg, #60a5fa, #3b82f6)'
                : '#ffffff'
    };
    color: ${props => (props.isCurrentPlayer || props.isWinner) ? '#ffffff' : '#4a5568'};
    border-radius: 10px;
    transition: all 0.2s ease;
    font-size: 15px;
    font-weight: 500;
    box-shadow: ${props => 
        (props.isCurrentPlayer || props.isWinner) 
            ? '0 2px 8px rgba(0,0,0,0.08)' 
            : '0 1px 3px rgba(0,0,0,0.02)'
    };
    border: 1px solid ${props => 
        props.isWinner 
            ? '#22c55e'
            : props.isCurrentPlayer 
                ? '#3b82f6'
                : '#e2e8f0'
    };

    .waiting {
        display: inline-block;
        animation: rotate 2s infinite linear;
        transform-origin: center;
    }

    @keyframes rotate {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
`;

const TurnIndicator = styled.div<{ isMyTurn: boolean }>`
    font-size: 15px;
    color: ${props => props.isMyTurn ? '#047857' : '#991b1b'};
    font-weight: 500;
    margin-top: 16px;
    padding: 10px 16px;
    background: ${props => props.isMyTurn ? '#ecfdf5' : '#fef2f2'};
    border-radius: 10px;
    border: 1px solid ${props => props.isMyTurn ? '#6ee7b7' : '#fecaca'};

    @keyframes rotate {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    .hourglass {
        display: inline-block;
        animation: rotate 2s infinite linear;
        transform-origin: center;
    }
`;

const ExitButton = styled.button`
    padding: 10px 20px;
    background: linear-gradient(135deg, #f87171, #ef4444);
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-size: 15px;
    font-weight: 500;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 120px;
    justify-content: center;
    position: relative;
    overflow: hidden;

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
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

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(15, 35px);
    gap: 0;
    background: #f8fafc;
    padding: 10px;
    border-radius: 12px;
    margin: 0 auto;
    max-width: fit-content;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
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
    const isMyTurn = game.currentTurn === currentPlayerId;
    const isPlayer1 = currentPlayerId === game.player1Id;
    const mySymbol = isPlayer1 ? 'X' : 'O';
    const opponentSymbol = isPlayer1 ? 'O' : 'X';

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

    const renderCell = (index: number) => {
        const row = Math.floor(index / 15);
        const col = index % 15;
        const value = game.board?.[index] ?? 0;
        
        let symbol = '';
        if (value === 1) symbol = 'X';
        if (value === 2) symbol = 'O';

        return (
            <Cell 
                key={index}
                onClick={() => isMyTurn && onCellClick(row, col)}
                $isWinningCell={false}
                style={{
                    color: value === 1 ? '#e74c3c' : '#3498db',
                    cursor: isMyTurn ? 'pointer' : 'not-allowed'
                }}
            >
                {symbol}
            </Cell>
        );
    };

    const getWinnerName = () => {
        if (!game.winner) return null;
        return game.winner === game.player1Id ? game.player1Name : game.player2Name;
    };

    const amIWinner = game.winner === currentPlayerId;

    return (
        <BoardContainer>
            <GameInfo>
                <PlayerInfo>
                    <RoomTitle>Phòng: {game.roomName}</RoomTitle>
                    <PlayerStatus 
                        isCurrentPlayer={isPlayer1} 
                        isWinner={game.winner === game.player1Id}
                    >
                        Người chơi 1 (X): {game.player1Name} {isPlayer1 ? '(Bạn)' : ''}
                    </PlayerStatus>
                    <PlayerStatus 
                        isCurrentPlayer={!isPlayer1} 
                        isWinner={game.winner === game.player2Id}
                    >
                        Người chơi 2 (O): {game.player2Name 
                            ? `${game.player2Name}${!isPlayer1 ? ' (Bạn)' : ''}`
                            : <span><span className="waiting">⌛</span> Đang chờ người chơi...</span>
                        }
                    </PlayerStatus>
                    {game.status === "InProgress" && (
                        <TurnIndicator isMyTurn={isMyTurn}>
                            {isMyTurn ? '🎮 Đến lượt bạn' : <span><span className="hourglass">⌛</span> Đợi đối thủ</span>}
                        </TurnIndicator>
                    )}
                </PlayerInfo>
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
            </GameInfo>
            <Grid>
                {Array(225).fill(null).map((_, index) => renderCell(index))}
            </Grid>

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