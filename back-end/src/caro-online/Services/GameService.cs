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
        private static readonly ConcurrentDictionary<string, Game> _finishedGames = new();
        private static readonly object _lock = new object();
        private readonly IHubContext<GameHub> _hubContext;

        public GameService(IHubContext<GameHub> hubContext)
        {
            _hubContext = hubContext;
        }

        private async Task BroadcastAvailableRooms()
        {
            try
            {
                var rooms = _games.Values
                    .Where(g => g != null && g.Status == "Waiting")
                    .OrderByDescending(g => g.CreatedAt)
                    .ToList();

                LogRoomsInfo("BroadcastAvailableRooms", rooms);
                await _hubContext.Clients.All.SendAsync("AvailableRooms", rooms);
                
                // Broadcast lại sau 1 giây để đảm bảo client nhận được
                await Task.Delay(1000);
                await _hubContext.Clients.All.SendAsync("AvailableRooms", rooms);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in BroadcastAvailableRooms: {ex.Message}");
            }
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
                // Kiểm tra xem phòng có tồn tại không
                if (_games.TryGetValue(roomName, out var existingGame))
                {
                    // Nếu phòng tồn tại và người tạo là người đang yêu cầu
                    if (existingGame.Player1Name == playerName)
                    {
                        // Đảm bảo phòng vẫn ở trạng thái chờ
                        existingGame.Status = "Waiting";
                        _games.TryUpdate(roomName, existingGame, existingGame);
                        LogGameInfo("ReconnectGame", existingGame);
                        // Broadcast ngay khi reconnect thành công
                        _ = BroadcastAvailableRooms();
                        return existingGame;
                    }
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

            // Broadcast ngay khi tạo phòng thành công
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
                    LogGameInfo("ReconnectGame", game);
                    return game;
                }
                else if (game.Player2Name == playerName)
                {
                    LogGameInfo("ReconnectGame", game);
                    return game;
                }

                if (game.Status != "Waiting")
                {
                    throw new Exception("Phòng không còn nhận người chơi mới");
                }

                game.Player2Id = Guid.NewGuid().ToString();
                game.Player2Name = playerName;
                game.Status = "InProgress";
                game.CurrentTurn = game.Player1Id;

                _games.TryUpdate(roomName, game, game);
                LogGameInfo("JoinGame", game);
            }

            await BroadcastAvailableRooms();
            return game;
        }

        public async Task<IEnumerable<Game>> GetAvailableRooms()
        {
            List<Game> rooms;
            lock (_lock)
            {
                rooms = _games.Values
                    .Where(g => g != null && g.Status == "Waiting")
                    .OrderByDescending(g => g.CreatedAt)
                    .ToList();

                LogRoomsInfo("GetAvailableRooms", rooms);
            }

            // Broadcast để đảm bảo tất cả client có danh sách mới nhất
            await BroadcastAvailableRooms();
            return rooms;
        }

        public async Task DeleteRoom(string roomName)
        {
            if (_games.TryRemove(roomName, out var game))
            {
                DeleteGame(game.Id);
                await _hubContext.Clients.All.SendAsync("GameDeleted", roomName);
            }
        }

        public async Task LeaveRoom(string roomName, string playerName)
        {
            if (_games.TryGetValue(roomName, out var game))
            {
                if (game.Player1Name == playerName)
                {
                    game.Player1Name = null;
                    game.Player1Id = null;
                }
                else if (game.Player2Name == playerName)
                {
                    game.Player2Name = null;
                    game.Player2Id = null;
                }

                if (game.Player1Name == null && game.Player2Name == null)
                {
                    DeleteGame(game.Id);
                    _games.TryRemove(roomName, out _);
                    await _hubContext.Clients.All.SendAsync("GameDeleted", roomName);
                }
                else
                {
                    _games.TryUpdate(roomName, game, game);
                    await _hubContext.Clients.All.SendAsync("PlayerLeft", game);
                }
            }
        }

        public async Task<Game> MakeMove(string gameId, string playerId, int row, int col)
        {
            Game game;
            lock (_lock)
            {
                game = _games.Values.FirstOrDefault(g => g.Id == gameId);
                if (game == null)
                {
                    throw new Exception("Không tìm thấy game");
                }

                if (game.Status != "InProgress")
                {
                    throw new Exception("Game chưa bắt đầu hoặc đã kết thúc");
                }

                if (game.CurrentTurn != playerId)
                {
                    throw new Exception("Chưa đến lượt của bạn");
                }

                int index = row * 15 + col;
                if (game.Board == null)
                {
                    game.Board = new int[225];
                }

                if (game.Board[index] != 0)
                {
                    throw new Exception("Ô này đã được đánh");
                }

                // Đánh dấu nước đi (1 cho X, 2 cho O)
                game.Board[index] = playerId == game.Player1Id ? 1 : 2;

                // Chuyển lượt
                game.CurrentTurn = playerId == game.Player1Id ? game.Player2Id : game.Player1Id;

                // Kiểm tra thắng thua
                CheckWinner(game, row, col);

                _games.TryUpdate(game.RoomName, game, game);
                LogGameInfo("MakeMove", game);
            }

            await _hubContext.Clients.All.SendAsync("GameUpdated", game);
            return game;
        }

        private void CheckWinner(Game game, int row, int col)
        {
            var directions = new[]
            {
                (1, 0),   // Ngang
                (0, 1),   // Dọc
                (1, 1),   // Chéo xuống
                (1, -1)   // Chéo lên
            };

            // Lấy người chơi vừa đánh (người đánh cuối cùng)
            var lastPlayerId = game.CurrentTurn == game.Player1Id ? game.Player2Id : game.Player1Id;
            var currentPlayer = lastPlayerId == game.Player1Id ? 1 : 2;

            foreach (var (dx, dy) in directions)
            {
                var count = 1;

                // Kiểm tra theo hướng thuận
                for (var i = 1; i < 5; i++)
                {
                    var newRow = row + dx * i;
                    var newCol = col + dy * i;
                    if (newRow < 0 || newRow >= 15 || newCol < 0 || newCol >= 15) break;
                    if (game.Board[newRow * 15 + newCol] != currentPlayer) break;
                    count++;
                }

                // Kiểm tra theo hướng ngược
                for (var i = 1; i < 5; i++)
                {
                    var newRow = row - dx * i;
                    var newCol = col - dy * i;
                    if (newRow < 0 || newRow >= 15 || newCol < 0 || newCol >= 15) break;
                    if (game.Board[newRow * 15 + newCol] != currentPlayer) break;
                    count++;
                }

                if (count >= 5)
                {
                    game.Winner = lastPlayerId; // Người thắng là người vừa đánh
                    game.Status = GameStatus.Finished.ToString();
                    AddFinishedGame(game);
                    _hubContext.Clients.All.SendAsync("GameFinished", game);
                    return;
                }
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

        public IEnumerable<Game> GetFinishedGames()
        {
            return _finishedGames.Values
                .OrderByDescending(game => game.CreatedAt)
                .ToList();
        }

        public void AddFinishedGame(Game game)
        {
            _finishedGames.TryAdd(game.Id, game);
            // Giới hạn số lượng game kết thúc được lưu (ví dụ: 50 game)
            if (_finishedGames.Count > 50)
            {
                var oldestGame = _finishedGames.Values
                    .OrderBy(g => g.CreatedAt)
                    .FirstOrDefault();

                if (oldestGame != null)
                {
                    _finishedGames.TryRemove(oldestGame.Id, out _);
                }
            }
        }

        public void DeleteGame(string gameId)
        {
            _games.TryRemove(gameId, out _);
            //_finishedGames.TryRemove(gameId, out _);
        }
    }
} 