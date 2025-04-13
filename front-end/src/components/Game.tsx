import React, { useEffect, useState, useRef, useCallback } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import type { Game as GameType } from '../types/game';
import { GameStatus, parseBoard, type Board, type BoardCell } from '../types/game';
import { gameService } from '../services/gameService';
import { Board as GameBoard } from './Board';
import { HistoryBoard } from './HistoryBoard';

const GameContainer = styled.div<{ theme: typeof lightTheme }>`
    min-height: 100vh;
    padding: 40px 20px;
    background: ${props => props.theme.colors.background};
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: ${props => props.theme.colors.text.primary};
    transition: all 0.3s ease;
`;

const JoinGameForm = styled.div`
    max-width: 800px;
    margin: 0 auto 40px;
    padding: 32px;
    background: ${props => props.theme.colors.surface};
    border-radius: 24px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
    border: 1px solid ${props => props.theme.colors.border};
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;

    h2 {
        margin: 0 0 16px;
        color: ${props => props.theme.colors.text.primary};
        font-size: 24px;
        font-weight: 600;
    }

    .form-group {
        display: flex;
        gap: 16px;
        align-items: flex-start;

        @media (max-width: 640px) {
            flex-direction: column;
        }
    }

    .input-group {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;

        label {
            font-size: 14px;
            font-weight: 500;
            color: ${props => props.theme.colors.text.secondary};
        }
    }
`;

const Input = styled.input`
    width: 100%;
    padding: 14px 20px;
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: 12px;
    font-size: 15px;
    color: ${props => props.theme.colors.text.primary};
    background: ${props => props.theme.colors.surface};
    transition: all 0.2s ease;
    font-family: inherit;

    &:focus {
        outline: none;
        border-color: #60a5fa;
        box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
    }

    &::placeholder {
        color: ${props => props.theme.colors.text.secondary};
        opacity: 0.7;
    }
`;

const Button = styled.button`
    padding: 14px 24px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 600;
    font-size: 15px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: inherit;
    z-index: 1;

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    }

    &:active {
        transform: translateY(0);
    }
`;

const CreateButton = styled(Button)`
    align-self: flex-end;
    min-width: 140px;
    justify-content: center;
    
    @media (max-width: 640px) {
        align-self: stretch;
    }
`;

const RoomListContainer = styled.div`
    max-width: 800px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
`;

const RoomList = styled.div<{ theme: typeof lightTheme }>`
    background: ${props => props.theme.colors.surface};
    padding: 32px;
    border-radius: 24px;
    box-shadow: 0 20px 40px ${props => props.theme.mode === 'dark' 
        ? 'rgba(0, 0, 0, 0.3)' 
        : 'rgba(0, 0, 0, 0.05)'};
    border: 1px solid ${props => props.theme.colors.border};
    position: relative;

    h3 {
        color: ${props => props.theme.colors.text.primary};
    }
`;

const RoomListTitle = styled.h3`
    margin: 0 0 24px;
    color: #1e293b;
    font-size: 20px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
    z-index: 1;

    &::after {
        content: '';
        position: absolute;
        left: 0;
        bottom: -8px;
        width: 40px;
        height: 3px;
        background: linear-gradient(90deg, #3b82f6, #2563eb);
        border-radius: 3px;
    }

    svg {
        width: 24px;
        height: 24px;
        color: #3b82f6;
    }
`;

const RoomItem = styled.div<{ theme: typeof lightTheme }>`
    padding: 20px;
    border-radius: 16px;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: ${props => props.theme.colors.surface};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid ${props => props.theme.colors.border};
    cursor: pointer;
    z-index: 1;
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
            45deg,
            rgba(59, 130, 246, 0.1),
            rgba(37, 99, 235, 0.1)
        );
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    &:hover {
        transform: translateY(-4px) scale(1.02);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        border-color: #60a5fa;

        &::before {
            opacity: 1;
        }
    }

    &:active {
        transform: translateY(-2px) scale(1.01);
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    animation: slideIn 0.5s ease backwards;
    animation-delay: calc(var(--index, 0) * 0.1s);
`;

