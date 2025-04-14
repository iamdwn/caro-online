import { Game } from '../types/game';

export enum BotDifficulty {
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD'
}

interface BotStrategy {
    makeMove(board: number[], lastMove: { row: number, col: number } | null): { row: number, col: number };
}

class EasyBot implements BotStrategy {
    makeMove(board: number[], lastMove: { row: number, col: number } | null): { row: number, col: number } {
        // Chiến lược: Đánh ngẫu nhiên vào ô trống gần nước đi gần nhất của người chơi
        const radius = 3; // Bán kính tìm kiếm quanh nước đi gần nhất
        
        if (lastMove) {
            const { row, col } = lastMove;
            const possibleMoves: { row: number, col: number }[] = [];
            
            // Tìm các ô trống xung quanh nước đi gần nhất
            for (let i = Math.max(0, row - radius); i <= Math.min(49, row + radius); i++) {
                for (let j = Math.max(0, col - radius); j <= Math.min(49, col + radius); j++) {
                    if (board[i * 50 + j] === 0) {
                        possibleMoves.push({ row: i, col: j });
                    }
                }
            }
            
            if (possibleMoves.length > 0) {
                // Chọn ngẫu nhiên một trong các ô trống tìm được
                const randomIndex = Math.floor(Math.random() * possibleMoves.length);
                return possibleMoves[randomIndex];
            }
        }
        
        // Nếu không có nước đi gần nhất hoặc không tìm thấy ô trống gần đó
        // Đánh ngẫu nhiên vào bất kỳ ô trống nào
        const emptyPositions: { row: number, col: number }[] = [];
        for (let i = 0; i < 50; i++) {
            for (let j = 0; j < 50; j++) {
                if (board[i * 50 + j] === 0) {
                    emptyPositions.push({ row: i, col: j });
                }
            }
        }
        
        const randomIndex = Math.floor(Math.random() * emptyPositions.length);
        return emptyPositions[randomIndex];
    }
}

class MediumBot implements BotStrategy {
    makeMove(board: number[], lastMove: { row: number, col: number } | null): { row: number, col: number } {
        // Chiến lược: 
        // 1. Kiểm tra nếu có thể thắng trong 1 nước
        // 2. Chặn nếu người chơi sắp thắng
        // 3. Tấn công theo pattern cơ bản
        // 4. Nếu không có gì đặc biệt, đánh theo heuristic đơn giản

        // Kiểm tra nước thắng
        const winningMove = this.findWinningMove(board, 2); // 2 là bot
        if (winningMove) return winningMove;

        // Kiểm tra nước chặn
        const blockingMove = this.findWinningMove(board, 1); // 1 là người chơi
        if (blockingMove) return blockingMove;

        // Tìm nước đi tốt dựa trên heuristic
        return this.findBestMove(board, lastMove);
    }

    private findWinningMove(board: number[], player: number): { row: number, col: number } | null {
        // Kiểm tra các pattern thắng cơ bản (4 quân liên tiếp có thể thành 5)
        for (let i = 0; i < 50; i++) {
            for (let j = 0; j < 50; j++) {
                if (board[i * 50 + j] === 0) {
                    // Thử đánh vào vị trí này
                    board[i * 50 + j] = player;
                    
                    // Kiểm tra chiến thắng
                    if (this.checkWin(board, i, j, player)) {
                        board[i * 50 + j] = 0; // Reset lại
                        return { row: i, col: j };
                    }
                    
                    board[i * 50 + j] = 0; // Reset lại
                }
            }
        }
        return null;
    }

    private findBestMove(board: number[], lastMove: { row: number, col: number } | null): { row: number, col: number } {
        let bestScore = -Infinity;
        let bestMove = { row: 0, col: 0 };

        // Tìm kiếm trong vùng gần nước đi cuối cùng
        const searchRadius = 5;
        const startRow = lastMove ? Math.max(0, lastMove.row - searchRadius) : 20;
        const endRow = lastMove ? Math.min(49, lastMove.row + searchRadius) : 30;
        const startCol = lastMove ? Math.max(0, lastMove.col - searchRadius) : 20;
        const endCol = lastMove ? Math.min(49, lastMove.col + searchRadius) : 30;

        for (let i = startRow; i <= endRow; i++) {
            for (let j = startCol; j <= endCol; j++) {
                if (board[i * 50 + j] === 0) {
                    const score = this.evaluatePosition(board, i, j);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { row: i, col: j };
                    }
                }
            }
        }

