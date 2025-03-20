using caro_online.Models;
using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;

namespace caro_online.Services
{
    public interface IGameService
    {
        Task<Game> CreateGame(string playerName, string roomName);
        Task<Game> JoinGame(string roomName, string playerName);
        Task<IEnumerable<Game>> GetAvailableRooms();
    }

    public class GameService : IGameService
    {
        private readonly ConcurrentDictionary<string, Game> _games = new();

        public async Task<Game> CreateGame(string playerName, string roomName)
        {
            if (string.IsNullOrEmpty(playerName) || string.IsNullOrEmpty(roomName))
            {
                throw new Exception("Tên người chơi và tên phòng không được để trống");
            }

            if (_games.ContainsKey(roomName))
            {
                throw new Exception("Phòng đã tồn tại");
            }

            var game = new Game
            {
                Id = Guid.NewGuid().ToString(),
                RoomName = roomName,
                Player1Id = Guid.NewGuid().ToString(),
                Player1Name = playerName,
                Status = "Waiting"
            };

            if (!_games.TryAdd(roomName, game))
            {
                throw new Exception("Không thể tạo phòng");
            }

            // Log để debug
            Console.WriteLine($"Created game: {game.RoomName} by {game.Player1Name}");
            Console.WriteLine($"Total games: {_games.Count}");
            Console.WriteLine($"Available rooms: {_games.Values.Count(g => g.Status == "Waiting")}");

            return game;
        }

        public async Task<Game> JoinGame(string roomName, string playerName)
        {
            if (string.IsNullOrEmpty(playerName) || string.IsNullOrEmpty(roomName))
            {
                throw new Exception("Tên người chơi và tên phòng không được để trống");
            }

            if (!_games.TryGetValue(roomName, out var game))
            {
                throw new Exception("Không tìm thấy phòng");
            }

            if (game.Status != "Waiting")
            {
                throw new Exception("Phòng đã đầy");
            }

            game.Player2Id = Guid.NewGuid().ToString();
            game.Player2Name = playerName;
            game.Status = "InProgress";

            // Log để debug
            Console.WriteLine($"Player {playerName} joined room {roomName}");
            Console.WriteLine($"Total games: {_games.Count}");
            Console.WriteLine($"Available rooms: {_games.Values.Count(g => g.Status == "Waiting")}");

            return game;
        }

        public async Task<IEnumerable<Game>> GetAvailableRooms()
        {
            var rooms = _games.Values.Where(g => g.Status == "Waiting").ToList();
            
            // Log để debug
            Console.WriteLine($"GetAvailableRooms called. Found {rooms.Count} rooms");
            foreach (var room in rooms)
            {
                Console.WriteLine($"Room: {room.RoomName}, Created by: {room.Player1Name}");
            }

            return rooms;
        }
    }
} 