import React from 'react';
import styled from 'styled-components';
import { Game } from '../types/game';

const BoardContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
`;

const GameInfo = styled.div`
    margin-bottom: 20px;
    text-align: center;
`;

const PlayerInfo = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 600px;
    margin-bottom: 20px;
`;

const Player = styled.div<{ isCurrentTurn?: boolean }>`
    padding: 10px;
    border-radius: 5px;
    background-color: ${props => props.isCurrentTurn ? '#e3f2fd' : 'transparent'};
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(15, 40px);
    gap: 1px;
    background-color: #ccc;
    padding: 1px;
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
    user-select: none;
    
    &:hover {
        background-color: #f5f5f5;
    }

    ${props => props.isWinningCell && `
        background-color: #81c784;
        color: white;
    `}
`;

interface BoardProps {
    game: Game;
    currentPlayerId?: string;
    onCellClick: (row: number, col: number) => void;
}

export const Board: React.FC<BoardProps> = ({ game, currentPlayerId, onCellClick }) => {
    const isCurrentPlayerTurn = game.currentTurn === currentPlayerId;
    
    // Khởi tạo bàn cờ trống nếu chưa có
    const board = game.board || Array(15).fill(null).map(() => Array(15).fill(''));

    const renderCell = (row: number, col: number) => {
        const value = board[row]?.[col] || '';
        const isClickable = game.status === 'InProgress' && 
                          isCurrentPlayerTurn && 
                          !value;

        return (
            <Cell 
                key={`${row}-${col}`}
                onClick={() => isClickable && onCellClick(row, col)}
                style={{ cursor: isClickable ? 'pointer' : 'default' }}
            >
                {value}
            </Cell>
        );
    };

    const getGameStatus = () => {
        if (game.winner) {
            const winnerName = game.winner === game.player1Id ? game.player1Name : game.player2Name;
            return `Người chiến thắng: ${winnerName}`;
        }
        if (game.status === 'InProgress') {
            const currentPlayerName = game.currentTurn === game.player1Id ? game.player1Name : game.player2Name;
            return `Lượt của: ${currentPlayerName}`;
        }
        return 'Đang chờ người chơi...';
    };

    return (
        <BoardContainer>
            <GameInfo>
                <h2>Phòng: {game.roomName}</h2>
                <p>{getGameStatus()}</p>
            </GameInfo>

            <PlayerInfo>
                <Player isCurrentTurn={game.currentTurn === game.player1Id}>
                    <strong>X</strong> - {game.player1Name}
                    {currentPlayerId === game.player1Id && ' (Bạn)'}
                </Player>
                <Player isCurrentTurn={game.currentTurn === game.player2Id}>
                    <strong>O</strong> - {game.player2Name || 'Đang chờ...'}
                    {currentPlayerId === game.player2Id && ' (Bạn)'}
                </Player>
            </PlayerInfo>

            <Grid>
                {Array(15).fill(null).map((_, rowIndex) => (
                    Array(15).fill(null).map((_, colIndex) => renderCell(rowIndex, colIndex))
                ))}
            </Grid>
        </BoardContainer>
    );
}; 