        return bestMove;
    }

    private evaluatePosition(board: number[], row: number, col: number): number {
        // Đánh giá vị trí dựa trên:
        // - Số quân liên tiếp
        // - Số quân bị chặn
        // - Khoảng cách đến trung tâm
        let score = 0;
        
        // Ưu tiên vị trí gần trung tâm
        const distanceToCenter = Math.abs(row - 25) + Math.abs(col - 25);
        score -= distanceToCenter;

        // Đánh giá các hướng
        const directions = [
            [0, 1],  // Ngang
            [1, 0],  // Dọc
            [1, 1],  // Chéo chính
            [1, -1]  // Chéo phụ
        ];

        for (const [dx, dy] of directions) {
            score += this.evaluateDirection(board, row, col, dx, dy);
        }

        return score;
    }

    private evaluateDirection(board: number[], row: number, col: number, dx: number, dy: number): number {
        let score = 0;
        let consecutive = 0;
        let blocked = 0;
        let space = false;

        // Kiểm tra về một phía
        for (let i = 1; i <= 4; i++) {
            const newRow = row + dx * i;
            const newCol = col + dy * i;
            
            if (newRow < 0 || newRow >= 50 || newCol < 0 || newCol >= 50) {
                blocked++;
                break;
            }

            const cell = board[newRow * 50 + newCol];
            if (cell === 2) consecutive++;
            else if (cell === 0) {
                space = true;
                break;
            }
            else {
                blocked++;
                break;
            }
        }

        // Kiểm tra về phía ngược lại
        for (let i = 1; i <= 4; i++) {
            const newRow = row - dx * i;
            const newCol = col - dy * i;
            
            if (newRow < 0 || newRow >= 50 || newCol < 0 || newCol >= 50) {
                blocked++;
                break;
            }

            const cell = board[newRow * 50 + newCol];
            if (cell === 2) consecutive++;
            else if (cell === 0) {
                space = true;
                break;
            }
            else {
                blocked++;
                break;
            }
        }

        // Tính điểm dựa trên số quân liên tiếp và bị chặn
        if (consecutive >= 4) score += 10000;
        else if (consecutive === 3 && blocked === 0) score += 1000;
        else if (consecutive === 2 && blocked === 0) score += 100;
        else if (consecutive === 1 && blocked === 0) score += 10;

        if (space) score *= 2;

        return score;
    }

    private checkWin(board: number[], row: number, col: number, player: number): boolean {
        const directions = [
            [0, 1],  // Ngang
            [1, 0],  // Dọc
            [1, 1],  // Chéo chính
            [1, -1]  // Chéo phụ
        ];

        for (const [dx, dy] of directions) {
            let count = 1;
            
            // Kiểm tra một hướng
            for (let i = 1; i <= 4; i++) {
                const newRow = row + dx * i;
                const newCol = col + dy * i;
                
                if (newRow < 0 || newRow >= 50 || newCol < 0 || newCol >= 50) break;
                if (board[newRow * 50 + newCol] !== player) break;
                count++;
            }
            
            // Kiểm tra hướng ngược lại
            for (let i = 1; i <= 4; i++) {
                const newRow = row - dx * i;
                const newCol = col - dy * i;
                
                if (newRow < 0 || newRow >= 50 || newCol < 0 || newCol >= 50) break;
                if (board[newRow * 50 + newCol] !== player) break;
                count++;
            }

            if (count >= 5) return true;
        }
        
        return false;
    }
}

class HardBot implements BotStrategy {
    private readonly MAX_DEPTH = 4;
    
    makeMove(board: number[], lastMove: { row: number, col: number } | null): { row: number, col: number } {
        // Sử dụng thuật toán Minimax với Alpha-Beta Pruning
        let bestScore = -Infinity;
        let bestMove = { row: 0, col: 0 };

        // Tối ưu: Chỉ xem xét các ô trong vùng có quân cờ
        const searchArea = this.getSearchArea(board, lastMove);
        
        for (const { row, col } of searchArea) {
            if (board[row * 50 + col] === 0) {
                board[row * 50 + col] = 2; // Thử nước đi
                const score = this.minimax(board, this.MAX_DEPTH, false, -Infinity, Infinity);
                board[row * 50 + col] = 0; // Hoàn tác

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { row, col };
                }
            }
        }

