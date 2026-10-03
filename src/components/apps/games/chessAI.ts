import { Chess, type Move } from 'chess.js';

const pieceValues: Record<string, number> = {
  p: 100,
  n: 320,
  b: 335,
  r: 500,
  q: 900,
  k: 20_000,
};

const evaluate = (game: Chess): number => {
  if (game.isCheckmate()) return game.turn() === 'w' ? -100_000 : 100_000;
  if (game.isDraw()) return 0;

  return game.board().reduce((score, row, rank) => (
    score + row.reduce((lineScore, piece, file) => {
      if (!piece) return lineScore;
      const sign = piece.color === 'w' ? 1 : -1;
      const centerBonus = 7 - (Math.abs(3.5 - file) + Math.abs(3.5 - rank)) * 2;
      const mobilityBonus = piece.type === 'p' ? (piece.color === 'w' ? 7 - rank : rank) * 2 : centerBonus;
      return lineScore + sign * (pieceValues[piece.type] + mobilityBonus);
    }, 0)
  ), 0);
};

const orderedMoves = (game: Chess): Move[] => game.moves({ verbose: true }).sort((a, b) => {
  const value = (move: Move) =>
    (move.captured ? pieceValues[move.captured] * 10 - pieceValues[move.piece] : 0) +
    (move.promotion ? pieceValues[move.promotion] : 0) +
    (move.san.includes('+') ? 40 : 0);
  return value(b) - value(a);
});

const search = (game: Chess, depth: number, alpha: number, beta: number): number => {
  if (depth === 0 || game.isGameOver()) return evaluate(game);

  const maximizing = game.turn() === 'w';
  let best = maximizing ? -Infinity : Infinity;
  for (const move of orderedMoves(game)) {
    game.move(move);
    const score = search(game, depth - 1, alpha, beta);
    game.undo();
    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break;
  }
  return best;
};

export const chooseChessMove = (fen: string, difficulty: number, history: string[] = []): string | null => {
  const game = new Chess();
  history.forEach(move => game.move(move));
  if (game.fen() !== fen) game.load(fen);
  const legalMoves = orderedMoves(game);
  if (!legalMoves.length) return null;
  if (difficulty === 0) return legalMoves[Math.floor(Math.random() * legalMoves.length)].san;
  const depth = [1, 2, 3, 3][difficulty] ?? 1;
  let bestMove: Move | null = null;
  let bestScore = Infinity;
  let ties = 0;

  for (const move of legalMoves) {
    game.move(move);
    const score = search(game, depth - 1, -Infinity, Infinity);
    game.undo();
    if (score < bestScore) {
      bestScore = score;
      bestMove = move;
      ties = 1;
    } else if (score === bestScore && Math.random() < 1 / ++ties) {
      bestMove = move;
    }
  }

  return bestMove?.san ?? null;
};
