import React from 'react';
import styled from 'styled-components';
import { Game } from '../types/game';

const BoardContainer = styled.div`
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    position: relative;
`;

const GameInfo = styled.div`
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f5f5f5;
    border-radius: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const PlayerInfo = styled.div`
    flex: 1;
`;

const ExitButton = styled.button`
    padding: 8px 16px;
    background-color: #e74c3c;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-left: 10px;

    &:hover {
        background-color: #c0392b;
    }
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(15, 40px);
    gap: 1px;
    background-color: #ddd;
    padding: 1px;
    border: 1px solid #999;
`;

const Cell = styled.div<{ isWinningCell?: boolean }>`
    width: 40px;
    height: 40px;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    cursor: pointer;
    border: 1px solid #ddd;
    ${props => props.isWinningCell && `
        background-color: #2ecc71;
        color: white;
    `}

    &:hover {
        background-color: ${props => props.isWinningCell ? '#2ecc71' : '#f0f0f0'};
    }
`;

const WinnerModal = styled.div`
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

const WinnerContent = styled.div`
    background-color: white;
    padding: 30px;
    border-radius: 10px;
    text-align: center;
    animation: slideIn 0.5s ease-out;

    @keyframes slideIn {
        from {
            transform: translateY(-100px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;

const WinnerTitle = styled.h2<{ isWinner: boolean }>`
    color: ${props => props.isWinner ? '#2ecc71' : '#e74c3c'};
    margin-bottom: 20px;
    font-size: 28px;
`;

const WinnerText = styled.p<{ isWinner: boolean }>`
    font-size: 18px;
    margin-bottom: 20px;
    color: ${props => props.isWinner ? '#27ae60' : '#c0392b'};
`;

const PlayAgainButton = styled.button`
    padding: 10px 20px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;

    &:hover {
        background-color: #2980b9;
    }
`;

interface BoardProps {
    game: Game;
    currentPlayerId?: string;
    onCellClick: (row: number, col: number) => void;
    onExitRoom: () => void;
}

export const Board: React.FC<BoardProps> = ({ game, currentPlayerId, onCellClick, onExitRoom }) => {
    const isMyTurn = game.currentTurn === currentPlayerId;
    const isPlayer1 = currentPlayerId === game.player1Id;
    const mySymbol = isPlayer1 ? 'X' : 'O';
    const opponentSymbol = isPlayer1 ? 'O' : 'X';

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
                isWinningCell={false}
            >
                {symbol}
            </Cell>
        );
    };

    const getWinnerName = () => {
        if (!game.winner) return null;
        return game.winner === game.player1Id ? game.player1Name : game.player2Name;
    };

    const amIWinner = getWinnerName() === (isPlayer1 ? game.player1Name : game.player2Name);

    return (
        <BoardContainer>
            <GameInfo>
                <PlayerInfo>
                    <h2>Phòng: {game.roomName}</h2>
                    <div>Người chơi 1 (X): {game.player1Name}</div>
                    <div>Người chơi 2 (O): {game.player2Name || 'Đang chờ...'}</div>
                    <div>Lượt chơi: {isMyTurn ? 'Đến lượt bạn' : 'Đợi đối thủ'}</div>
                    <div>Bạn chơi: {mySymbol}</div>
                </PlayerInfo>
                <ExitButton onClick={onExitRoom}>
                    Thoát phòng
                </ExitButton>
            </GameInfo>
            <Grid>
                {Array(225).fill(null).map((_, index) => renderCell(index))}
            </Grid>

            {game.status === "Finished" && game.winner && (
                <WinnerModal>
                    <WinnerContent>
                        <WinnerTitle isWinner={amIWinner}>
                            {amIWinner ? '🎉 Chúc mừng! 🎉' : '😢 Thua cuộc! 😢'}
                        </WinnerTitle>
                        <WinnerText isWinner={amIWinner}>
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