const RoomInfo = styled.div`
    flex: 1;
    margin-right: 16px;
    z-index: 1;
`;

const RoomName = styled.div`
    font-weight: 600;
    color: #1e293b;
    font-size: 16px;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;

    .password-icon {
        color: #64748b;
        font-size: 14px;
        display: flex;
        align-items: center;
        
        &::before {
            content: '🔒';
        }
    }
`;

const PlayerName = styled.div`
    color: #64748b;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 6px;

    &::before {
        content: '👤';
        font-size: 14px;
    }
`;

const RoomStatus = styled.div<{ status: 'open' | 'playing' | 'waiting' }>`
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    
    ${props => {
        switch (props.status) {
            case 'open':
                return `
                    background: rgba(34, 197, 94, 0.1);
                    color: #16a34a;
                    &::before { content: '🟢'; }
                `;
            case 'playing':
                return `
                    background: rgba(239, 68, 68, 0.1);
                    color: #dc2626;
                    &::before { content: '🔴'; }
                `;
            case 'waiting':
                return `
                    background: rgba(234, 179, 8, 0.1);
                    color: #ca8a04;
                    &::before { content: '🟡'; }
                `;
        }
    }}
`;

const JoinButton = styled.button`
    padding: 10px 16px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: inherit;
    z-index: 2;
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
        );
        transition: left 0.5s ease;
    }

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);

        &::before {
            left: 100%;
        }
    }

    &:active {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
    }
`;

const FinishedGameInfo = styled.div`
    color: #64748b;
    font-size: 14px;
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    
    span.winner {
        color: #10b981;
        font-weight: 600;
    }

    &::before {
        content: '🏆';
        font-size: 14px;
    }
`;

const Modal = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease-out;

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
`;

const ModalContent = styled.div`
    background: white;
    padding: 32px;
    border-radius: 24px;
    width: 90vw;
    height: 90vh;
    max-width: 1200px;
    max-height: 800px;
    position: relative;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slideUp 0.3s ease-out;

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

const CloseButton = styled.button`
    position: absolute;
    top: 24px;
    right: 24px;
    background: white;
    border: 1px solid #e2e8f0;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #64748b;
    transition: all 0.2s ease;
    font-size: 20px;
    
    &:hover {
        color: #1e293b;
        border-color: #94a3b8;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    &:active {
        transform: translateY(0);
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
    border-radius: 12px;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
    
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9));
        backdrop-filter: blur(8px);
        z-index: 0;
    }
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
    background: #e2e8f0;
    transform: translate3d(${props => props.$x}px, ${props => props.$y}px, 0) scale(${props => props.$scale});
    will-change: transform;
    transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    position: absolute;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const GameCell = styled.div<{ value: number }>`
    width: 35px;
    height: 35px;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 600;
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
        font-weight: 600;
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
    z-index: 1;
`;

const FilterContainer = styled.div`
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
`;

const FilterSelect = styled.select`
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: white;
    color: #1e293b;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        border-color: #94a3b8;
    }

    &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
`;

const FilterInput = styled.input`
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: white;
    color: #1e293b;
    font-size: 14px;
    flex: 1;
    min-width: 200px;

    &:hover {
        border-color: #94a3b8;
    }

    &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
`;

const GameTime = styled.div`
    color: #64748b;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;

    .icon {
        color: #94a3b8;
    }

    .time {
        display: flex;
        align-items: center;
        gap: 4px;
        
        &::before {
            content: '⌚';
            font-size: 12px;
        }
    }

    .duration {
        display: flex;
        align-items: center;
        gap: 4px;
        
        &::before {
            content: '⏱️';
            font-size: 12px;
        }
    }
