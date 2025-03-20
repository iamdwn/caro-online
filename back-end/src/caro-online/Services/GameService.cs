using caro_online.Models;
using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;
using Microsoft.AspNetCore.SignalR;
using caro_online.Hubs;

namespace caro_online.Services
{
    public class GameService : IGameService
    {
        private static readonly ConcurrentDictionary<string, Game> _games = new();
        private static readonly object _lock = new object();
        private readonly IHubContext<GameHub> _hubContext;

        public GameService(IHubContext<GameHub> hubContext)
        {
            _hubContext = hubContext;
        }

        private async Task BroadcastAvailableRooms()
        {
            var rooms = _games.Values
                .Where(g => g != null && g.Status == "Waiting")
                .OrderByDescending(g => g.CreatedAt)
                .ToList();
            await _hubContext.Clients.All.SendAsync("AvailableRooms", rooms);
            LogRoomsInfo("BroadcastAvailableRooms", rooms);
        }

        public async Task<Game> CreateGame(string playerName, string roomName)
        {
            if (string.IsNullOrEmpty(playerName) || string.IsNullOrEmpty(roomName))
            {
                throw new Exception("Tên người chơi và tên phòng không được để trống");
            }

            Game game;
            lock (_lock)
            {
                if (_games.ContainsKey(roomName))
                {
                    throw new Exception("Phòng đã tồn tại");
                }

                game = new Game
                {
                    Id = Guid.NewGuid().ToString(),
                    RoomName = roomName,
                    Player1Id = Guid.NewGuid().ToString(),
                    Player1Name = playerName,
                    Status = "Waiting",
                    Board = new int[225],
                    CreatedAt = DateTime.UtcNow
                };

                if (!_games.TryAdd(roomName, game))
                {
                    throw new Exception("Không thể tạo phòng");
                }

                LogGameInfo("CreateGame", game);
            }

            await BroadcastAvailableRooms();
            return game;
        }

        public async Task<Game> JoinGame(string roomName, string playerName)
        {
            if (string.IsNullOrEmpty(playerName) || string.IsNullOrEmpty(roomName))
            {
                throw new Exception("Tên người chơi và tên phòng không được để trống");
            }

            Game game;
            lock (_lock)
            {
                if (!_games.TryGetValue(roomName, out game))
                {
                    throw new Exception("Không tìm thấy phòng");
                }

                if (game.Player1Name == playerName)
                {
                    return game;
                }
                else if (game.Player2Name == playerName)
                {
                    return game;
                }

                if (game.Player2Name != null && game.Status == "InProgress")
                {
                    throw new Exception("Phòng đã đầy");
                }

                if (game.Player2Name == null)
                {
                    game.Player2Id = Guid.NewGuid().ToString();
                    game.Player2Name = playerName;
                    game.Status = "InProgress";
                    game.CurrentTurn = game.Player1Id;

                    _games.TryUpdate(roomName, game, game);
                }

                LogGameInfo("JoinGame", game);
            }

            await BroadcastAvailableRooms();
            return game;
        }

        public async Task<IEnumerable<Game>> GetAvailableRooms()
        {
            lock (_lock)
            {
                var rooms = _games.Values
                    .Where(g => g != null && g.Status == "Waiting")
                    .OrderByDescending(g => g.CreatedAt)
                    .ToList();

                LogRoomsInfo("GetAvailableRooms", rooms);
                return rooms;
            }
        }

        private void LogGameInfo(string action, Game game)
        {
            Console.WriteLine($"[{action}] Game: {game.RoomName} by {game.Player1Name}");
            Console.WriteLine($"Game ID: {game.Id}");
            Console.WriteLine($"Status: {game.Status}");
            Console.WriteLine($"Total games: {_games.Count}");
            Console.WriteLine($"Available rooms: {_games.Values.Count(g => g.Status == "Waiting")}");
            Console.WriteLine("All rooms:");
            foreach (var room in _games.Values)
            {
                Console.WriteLine($"- Room: {room.RoomName}, Status: {room.Status}, Creator: {room.Player1Name}, Player2: {room.Player2Name ?? "Waiting..."}");
            }
            Console.WriteLine($"Game details: {System.Text.Json.JsonSerializer.Serialize(game)}");
            Console.WriteLine("----------------------------------------");
        }

        private void LogRoomsInfo(string action, List<Game> rooms)
        {
            Console.WriteLine($"[{action}] Found {rooms.Count} rooms");
            Console.WriteLine($"Total games in memory: {_games.Count}");
            Console.WriteLine("Available rooms:");
            foreach (var room in rooms)
            {
                Console.WriteLine($"- Room: {room.RoomName}, Status: {room.Status}, Creator: {room.Player1Name}, Player2: {room.Player2Name ?? "Waiting..."}");
            }
            Console.WriteLine("All rooms in memory:");
            foreach (var room in _games.Values)
            {
                Console.WriteLine($"- Room: {room.RoomName}, Status: {room.Status}, Creator: {room.Player1Name}, Player2: {room.Player2Name ?? "Waiting..."}");
            }
            Console.WriteLine("----------------------------------------");
        }
    }
} 