using System;
using System.Threading.Tasks;
using caro_online.Models;
using caro_online.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace caro_online.Hubs
{
    [AllowAnonymous]
    public class GameHub : Hub
    {
        private readonly IGameService _gameService;

        public GameHub(IGameService gameService)
        {
            _gameService = gameService;
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
            await Clients.Caller.SendAsync("connected", Context.ConnectionId);
            
            // Gửi danh sách phòng ngay khi client kết nối
            var rooms = await _gameService.GetAvailableRooms();
            await Clients.Caller.SendAsync("availableRooms", rooms);
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }

        public async Task CreateGame(string playerName, string roomName)
        {
            try
            {
                var game = await _gameService.CreateGame(playerName, roomName);
                await Clients.All.SendAsync("gameCreated", game);
                
                // Gửi lại danh sách phòng cho tất cả clients
                var rooms = await _gameService.GetAvailableRooms();
                await Clients.All.SendAsync("availableRooms", rooms);

                // Log để debug
                Console.WriteLine($"Sending gameCreated event for room: {roomName}");
                Console.WriteLine($"Sending updated available rooms to all clients");
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("error", ex.Message);
            }
        }

        public async Task JoinGame(string roomName, string playerName)
        {
            try
            {
                var game = await _gameService.JoinGame(roomName, playerName);
                await Clients.All.SendAsync("gameJoined", game);
                
                // Gửi lại danh sách phòng cho tất cả clients
                var rooms = await _gameService.GetAvailableRooms();
                await Clients.All.SendAsync("availableRooms", rooms);

                // Log để debug
                Console.WriteLine($"Sending gameJoined event for room: {roomName}");
                Console.WriteLine($"Sending updated available rooms to all clients");
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("error", ex.Message);
            }
        }

        public async Task GetAvailableRooms()
        {
            try
            {
                var rooms = await _gameService.GetAvailableRooms();
                await Clients.Caller.SendAsync("availableRooms", rooms);

                // Log để debug
                Console.WriteLine($"Sending available rooms to caller");
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("error", ex.Message);
            }
        }

        public async Task DeleteRoom(string roomName)
        {
            try
            {
                await _gameService.DeleteRoom(roomName);
                await Clients.All.SendAsync("GameCreated", null);
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("Error", ex.Message);
            }
        }

        public async Task LeaveRoom(string roomName, string playerName)
        {
            try
            {
                var game = _gameService.LeaveRoom(roomName, playerName);
                await Clients.All.SendAsync("GameUpdated", game);
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("Error", ex.Message);
            }
        }

        public async Task MakeMove(string gameId, string playerId, int row, int col)
        {
            try
            {
                var game = await _gameService.MakeMove(gameId, playerId, row, col);
                await Clients.All.SendAsync("GameUpdated", game);
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("Error", ex.Message);
            }
        }

        public IEnumerable<Game> GetFinishedGames()
        {
            return _gameService.GetFinishedGames();
        }
    }
} 