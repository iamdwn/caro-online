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

                await _hubContext.Clients.All.SendAsync("AvailableRooms", rooms);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in BroadcastAvailableRooms: {ex.Message}");
            }
        }

        public async Task<Game> CreateGame(string playerName, string roomName, string userId)
        {
            if (string.IsNullOrEmpty(playerName) || string.IsNullOrEmpty(roomName))
            {
                throw new Exception("Tên người chơi và tên phòng không được để trống");
            }

            Game game;
            lock (_lock)
            {
                if (_games.TryGetValue(roomName, out var existingGame))
                {
                    if (existingGame.Player1Name == playerName && existingGame.Player1Id == userId)
                    {
                        existingGame.Status = "Waiting";
                        _games.TryUpdate(roomName, existingGame, existingGame);
                        LogGameInfo("ReconnectGame", existingGame);

                        _ = BroadcastAvailableRooms();
                        return existingGame;
                    }
                    throw new Exception("Phòng đã tồn tại");
                }

                game = new Game
                {
                    Id = Guid.NewGuid().ToString(),
                    RoomName = roomName,
                    Player1Id = userId,
                    Player1Name = playerName,
                    Status = "Waiting",
                    Board = new int[50 * 50],
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

        public async Task<Game> JoinGame(string roomName, string playerName, string userId)
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

                if (game.Player1Name == playerName && game.Player1Id == userId)
                {
                    LogGameInfo("ReconnectGame", game);
                    return game;
                }
                else if (game.Player2Name == playerName && game.Player2Id == userId)
                {
                    LogGameInfo("ReconnectGame", game);
                    return game;
                }

                if (game.Status != "Waiting")
                {
                    throw new Exception("Phòng không còn nhận người chơi mới");
                }

                game.Player2Id = userId;
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

            await BroadcastAvailableRooms();
            return rooms;
        }

        public async Task DeleteRoom(string roomName)
        {
            if (_games.TryGetValue(roomName, out var game))
            {
                if (game.Status == "InProgress")
                {
                    game.Status = "Finished";
                    game.Winner = game.Player2Id;
                    game.EndedAt = DateTime.UtcNow;
                    AddFinishedGame(game);
                    await _hubContext.Clients.All.SendAsync("GameUpdated", game);
                }
                
                _games.TryRemove(roomName, out _);
                if (game.Status == "InProgress")
                {
                    game.Status = "Finished";
                    game.Winner = game.Player2Id;
                    game.EndedAt = DateTime.UtcNow;
                    AddFinishedGame(game);
                    await _hubContext.Clients.All.SendAsync("GameUpdated", game);
                }
                
                _games.TryRemove(roomName, out _);
                await _hubContext.Clients.All.SendAsync("GameDeleted", roomName);
                await BroadcastAvailableRooms();
                await BroadcastAvailableRooms();
            }
        }

        public async Task LeaveRoom(string roomName, string userId)
        {
            Game game;
            lock (_lock)
            {
                if (!_games.TryGetValue(roomName, out game))
                {
                    throw new Exception("Không tìm thấy phòng");
                }

                if (game.Status == "InProgress")
                {
                    if (game.Player1Id == userId)
                    {
                        game.Status = "Finished";
                        game.Winner = game.Player2Id;
                        game.EndedAt = DateTime.UtcNow;
                    }
                    else if (game.Player2Id == userId)
                    {
                        game.Status = "Finished";
                        game.Winner = game.Player1Id;
                        game.EndedAt = DateTime.UtcNow;
                    }

                    AddFinishedGame(game);
                    _hubContext.Clients.All.SendAsync("GameUpdated", game);
                    _games.TryRemove(roomName, out _);
                }
                else
                {
                    if (game.Player2Id == userId)
                    {
                        game.Player2Id = null;
                        game.Player2Name = null;
                        game.Status = "Waiting";
                        _games.TryUpdate(roomName, game, game);
                    }
                    else if (game.Player1Id == userId)
                    {
                        _games.TryRemove(roomName, out _);
                    }
                }
            }

            await BroadcastAvailableRooms();
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

                int index = row * 50 + col;
                if (game.Board == null)
                {
                    game.Board = new int[2500];
                }

                if (game.Board[index] != 0)
                {
                    throw new Exception("Ô này đã được đánh");
                }

                game.Board[index] = playerId == game.Player1Id ? 1 : 2;
                game.CurrentTurn = playerId == game.Player1Id ? game.Player2Id : game.Player1Id;

                CheckWinner(game, row, col);
                _games.TryUpdate(game.RoomName, game, game);
            }

            await _hubContext.Clients.All.SendAsync("GameUpdated", game);
            return game;
        }

        private void CheckWinner(Game game, int row, int col)
        {
            var directions = new[]
            {
                (1, 0),  // Dọc
                (0, 1),  // Ngang
                (1, 1),  // Chéo xuống
                (1, -1)  // Chéo lên
            };

            var lastPlayerId = game.CurrentTurn == game.Player1Id ? game.Player2Id : game.Player1Id;
            var currentPlayer = lastPlayerId == game.Player1Id ? 1 : 2;

            foreach (var (dx, dy) in directions)
            {
                var count = 1;
                var maxCount = 1;

                // Kiểm tra theo chiều thuận
                for (var i = 1; i < 5; i++)
                {
                    var newRow = row + dx * i;
                    var newCol = col + dy * i;
                    if (newRow < 0 || newRow >= 50 || newCol < 0 || newCol >= 50) break;
                    if (game.Board[newRow * 50 + newCol] != currentPlayer) break;
                    count++;
                    maxCount = Math.Max(maxCount, count);
                }

                // Kiểm tra theo chiều ngược lại
                count = maxCount;
                for (var i = 1; i < 5; i++)
                {
                    var newRow = row - dx * i;
                    var newCol = col - dy * i;
                    if (newRow < 0 || newRow >= 50 || newCol < 0 || newCol >= 50) break;
                    if (game.Board[newRow * 50 + newCol] != currentPlayer) break;
                    count++;
                    maxCount = Math.Max(maxCount, count);
                }

                if (maxCount >= 5)
                {
                    game.Winner = lastPlayerId;
                    game.Status = GameStatus.Finished.ToString();
                    game.EndedAt = DateTime.UtcNow;
                    AddFinishedGame(game);
                    _hubContext.Clients.All.SendAsync("GameFinished", game);
                    return;
                }
            }
        }

        private void LogGameInfo(string action, Game game)
        {
            Console.WriteLine($"[{action}] Game: {game.RoomName}, Status: {game.Status}, Turn: {game.CurrentTurn}");
        }

        private void LogRoomsInfo(string action, List<Game> rooms)
        {
            Console.WriteLine($"[{action}] Found {rooms.Count} rooms");
        }

        public IEnumerable<Game> GetFinishedGames()
        {
            return _finishedGames.Values
                .OrderByDescending(game => game.CreatedAt)
                .ToList();
        }

        public void AddFinishedGame(Game game)
        {
            var finishedGame = new Game
            {
                Id = game.Id,
                RoomName = game.RoomName,
                Player1Id = game.Player1Id,
                Player1Name = game.Player1Name,
                Player2Id = game.Player2Id,
                Player2Name = game.Player2Name,
                Status = game.Status,
                Winner = game.Winner,
                Board = game.Board.ToArray(),
                CurrentTurn = game.CurrentTurn,
                CreatedAt = game.CreatedAt,
                EndedAt = DateTime.UtcNow,
                Player1PlayAgain = false,
                Player2PlayAgain = false
            };

            _finishedGames.TryAdd(finishedGame.Id, finishedGame);

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

        public async Task HandlePlayAgain(string roomName, string userId)
        {
            Game game;
            if (!_finishedGames.Values.Any(g => g.RoomName == roomName))
            {
                throw new Exception("Không tìm thấy phòng đã kết thúc");
            }

            game = _finishedGames.Values.First(g => g.RoomName == roomName);
            
            if (game.Player1Id == userId)
            {
                game.Player1PlayAgain = true;
                await _hubContext.Clients.User(game.Player1Id).SendAsync("PlayerLeftRoom", game.RoomName);
            }
            else if (game.Player2Id == userId)
            {
                game.Player2PlayAgain = true;
                await _hubContext.Clients.User(game.Player2Id).SendAsync("PlayerLeftRoom", game.RoomName);
            }

            if (game.Player1PlayAgain && game.Player2PlayAgain)
            {
                _finishedGames.TryRemove(game.Id, out _);
                await _hubContext.Clients.All.SendAsync("BothPlayersPlayAgain", game.RoomName);
            }
        }
    }
} 