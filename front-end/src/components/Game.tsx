import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Game as GameType } from '../types/game';
import { gameService } from '../services/gameService';

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

    useEffect(() => {
        gameService.onError((message) => {
            console.error('Error:', message);
            alert(message);
        });

        // Cập nhật danh sách phòng mỗi 5 giây
        const interval = setInterval(updateAvailableRooms, 5000);
        
        // Cập nhật danh sách phòng ngay khi component mount
        updateAvailableRooms();
        
        return () => clearInterval(interval);
    }, []);

    const updateAvailableRooms = async () => {
        try {
            setIsLoading(true);
            const rooms = await gameService.getAvailableRooms();
            setAvailableRooms(rooms || []);
        } catch (error) {
            console.error('Error fetching rooms:', error);
            setAvailableRooms([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateGame = async () => {
        if (!playerName) {
            alert('Vui lòng nhập tên người chơi');
            return;
        }
        if (!roomName) {
            alert('Vui lòng nhập tên phòng');
            return;
        }
        try {
            await gameService.createGame(playerName, roomName);
        } catch (error) {
            console.error('Create game error:', error);
            alert('Không thể tạo game');
        }
    };

    const handleJoinGame = async (roomName: string) => {
        if (!playerName) {
            alert('Vui lòng nhập tên người chơi');
            return;
        }
        try {
            await gameService.joinGame(roomName, playerName);
        } catch (error) {
            console.error('Join game error:', error);
            alert('Không thể tham gia game');
        }
    };

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
                    <Button onClick={handleCreateGame}>Tạo phòng mới</Button>
                </div>
            </JoinGameForm>

            <RoomList>
                <h3>Danh sách phòng đang chờ</h3>
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
                            <Button onClick={() => handleJoinGame(room.roomName)}>
                                Tham gia
                            </Button>
                        </RoomItem>
                    ))
                )}
            </RoomList>
        </GameContainer>
    );
}; 