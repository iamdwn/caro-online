using caro_online.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace caro_online.Services
{
    public interface IGameService
    {
        Task<Game> CreateGame(string playerName, string roomName, string userId);
        Task<Game> JoinGame(string roomName, string playerName, string userId);
        Task<IEnumerable<Game>> GetAvailableRooms();
        Task DeleteRoom(string roomName);
        IEnumerable<Game> GetFinishedGames();
        Task LeaveRoom(string roomName, string playerName);
        Task<Game> MakeMove(string gameId, string playerId, int row, int col);
    }
} 