        return bestMove;
    }

    private getSearchArea(board: number[], lastMove: { row: number, col: number } | null): { row: number, col: number }[] {
        const searchArea: { row: number, col: number }[] = [];
        const radius = 3; // Bán kính tìm kiếm

        if (lastMove) {
            // Tìm kiếm xung quanh nước đi cuối cùng
            const { row, col } = lastMove;
            for (let i = Math.max(0, row - radius); i <= Math.min(49, row + radius); i++) {
                for (let j = Math.max(0, col - radius); j <= Math.min(49, col + radius); j++) {
                    if (board[i * 50 + j] === 0) {
                        searchArea.push({ row: i, col: j });
                    }
                }
            }
        }

        // Nếu không có nước đi cuối hoặc không tìm thấy ô trống gần đó
        if (searchArea.length === 0) {
            // Tìm kiếm quanh các quân cờ đã đánh
            for (let i = 0; i < 50; i++) {
                for (let j = 0; j < 50; j++) {
                    if (board[i * 50 + j] !== 0) {
                        // Thêm các ô trống xung quanh
                        for (let di = -radius; di <= radius; di++) {
                            for (let dj = -radius; dj <= radius; dj++) {
                                const newRow = i + di;
                                const newCol = j + dj;
                                if (newRow >= 0 && newRow < 50 && newCol >= 0 && newCol < 50 
                                    && board[newRow * 50 + newCol] === 0) {
                                    searchArea.push({ row: newRow, col: newCol });
                                }
                            }
                        }
                    }
                }
            }
        }

        // Nếu vẫn không tìm thấy, trả về vị trí trung tâm
        if (searchArea.length === 0) {
            searchArea.push({ row: 25, col: 25 });
        }

        return searchArea;
    }

    private minimax(board: number[], depth: number, isMaximizing: boolean, alpha: number, beta: number): number {
        // Điều kiện dừng
        if (depth === 0) {
            return this.evaluateBoard(board);
        }

        if (isMaximizing) {
            let maxScore = -Infinity;
            const searchArea = this.getSearchArea(board, null);
            
            for (const { row, col } of searchArea) {
                if (board[row * 50 + col] === 0) {
                    board[row * 50 + col] = 2;
                    const score = this.minimax(board, depth - 1, false, alpha, beta);
                    board[row * 50 + col] = 0;
                    maxScore = Math.max(maxScore, score);
                    alpha = Math.max(alpha, score);
                    if (beta <= alpha) break; // Alpha-Beta Pruning
                }
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            const searchArea = this.getSearchArea(board, null);
            
            for (const { row, col } of searchArea) {
                if (board[row * 50 + col] === 0) {
                    board[row * 50 + col] = 1;
                    const score = this.minimax(board, depth - 1, true, alpha, beta);
                    board[row * 50 + col] = 0;
                    minScore = Math.min(minScore, score);
                    beta = Math.min(beta, score);
                    if (beta <= alpha) break; // Alpha-Beta Pruning
                }
            }
            return minScore;
        }
    }

    private evaluateBoard(board: number[]): number {
        let score = 0;
        
        // Đánh giá theo hàng, cột và đường chéo
        const directions = [
            [0, 1],  // Ngang
            [1, 0],  // Dọc
            [1, 1],  // Chéo chính
            [1, -1]  // Chéo phụ
        ];

        for (let row = 0; row < 50; row++) {
            for (let col = 0; col < 50; col++) {
                if (board[row * 50 + col] !== 0) {
                    for (const [dx, dy] of directions) {
                        score += this.evaluateDirection(board, row, col, dx, dy);
                    }
                }

            }
        }

        return score;
    }

    private evaluateDirection(board: number[], row: number, col: number, dx: number, dy: number): number {
        const player = board[row * 50 + col];
        let consecutive = 1;
        let openEnds = 2;
        let score = 0;

        // Kiểm tra một hướng
        for (let i = 1; i <= 4; i++) {
            const newRow = row + dx * i;
            const newCol = col + dy * i;
            
            if (newRow < 0 || newRow >= 50 || newCol < 0 || newCol >= 50) {
                openEnds--;
                break;
            }

            const cell = board[newRow * 50 + newCol];
            if (cell === player) consecutive++;
            else if (cell === 0) break;
            else {
                openEnds--;
                break;
            }
        }

        // Kiểm tra hướng ngược lại
        for (let i = 1; i <= 4; i++) {
            const newRow = row - dx * i;
            const newCol = col - dy * i;
            
            if (newRow < 0 || newRow >= 50 || newCol < 0 || newCol >= 50) {
                openEnds--;
                break;
            }

            const cell = board[newRow * 50 + newCol];
            if (cell === player) consecutive++;
            else if (cell === 0) break;
            else {
                openEnds--;
                break;
            }
        }

        // Tính điểm
        if (consecutive >= 5) score = player === 2 ? 100000 : -100000;
        else if (consecutive === 4) {
            if (openEnds === 2) score = player === 2 ? 10000 : -10000;
            else if (openEnds === 1) score = player === 2 ? 1000 : -1000;
        }
        else if (consecutive === 3) {
            if (openEnds === 2) score = player === 2 ? 500 : -500;
            else if (openEnds === 1) score = player === 2 ? 100 : -100;
        }
        else if (consecutive === 2) {
            if (openEnds === 2) score = player === 2 ? 50 : -50;
            else if (openEnds === 1) score = player === 2 ? 10 : -10;
        }

        return score;
    }
}

export class BotService {
    private static instance: BotService;
    private strategies: Map<BotDifficulty, BotStrategy>;

    private constructor() {
        this.strategies = new Map();
        this.strategies.set(BotDifficulty.EASY, new EasyBot());
        this.strategies.set(BotDifficulty.MEDIUM, new MediumBot());
        this.strategies.set(BotDifficulty.HARD, new HardBot());
    }

    public static getInstance(): BotService {
        if (!BotService.instance) {
            BotService.instance = new BotService();
        }
        return BotService.instance;
    }

    public makeMove(board: number[], difficulty: BotDifficulty, lastMove: { row: number, col: number } | null): { row: number, col: number } {
        const strategy = this.strategies.get(difficulty);
        if (!strategy) {
            throw new Error(`Invalid difficulty level: ${difficulty}`);
        }
        return strategy.makeMove(board, lastMove);
    }
} 