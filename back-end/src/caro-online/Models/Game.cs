using System;
using System.Text.Json.Serialization;
using caro_online.Models;

namespace caro_online.Models
{
    public class Game
    {
        public string Id { get; set; } = string.Empty;
        public string RoomName { get; set; } = string.Empty;
        public string Player1Id { get; set; } = string.Empty;
        public string Player1Name { get; set; } = string.Empty;
        public string? Player2Id { get; set; }
        public string? Player2Name { get; set; }
        public string Status { get; set; } = "Waiting";
        public string Winner { get; set; } = string.Empty;
        public int[] Board { get; set; } = new int[50 * 50];
        public string CurrentTurn { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? EndedAt { get; set; }
        public string Duration { get; set; } = string.Empty;
        public bool Player1PlayAgain { get; set; }
        public bool Player2PlayAgain { get; set; }
        public string Password { get; set; } = string.Empty;
        public bool HasPassword { get; set; }

        public int GetCell(int row, int col)
        {
            return Board[row * 50 + col];
        }

        public void SetCell(int row, int col, int value)
        {
            Board[row * 50 + col] = value;
        }
    }
} 