`;

const ThemeToggle = styled.button`
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: ${props => props.theme.mode === 'dark' 
        ? 'linear-gradient(135deg, #1e293b, #0f172a)'
        : 'linear-gradient(135deg, #f8fafc, #f1f5f9)'};
    border: 1px solid ${props => props.theme.mode === 'dark' ? '#334155' : '#e2e8f0'};
    color: ${props => props.theme.mode === 'dark' ? '#f1f5f9' : '#1e293b'};
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px ${props => props.theme.mode === 'dark' 
        ? 'rgba(0, 0, 0, 0.3)' 
        : 'rgba(0, 0, 0, 0.1)'};
    z-index: 1000;

    &:hover {
        transform: translateY(-2px) rotate(8deg);
        box-shadow: 0 8px 24px ${props => props.theme.mode === 'dark' 
            ? 'rgba(0, 0, 0, 0.4)' 
            : 'rgba(0, 0, 0, 0.15)'};
    }

    &:active {
        transform: translateY(0) rotate(0);
    }
`;

const darkTheme = {
    mode: 'dark',
    colors: {
        background: '#0f172a',
        surface: '#1e293b',
        border: '#334155',
        text: {
            primary: '#f1f5f9',
            secondary: '#94a3b8'
        },
        primary: '#3b82f6'
    }
};

const lightTheme = {
    mode: 'light',
    colors: {
        background: '#f8fafc',
        surface: '#ffffff',
        border: '#e2e8f0',
        text: {
            primary: '#1e293b',
            secondary: '#64748b'
        },
        primary: '#3b82f6'
    }
};

const CreateRoomButton = styled(Button)`
    margin-bottom: 20px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    border: none;
    padding: 16px 32px;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    
    &::before {
        content: '🎮';
        font-size: 20px;
    }

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(37, 99, 235, 0.2);
    }
`;

const CreateRoomModal = styled(Modal)`
    .modal-content {
        max-width: 600px;
        max-height: 400px;
        padding: 32px;
        display: flex;
        flex-direction: column;
        gap: 24px;
        animation: slideUp 0.3s ease-out;
    }

    h2 {
        margin: 0;
        color: ${props => props.theme.colors.text.primary};
        font-size: 24px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 12px;

        &::before {
            content: '🎮';
            font-size: 28px;
        }
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: 8px;

        label {
            font-size: 14px;
            font-weight: 500;
            color: ${props => props.theme.colors.text.secondary};
        }
    }

    .buttons {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 8px;
    }
`;

const CancelButton = styled(Button)`
    background: ${props => props.theme.colors.surface};
    color: ${props => props.theme.colors.text.primary};
    border: 1px solid ${props => props.theme.colors.border};
    
    &:hover {
        background: ${props => props.theme.colors.border};
    }
