import React from 'react';
import styled from 'styled-components';
import { Game, parseBoard, Board, BoardCell } from '../types/game';

const BoardContainer = styled.div`
    width: 100%;
    height: 100%;
    background: #f8fafc;
    position: relative;
    overflow: hidden;
    touch-action: none;
`;

const GameGridScroller = styled.div<{ $isDragging: boolean }>`
    position: absolute;
    inset: 0;
    overflow: hidden;
    cursor: ${props => props.$isDragging ? 'grabbing' : 'grab'};
    user-select: none;
    touch-action: none;
    display: flex;
    align-items: center;
    justify-content: center;
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
    gap: 0;
    background: #f8fafc;
    transform: translate(${props => props.$x}px, ${props => props.$y}px) scale(${props => props.$scale});
    will-change: transform;
    transition: transform 0.1s ease;
    position: relative;
`;

const Cell = styled.div<{ value: number }>`
    width: 35px;
    height: 35px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 500;
    color: ${props => {
        switch (props.value) {
            case 1: return '#ef4444';
            case 2: return '#3b82f6';
            default: return 'transparent';
        }
    }};
    border: 1px solid #e2e8f0;
    position: relative;
    transition: all 0.2s ease;

    &::before {
        content: ${props => {
            switch (props.value) {
                case 1: return '"X"';
                case 2: return '"O"';
                default: return '""';
            }
        }};
        position: absolute;
        font-size: 24px;
        font-weight: 500;
        color: inherit;
        text-shadow: ${props => {
            switch (props.value) {
                case 1: return '0 2px 4px rgba(239, 68, 68, 0.2)';
                case 2: return '0 2px 4px rgba(59, 130, 246, 0.2)';
                default: return 'none';
            }
        }};
    }

    &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 4px;
        background: ${props => {
            switch (props.value) {
                case 1: return 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))';
                case 2: return 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))';
                default: return 'transparent';
            }
        }};
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    &:hover::after {
        opacity: 1;
    }
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(50, 35px);
    grid-template-rows: repeat(50, 35px);
    gap: 1px;
    background: #e2e8f0;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

interface HistoryBoardProps {
    game: Game;
}

export const HistoryBoard: React.FC<HistoryBoardProps> = ({ game }) => {
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const [scale, setScale] = React.useState(0.5);
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
    const boardRef = React.useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;

        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    }, [isDragging, dragStart]);

    const handleWheel = React.useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setScale(prev => Math.min(2, Math.max(0.2, prev * delta)));
        } else {
            const speed = 1;
            setPosition(prev => ({
                x: prev.x - e.deltaX * speed,
                y: prev.y - e.deltaY * speed
            }));
        }
    }, []);

    const boardData = React.useMemo(() => {
        console.log('Raw board data:', game.board);
        return parseBoard(game.board);
    }, [game.board]);

    React.useEffect(() => {
        if (!boardRef.current) return;

        const size = 50;
        let minRow = size;
        let maxRow = 0;
        let minCol = size;
        let maxCol = 0;
        let hasMove = false;

        boardData.forEach((value, index) => {
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

        const containerRect = boardRef.current.getBoundingClientRect();
        const cellSize = 35;

        if (!hasMove) {
            const centerX = (containerRect.width - size * cellSize * 0.5) / 2;
            const centerY = (containerRect.height - size * cellSize * 0.5) / 2;
            setPosition({ x: centerX, y: centerY });
            setScale(0.5);
            return;
        }

        const padding = 2;
        minRow = Math.max(0, minRow - padding);
        maxRow = Math.min(size - 1, maxRow + padding);
        minCol = Math.max(0, minCol - padding);
        maxCol = Math.min(size - 1, maxCol + padding);

        const moveAreaWidth = (maxCol - minCol + 1) * cellSize;
        const moveAreaHeight = (maxRow - minRow + 1) * cellSize;

        const scaleX = containerRect.width / moveAreaWidth;
        const scaleY = containerRect.height / moveAreaHeight;
        const newScale = Math.min(scaleX, scaleY, 1) * 0.8;
        const scaledWidth = size * cellSize * newScale;
        const scaledHeight = size * cellSize * newScale;
        const centerX = (containerRect.width - scaledWidth) / 2 - minCol * cellSize * newScale;
        const centerY = (containerRect.height - scaledHeight) / 2 - minRow * cellSize * newScale;

        setScale(newScale);
        setPosition({ x: centerX, y: centerY });
    }, [boardData]);

    return (
        <BoardContainer ref={boardRef}>
            <GameGridScroller
                $isDragging={isDragging}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                <GameGrid
                    $x={position.x}
                    $y={position.y}
                    $scale={scale}
                >
                    {Array.from({ length: 2500 }).map((_, index) => (
                        <Cell
                            key={index}
                            value={boardData[index] || 0}
                        />
                    ))}
                </GameGrid>
            </GameGridScroller>
        </BoardContainer>
    );
}; 