`;

const PasswordDialog = styled(Modal)`
    .modal-content {
        max-width: 400px;
        max-height: 250px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    h3 {
        margin: 0;
        font-size: 20px;
        color: ${props => props.theme.colors.text.primary};
        display: flex;
        align-items: center;
        gap: 8px;

        &::before {
            content: '🔒';
            font-size: 24px;
        }
    }

    .buttons {
        display: flex;
        gap: 12px;
        justify-content: center;
    }
`;

const WinnerModal = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
`;

const WinnerContent = styled.div`
    background: white;
    padding: 32px;
    border-radius: 16px;
    text-align: center;
    animation: slideUp 0.3s ease-out;
`;

const WinnerTitle = styled.h2<{ $isWinner: boolean }>`
    font-size: 32px;
    margin-bottom: 16px;
    color: ${props => props.$isWinner ? '#10b981' : '#ef4444'};
`;

const WinnerText = styled.div<{ $isWinner: boolean }>`
    font-size: 24px;
    font-weight: bold;
    color: ${props => props.$isWinner ? '#10b981' : '#ef4444'};
    margin-bottom: 24px;
`;

const PlayAgainButton = styled(Button)`
    font-size: 18px;
    padding: 12px 32px;
`;

const ViewerCount = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    color: #64748b;
    font-size: 14px;
    margin-top: 4px;

    &::before {
        content: '👀';
        font-size: 14px;
    }
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
    const [filterPlayer, setFilterPlayer] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark' ? darkTheme : lightTheme;
    });
    const [password, setPassword] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [selectedRoomForPassword, setSelectedRoomForPassword] = useState<{
        roomName: string;
        action: 'join' | 'view';
    } | null>(null);
    const [passwordInput, setPasswordInput] = useState('');

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
                    if (mounted) {
                        if (currentGame && game.id === currentGame.id) {
                            setCurrentGame(game);
                            localStorage.setItem(`currentGame_${tabId}`, JSON.stringify(game));
                        }
                        setAvailableRooms(prev => 
                            prev.map(room => room.id === game.id ? game : room)
                        );
                    }
                });

                gameService.onViewerJoined((game: GameType) => {
                    if (mounted) {
                        setAvailableRooms(prev => 
                            prev.map(room => room.id === game.id ? game : room)
                        );
                    }
                });

                gameService.onViewerLeft((game: GameType) => {
                    if (mounted) {
                        setAvailableRooms(prev => 
                            prev.map(room => room.id === game.id ? game : room)
                        );
                    }
                });

                gameService.onAvailableRooms((rooms: GameType[]) => {
                    if (mounted && Array.isArray(rooms)) {
                        const availableRooms = rooms.filter(room => 
                            (room.status === "Waiting" || room.status === "InProgress") && 
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

                        if (currentGame?.id === game.id && !currentPlayerId) {
                            const winnerName = game.winner === game.player1Id ? game.player1Name : game.player2Name;
                            const loserName = game.winner === game.player1Id ? game.player2Name : game.player1Name;
                            
                            const modalElement = document.createElement('div');
                            modalElement.innerHTML = `
                                <div style="
                                    position: fixed;
                                    top: 0;
                                    left: 0;
                                    right: 0;
                                    bottom: 0;
                                    background: rgba(0, 0, 0, 0.5);
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    z-index: 1000;
                                ">
                                    <div style="
                                        background: linear-gradient(145deg, #ffffff, #f8fafc);
                                        padding: 32px;
                                        border-radius: 16px;
                                        text-align: center;
                                        animation: slideUp 0.3s ease-out;
                                        max-width: 90%;
                                        width: 400px;
                                    ">
                                        <h2 style="
                                            font-size: 32px;
                                            margin-bottom: 16px;
                                            color:linear-gradient(135deg, #4ade80, #22c55e);
                                        ">😢 Trận đấu kết thúc! 😢</h2>
                                        <div style="
                                            font-size: 24px;
                                            font-weight: bold;
                                            color:linear-gradient(135deg,rgb(22, 107, 185),rgb(6, 125, 172));
                                            margin-bottom: 24px;
                                        ">${winnerName} đã chiến thắng một thằng thua cuộc tên ${loserName} !</div>
                                    </div>
                                </div>
                            `;
                            document.body.appendChild(modalElement);

                            setTimeout(() => {
                                document.body.removeChild(modalElement);
                                setCurrentGame(null);
                                localStorage.removeItem(`currentGame_${tabId}`);
                            }, 2000);
                        }

                        setShowPasswordDialog(false);
                        setPasswordInput('');
                        setSelectedRoomForPassword(null);
                    }
                });

                const [initialRooms, finishedGames] = await Promise.all([
                    gameService.getAvailableRooms(),
                    gameService.getFinishedGames()
                ]);

                if (mounted) {
                    if (Array.isArray(initialRooms)) {
                        const availableRooms = initialRooms.filter(room => 
                            (room.status === "Waiting" || room.status === "InProgress") && 
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
            await gameService.createGame(playerName, roomName, userId, password);
            setRoomName('');
            setPassword('');
            setIsCreateModalOpen(false);
        } catch (error) {
            console.error('Create game error:', error);
            gameService.showError('Không thể tạo game');
            setIsCreating(false);
        }
    };

    const handleJoinGame = async (roomName: string, password: string = "") => {
        if (!playerName) {
            gameService.showError('Vui lòng nhập tên người chơi');
            return;
        }
        try {
            setIsJoining(true);
            await gameService.joinGame(roomName, playerName, userId, password);
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

    const formatDate = (date: string) => {
        const d = new Date(date);
        return new Intl.DateTimeFormat('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(d);
    };

    const formatDuration = (start: string, end: string) => {
        if (!start || !end) return "00:00";
        const startDate = new Date(start);
        const endDate = new Date(end);
        const duration = endDate.getTime() - startDate.getTime();
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const toggleTheme = () => {
        const newTheme = theme.mode === 'dark' ? lightTheme : darkTheme;
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme.mode);
    };

    const handleViewLiveGame = async (room: GameType) => {
        try {
            setCurrentGame(room);
            setCurrentPlayerId(null);
            localStorage.setItem(`currentGame_${tabId}`, JSON.stringify(room));
        } catch (error) {
            console.error('View live game error:', error);
            gameService.showError('Không thể xem trận đấu');
        }
    };

    const handlePasswordSubmit = async () => {
        if (!selectedRoomForPassword) return;

        try {
            if (selectedRoomForPassword.action === 'join') {
                await handleJoinGame(selectedRoomForPassword.roomName, passwordInput);
            } else {
                const room = availableRooms.find(r => r.roomName === selectedRoomForPassword.roomName);
                if (room) {
                    await handleViewLiveGame(room);
                }
            }
        } catch (error) {
            console.error('Password error:', error);
            gameService.showError('Mật khẩu không đúng');
            setPasswordInput('');
        }
    };

    const initiateJoinGame = (room: GameType) => {
        if (room.hasPassword) {
            setSelectedRoomForPassword({
                roomName: room.roomName,
                action: 'join'
            });
            setShowPasswordDialog(true);
            setPasswordInput('');
            setIsJoining(false);
        } else {
            setIsJoining(true);
            handleJoinGame(room.roomName);
        }
    };

    if (currentGame) {
        return (
            <ThemeProvider theme={theme}>
                <GameContainer theme={theme}>
                    <ThemeToggle onClick={toggleTheme} theme={theme}>
                        {theme.mode === 'dark' ? '🌙' : '☀️'}
                    </ThemeToggle>
                    <GameBoard 
                        game={currentGame}
                        currentPlayerId={currentPlayerId ?? undefined}
                        onCellClick={handleCellClick}
                        onExitRoom={handleExitRoom}
                        isSpectator={!currentPlayerId}
                    />
                </GameContainer>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <GameContainer theme={theme}>
                <ThemeToggle onClick={toggleTheme} theme={theme}>
                    {theme.mode === 'dark' ? '🌙' : '☀️'}
                </ThemeToggle>
                {!currentGame && !selectedGame && (
                    <>
                        <CreateRoomButton onClick={() => setIsCreateModalOpen(true)}>
                            Tạo phòng mới
                        </CreateRoomButton>

                        {isCreateModalOpen && (
                            <CreateRoomModal>
                                <div className="modal-content">
                                    <h2>Tạo phòng mới</h2>
                                    <div className="form-group">
                                        <div className="input-group">
                                            <label>Tên người chơi</label>
                                            <Input
                                                type="text"
                                                placeholder="Nhập tên của bạn"
                                                value={playerName}
                                                onChange={(e) => setPlayerName(e.target.value)}
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Tên phòng</label>
                                            <Input
                                                type="text"
                                                placeholder="Nhập tên phòng"
                                                value={roomName}
                                                onChange={(e) => setRoomName(e.target.value)}
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Mật khẩu (không bắt buộc)</label>
                                            <Input
                                                type="password"
                                                placeholder="Nhập mật khẩu (không bắt buộc)"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="buttons">
                                        <CancelButton onClick={() => setIsCreateModalOpen(false)}>
                                            Hủy
                                        </CancelButton>
                                        <CreateButton onClick={() => {
                                            handleCreateGame();
                                            if (!isCreating) {
                                                setIsCreateModalOpen(false);
                                            }
                                        }} disabled={isCreating}>
                                            {isCreating ? 'Đang tạo...' : 'Tạo phòng'}
                                        </CreateButton>
                                    </div>
                                </div>
                            </CreateRoomModal>
                        )}

                        <RoomListContainer>
                            <RoomList theme={theme}>
                                <RoomListTitle>
                                    Danh sách phòng
                                    <div className="shimmer"></div>
                                </RoomListTitle>
                                {availableRooms.map((room) => (
                                    <RoomItem key={room.id}>
                                        <RoomInfo>
                                            <RoomName>
                                                {room.roomName}
                                                {room.hasPassword && <span className="password-icon" title="Phòng có mật khẩu"></span>}
                                            </RoomName>
                                            <PlayerName>Chủ phòng: {room.player1Name}</PlayerName>
                                            {room.status === "InProgress" && (
                                                <>
                                                    <PlayerName>Đối thủ: {room.player2Name}</PlayerName>
                                                    <ViewerCount>
                                                        {room.viewerCount || 0} người xem
                                                    </ViewerCount>
                                                </>
                                            )}
                                            <RoomStatus status={room.status === "InProgress" ? 'playing' : room.player1Name ? 'waiting' : 'open'}>
                                                {room.status === "InProgress" ? 'Đang chơi' : room.player1Name ? 'Đang chờ' : 'Đang mở'}
                                            </RoomStatus>
                                        </RoomInfo>
                                        {room.status === "InProgress" ? (
                                            <JoinButton onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewLiveGame(room);
                                            }}>
                                                Xem trận đấu
                                            </JoinButton>
                                        ) : (
                                            <JoinButton onClick={() => initiateJoinGame(room)} disabled={isJoining}>
                                                {isJoining ? 'Đang vào...' : 'Vào phòng'}
                                            </JoinButton>
                                        )}
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
                                <FilterContainer>
                                    <FilterInput
                                        type="text"
                                        placeholder="Tìm theo tên người chơi..."
                                        value={filterPlayer}
                                        onChange={(e) => setFilterPlayer(e.target.value)}
                                    />
                                    <FilterSelect value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                        <option value="newest">Mới nhất</option>
                                        <option value="oldest">Cũ nhất</option>
                                        <option value="winner">Theo người thắng</option>
                                    </FilterSelect>
                                </FilterContainer>
                                {finishedGames
                                    .filter(game => 
                                        !filterPlayer || 
                                        (game.player1Name?.toLowerCase() || '').includes(filterPlayer.toLowerCase()) ||
                                        (game.player2Name?.toLowerCase() || '').includes(filterPlayer.toLowerCase())
                                    )
                                    .sort((a, b) => {
                                        switch (sortBy) {
                                            case 'oldest':
                                                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                                            case 'winner':
                                                const getWinnerName = (game: GameType) => 
                                                    game.winner === game.player1Id ? game.player1Name || '' : game.player2Name || '';
                                                return getWinnerName(a).localeCompare(getWinnerName(b));
                                            default:
                                                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                                        }
                                    })
                                    .map((game, index) => (
                                        <RoomItem 
                                            key={game.id} 
                                            onClick={() => handleViewGameHistory(game)}
                                            style={{ '--index': index } as React.CSSProperties}
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
                                                <GameTime>
                                                    <span className="time">
                                                        {formatDate(game.createdAt)}
                                                    </span>
                                                    <span className="duration">
                                                        {game.duration || (game.endedAt && formatDuration(game.createdAt, game.endedAt)) || "00:00"}
                                                    </span>
                                                </GameTime>
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
                        isSpectator={!currentPlayerId}
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

                {showPasswordDialog && (
                    <PasswordDialog>
                        <div className="modal-content">
                            <h3>Nhập mật khẩu phòng</h3>
                            <Input
                                type="password"
                                placeholder="Nhập mật khẩu"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                            />
                            <div className="buttons">
                                <CancelButton onClick={() => {
                                    setShowPasswordDialog(false);
                                    setPasswordInput('');
                                    setSelectedRoomForPassword(null);
                                }}>
                                    Hủy
                                </CancelButton>
                                <CreateButton onClick={handlePasswordSubmit}>
                                    Xác nhận
                                </CreateButton>
                            </div>
                        </div>
                    </PasswordDialog>
                )}
            </GameContainer>
        </ThemeProvider>
    );
}; 