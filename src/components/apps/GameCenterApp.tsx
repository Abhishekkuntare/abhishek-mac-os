import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Chess, type Square } from 'chess.js';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Circle,
  Gamepad2,
  RotateCcw,
  Sparkles,
  Waves,
} from 'lucide-react';
import { chooseChessMove } from './games/chessAI';
import { PixelDashGame } from './games/PixelDashGame';
import { canMove2048, chooseTicCell, getTicResult, initial2048, slide2048, spawnSnakeFood, type SlideDirection, type TicMark, type TicResult } from './games/gameLogic';

type GameId = 'snake' | 'chess' | 'platformer' | 'tictactoe' | '2048';

const games: Array<{ id: GameId; title: string; subtitle: string; emoji: string; color: string; badge: string }> = [
  { id: 'snake', title: 'Neon Snake', subtitle: 'Arcade • Reflex', emoji: '🐍', color: 'from-emerald-400 to-cyan-500', badge: 'ARCADE' },
  { id: 'chess', title: 'Chess', subtitle: 'Strategy • 2 players', emoji: '♟', color: 'from-violet-400 to-indigo-600', badge: 'CLASSIC' },
  { id: 'platformer', title: 'Pixel Dash', subtitle: 'Platformer • Original', emoji: '🚀', color: 'from-orange-400 to-rose-500', badge: 'ADVENTURE' },
  { id: 'tictactoe', title: 'Tic-Tac-Toe', subtitle: 'Quick play • 2 players', emoji: '⭕', color: 'from-pink-400 to-fuchsia-600', badge: 'QUICK PLAY' },
  { id: '2048', title: '2048', subtitle: 'Puzzle • Slide to merge', emoji: '🔢', color: 'from-amber-300 to-orange-500', badge: 'PUZZLE' },
];

const boardSquare = (row: number, col: number) => `${'abcdefgh'[col]}${8 - row}` as Square;
const pieceGlyph: Record<string, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };

export const GameCenterApp: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [snake, setSnake] = useState<Array<[number, number]>>([[7, 7], [7, 6], [7, 5]]);
  const [food, setFood] = useState<[number, number]>([3, 10]);
  const [snakeDirection, setSnakeDirection] = useState<[number, number]>([0, 1]);
  const [snakeRunning, setSnakeRunning] = useState(false);
  const [snakePaused, setSnakePaused] = useState(false);
  const [snakeScore, setSnakeScore] = useState(0);
  const [snakeBest, setSnakeBest] = useState(() => {
    try { return Number(localStorage.getItem('abhishek-arcade-snake-best')) || 0; } catch { return 0; }
  });
  const [snakeDifficulty, setSnakeDifficulty] = useState<'easy' | 'normal' | 'hard' | 'insane'>('normal');
  const [snakeOver, setSnakeOver] = useState(false);
  const directionRef = useRef(snakeDirection);
  const [chessMoves, setChessMoves] = useState<string[]>([]);
  const [chessPick, setChessPick] = useState<Square | null>(null);
  const [chessMode, setChessMode] = useState<'local' | 'computer'>('local');
  const [chessDifficulty, setChessDifficulty] = useState(1);
  const [computerThinking, setComputerThinking] = useState(false);
  const [ticBoard, setTicBoard] = useState<TicMark[]>(Array(9).fill(null));
  const [ticTurn, setTicTurn] = useState<'X' | 'O'>('X');
  const [ticMode, setTicMode] = useState<'local' | 'computer'>('local');
  const [ticDifficulty, setTicDifficulty] = useState(2);
  const [ticStats, setTicStats] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('abhishek-arcade-tictactoe-stats') || '{}');
      return { x: Number(parsed.x) || 0, o: Number(parsed.o) || 0, draws: Number(parsed.draws) || 0 };
    } catch {
      return { x: 0, o: 0, draws: 0 };
    }
  });
  const ticRoundRecordedRef = useRef(false);
  const [grid2048, setGrid2048] = useState<number[][]>(initial2048);
  const [score2048, setScore2048] = useState(0);
  const [best2048, setBest2048] = useState(() => {
    try { return Number(localStorage.getItem('abhishek-arcade-2048-best')) || 0; } catch { return 0; }
  });
  const [won2048, setWon2048] = useState(false);
  const [continue2048, setContinue2048] = useState(false);
  const [undo2048, setUndo2048] = useState<{ board: number[][]; score: number; moves: number } | null>(null);
  const [moves2048, setMoves2048] = useState(0);
  const swipeStartRef = useRef<[number, number] | null>(null);
  const [platformerRestartKey, setPlatformerRestartKey] = useState(0);

  useEffect(() => { directionRef.current = snakeDirection; }, [snakeDirection]);

  const resetSnake = useCallback(() => {
    setSnake([[7, 7], [7, 6], [7, 5]]);
    setFood(spawnSnakeFood([[7, 7], [7, 6], [7, 5]]) ?? [0, 0]);
    setSnakeDirection([0, 1]);
    directionRef.current = [0, 1];
    setSnakeScore(0);
    setSnakeOver(false);
    setSnakePaused(false);
    setSnakeRunning(true);
  }, []);

  const resetTic = () => { ticRoundRecordedRef.current = false; setTicBoard(Array(9).fill(null)); setTicTurn('X'); };
  const resetChess = () => { setChessMoves([]); setChessPick(null); setComputerThinking(false); };
  const reset2048 = () => { setGrid2048(initial2048()); setScore2048(0); setWon2048(false); setContinue2048(false); setUndo2048(null); setMoves2048(0); };
  const ticWinner = getTicResult(ticBoard);
  const gameOver2048 = !canMove2048(grid2048);
  const snakeSpeed = Math.max(62, 145 - Math.floor(snakeScore / 40) * 8) * ({ easy: 1.3, normal: 1, hard: 0.78, insane: 0.62 }[snakeDifficulty]);

  useEffect(() => {
    if (snakeScore <= snakeBest) return;
    setSnakeBest(snakeScore);
    try { localStorage.setItem('abhishek-arcade-snake-best', String(snakeScore)); } catch { /* Storage may be unavailable. */ }
  }, [snakeBest, snakeScore]);

  const move2048 = (direction: SlideDirection) => {
    if (gameOver2048 || (won2048 && !continue2048)) return;
    const moved = slide2048(grid2048, direction);
    if (JSON.stringify(moved.board) === JSON.stringify(grid2048)) return;
    const cells = moved.board.flatMap((row, y) => row.map((value, x) => value ? null : [y, x] as [number, number])).filter((cell): cell is [number, number] => cell !== null);
    if (cells.length) {
      const [y, x] = cells[Math.floor(Math.random() * cells.length)];
      moved.board[y][x] = Math.random() < 0.9 ? 2 : 4;
    }
    const nextScore = score2048 + moved.gained;
    setUndo2048({ board: grid2048.map(row => [...row]), score: score2048, moves: moves2048 });
    setGrid2048(moved.board);
    setScore2048(nextScore);
    setMoves2048(count => count + 1);
    if (!won2048 && moved.board.some(row => row.includes(2048))) setWon2048(true);
    if (nextScore > best2048) {
      setBest2048(nextScore);
      try { localStorage.setItem('abhishek-arcade-2048-best', String(nextScore)); } catch { /* Storage may be unavailable. */ }
    }
  };

  const playTicCell = (index: number) => {
    if (ticBoard[index] || ticWinner || (ticMode === 'computer' && ticTurn === 'O')) return;
    const next = [...ticBoard];
    next[index] = ticTurn;
    setTicBoard(next);
    setTicTurn(ticTurn === 'X' ? 'O' : 'X');
  };

  useEffect(() => {
    if (!ticWinner || ticRoundRecordedRef.current) return;
    ticRoundRecordedRef.current = true;
    setTicStats(current => {
      const next = { ...current, x: current.x + Number(ticWinner === 'X'), o: current.o + Number(ticWinner === 'O'), draws: current.draws + Number(ticWinner === 'draw') };
      try { localStorage.setItem('abhishek-arcade-tictactoe-stats', JSON.stringify(next)); } catch { /* Storage may be unavailable. */ }
      return next;
    });
  }, [ticWinner]);

  useEffect(() => {
    if (activeGame !== 'tictactoe' || ticMode !== 'computer' || ticTurn !== 'O' || ticWinner) return;
    const timer = window.setTimeout(() => {
      const cell = chooseTicCell(ticBoard, ticDifficulty);
      if (cell === undefined) return;
      setTicBoard(board => {
        if (board[cell] || getTicResult(board)) return board;
        const next = [...board];
        next[cell] = 'O';
        return next;
      });
      setTicTurn('X');
    }, 250);
    return () => window.clearTimeout(timer);
  }, [activeGame, ticBoard, ticDifficulty, ticMode, ticTurn, ticWinner]);

  useEffect(() => {
    if (!activeGame || activeGame !== 'snake' || !snakeRunning || snakePaused || snakeOver) return;
    const timer = window.setInterval(() => {
      const [dy, dx] = directionRef.current;
      setSnake(current => {
        const [headY, headX] = current[0];
        const next: [number, number] = [headY + dy, headX + dx];
        const eating = next[0] === food[0] && next[1] === food[1];
        const body = eating ? current : current.slice(0, -1);
        if (next[0] < 0 || next[0] >= 15 || next[1] < 0 || next[1] >= 15 || body.some(([y, x]) => y === next[0] && x === next[1])) {
          setSnakeOver(true);
          setSnakeRunning(false);
          return current;
        }
        const moved = [next, ...current];
        if (!eating) moved.pop();
        else {
          setSnakeScore(score => score + 10);
          const nextFood = spawnSnakeFood(moved);
          if (!nextFood) {
            setSnakeOver(true);
            setSnakeRunning(false);
          } else setFood(nextFood);
        }
        return moved;
      });
    }, snakeSpeed);
    return () => window.clearInterval(timer);
  }, [activeGame, snakePaused, snakeRunning, snakeOver, food, snakeSpeed]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!activeGame || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      if (activeGame === 'snake') {
        if (snakePaused || snakeOver) return;
        const directions: Record<string, [number, number]> = {
          ArrowUp: [-1, 0], KeyW: [-1, 0], ArrowDown: [1, 0], KeyS: [1, 0],
          ArrowLeft: [0, -1], KeyA: [0, -1], ArrowRight: [0, 1], KeyD: [0, 1],
        };
        const next = directions[event.code];
        if (next) {
          event.preventDefault();
          const [dy, dx] = directionRef.current;
          if (dy + next[0] !== 0 || dx + next[1] !== 0) {
            directionRef.current = next;
            setSnakeDirection(next);
          }
          setSnakeRunning(true);
        }
      } else if (activeGame === '2048') {
        const directions: Record<string, 'left' | 'right' | 'up' | 'down'> = {
          ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
          ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
        };
        const direction = directions[event.code];
        if (direction) {
          event.preventDefault();
          move2048(direction);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeGame, move2048, snakeOver, snakePaused]);

  const chessGame = useMemo(() => {
    const game = new Chess();
    chessMoves.forEach(move => game.move(move));
    return game;
  }, [chessMoves]);
  const chessTurn = chessGame.turn();
  const chessHistory = chessGame.history({ verbose: true });
  const lastChessMove = chessHistory[chessHistory.length - 1];
  const chessStatus = chessGame.isCheckmate()
    ? `${chessTurn === 'w' ? 'Black' : 'White'} wins by checkmate`
    : chessGame.isStalemate()
      ? 'Draw by stalemate'
      : chessGame.isDraw()
        ? 'Draw'
        : chessGame.isCheck()
          ? `${chessTurn === 'w' ? 'White' : 'Black'} is in check`
          : null;
  const legalChessMoves = chessPick
    ? chessGame.moves({ square: chessPick, verbose: true }).map(move => move.to)
    : [];
  const chessMove = (square: Square) => {
    if (computerThinking || chessGame.isGameOver() || (chessMode === 'computer' && chessTurn === 'b')) return;
    if (!chessPick) {
      const [file, rank] = [square.charCodeAt(0) - 97, 8 - Number(square[1])];
      const piece = chessGame.board()[rank]?.[file];
      if (piece?.color === chessTurn) setChessPick(square);
      return;
    }
    const source = chessPick;
    const game = new Chess();
    chessMoves.forEach(move => game.move(move));
    try {
      const played = game.move({ from: source, to: square, promotion: 'q' });
      setChessMoves(moves => [...moves, played.san]);
      setChessPick(null);
    } catch {
      const [file, rank] = [square.charCodeAt(0) - 97, 8 - Number(square[1])];
      const piece = chessGame.board()[rank]?.[file];
      setChessPick(piece?.color === chessTurn ? square : null);
    }
  };

  useEffect(() => {
    if (activeGame !== 'chess' || chessMode !== 'computer' || chessTurn !== 'b' || chessGame.isGameOver()) return;
    setComputerThinking(true);
    const timer = window.setTimeout(() => {
      const moveSan = chooseChessMove(chessGame.fen(), chessDifficulty, chessMoves);
      if (moveSan) {
        setChessMoves(moves => [...moves, moveSan]);
      }
      setComputerThinking(false);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [activeGame, chessDifficulty, chessGame, chessMode, chessMoves, chessTurn]);

  const active = games.find(game => game.id === activeGame);

  const resetActive = () => {
    if (activeGame === 'snake') resetSnake();
    if (activeGame === 'chess') resetChess();
    if (activeGame === 'tictactoe') resetTic();
    if (activeGame === '2048') reset2048();
    if (activeGame === 'platformer') setPlatformerRestartKey(key => key + 1);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#080d1b] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 -top-36 h-96 w-96 rounded-full bg-violet-600/20 blur-[100px]" />
        <div className="absolute -bottom-48 -right-24 h-96 w-96 rounded-full bg-cyan-500/15 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(#c4b5fd 0.7px, transparent 0.7px)', backgroundSize: '22px 22px' }} />
      </div>

      <header className="relative z-10 flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 shadow-[0_8px_30px_rgba(168,85,247,0.35)]">
            <Gamepad2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-violet-200/60">Abhishek Arcade</p>
            <h1 className="text-lg font-black tracking-tight">Game Center</h1>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-medium text-white/55 sm:flex">
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          FIVE WORLDS · YOUR NEXT HIGH SCORE
        </div>
      </header>

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto p-5 md:p-7">
        <AnimatePresence mode="wait">
          {!activeGame ? (
            <motion.div key="lobby" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto max-w-6xl">
              <section className="relative mb-7 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-violet-500/20 via-indigo-500/10 to-cyan-400/10 p-6 shadow-2xl md:p-8">
                <div className="absolute -right-8 -top-16 select-none text-[180px] opacity-[0.08]">🎮</div>
                <div className="relative max-w-xl">
                  <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/15 bg-violet-300/10 px-3 py-1 text-[10px] font-bold tracking-widest text-violet-100">
                    <Waves className="h-3.5 w-3.5" /> READY PLAYER ONE
                  </span>
                  <h2 className="mt-4 text-3xl font-black leading-tight md:text-4xl">Small games.<br /><span className="bg-gradient-to-r from-fuchsia-300 via-violet-200 to-cyan-200 bg-clip-text text-transparent">Big main-character energy.</span></h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-slate-300/75">Jump into a quick round, challenge a friend, or chase a new high score. Pick a world and press play.</p>
                </div>
              </section>

              <div className="mb-4 flex items-end justify-between">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-200/50">Choose your game</p><h3 className="mt-1 text-xl font-bold">The arcade</h3></div>
                <span className="text-xs text-slate-400">5 games available</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {games.map((game, index) => (
                  <motion.button
                    type="button"
                    key={game.id}
                    onClick={() => { setActiveGame(game.id); if (game.id === 'snake') resetSnake(); }}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    whileHover={{ y: -5, rotateX: 2, rotateY: -2 }}
                    whileTap={{ scale: 0.985 }}
                    className="group relative min-h-48 overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.09] to-white/[0.025] p-5 text-left shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition-colors hover:border-white/20"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className={`absolute -right-4 -top-6 h-36 w-36 rounded-full bg-gradient-to-br ${game.color} opacity-20 blur-3xl transition-opacity group-hover:opacity-40`} />
                    <div className="relative flex items-start justify-between">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br ${game.color} text-3xl shadow-[0_10px_24px_rgba(0,0,0,0.25)] transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}>
                        {game.emoji}
                      </div>
                      <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[9px] font-bold tracking-widest text-white/50">{game.badge}</span>
                    </div>
                    <div className="relative mt-7 flex items-end justify-between">
                      <div><h4 className="text-lg font-extrabold">{game.title}</h4><p className="mt-1 text-xs text-slate-400">{game.subtitle}</p></div>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] transition-all group-hover:border-white/30 group-hover:bg-white/15 group-hover:translate-x-1"><ArrowRight className="h-4 w-4" /></span>
                    </div>
                  </motion.button>
                ))}
              </div>
              <p className="mt-6 text-center text-[10px] text-slate-500">Original mini-games made for ARLO OS · no downloads or accounts needed</p>
            </motion.div>
          ) : (
            <motion.div key={activeGame} initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.985 }} className="mx-auto max-w-5xl">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <button type="button" onClick={() => setActiveGame(null)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"><ChevronLeft className="h-4 w-4" /> All games</button>
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${active?.color} text-xl`}>{active?.emoji}</div>
                  <div><h2 className="font-bold">{active?.title}</h2><p className="text-[10px] text-slate-400">{active?.subtitle}</p></div>
                </div>
                <button type="button" onClick={resetActive} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"><RotateCcw className="h-3.5 w-3.5" /> Restart</button>
              </div>

              {activeGame === 'snake' && (
                <div className="mx-auto max-w-xl rounded-[28px] border border-emerald-300/15 bg-gradient-to-br from-[#0d2023] to-[#0a111d] p-5 shadow-2xl sm:p-7">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div><p className="text-[10px] uppercase tracking-widest text-emerald-200/50">Score {snakeScore} · Best {snakeBest}</p><p className="text-2xl font-black tabular-nums">{snakeScore}<span className="ml-2 text-xs font-semibold text-emerald-200/50">PTS</span></p></div>
                    <div className="flex items-center gap-2">
                      <select value={snakeDifficulty} onChange={event => setSnakeDifficulty(event.target.value as typeof snakeDifficulty)} className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-[10px] text-white"><option value="easy">Easy</option><option value="normal">Normal</option><option value="hard">Hard</option><option value="insane">Insane</option></select>
                      <button type="button" disabled={!snakeRunning || snakeOver} onClick={() => setSnakePaused(paused => !paused)} className="rounded-lg border border-emerald-200/15 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold text-emerald-100 disabled:opacity-40">{snakePaused ? 'Resume' : 'Pause'}</button>
                    </div>
                  </div>
                  <div className="mx-auto grid aspect-square w-full max-w-[410px] grid-cols-[repeat(15,minmax(0,1fr))] gap-1 rounded-2xl border border-emerald-200/10 bg-[#071114] p-2 shadow-[inset_0_0_40px_rgba(16,185,129,0.07)]">
                    {Array.from({ length: 225 }, (_, index) => {
                      const y = Math.floor(index / 15); const x = index % 15;
                      const isSnake = snake.some(([sy, sx]) => sy === y && sx === x);
                      const isHead = snake[0][0] === y && snake[0][1] === x;
                      return <div key={index} className={`rounded-[4px] transition-colors ${isHead ? 'bg-gradient-to-br from-lime-200 to-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]' : isSnake ? 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_0_8px_rgba(20,184,166,0.4)]' : food[0] === y && food[1] === x ? 'animate-pulse rounded-full bg-gradient-to-br from-rose-300 to-pink-500 shadow-[0_0_12px_rgba(244,114,182,0.8)]' : (x + y) % 2 ? 'bg-white/[0.018]' : 'bg-white/[0.035]'}`} />;
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3"><p className="text-xs text-slate-400">{snakeOver ? 'Run over — one more round?' : snakePaused ? 'Paused' : snakeRunning ? 'Collect the glow. Avoid the edges.' : 'Press a direction to start your run.'}</p><button type="button" onClick={resetSnake} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-bold shadow-lg shadow-emerald-900/40 transition hover:brightness-110">{snakeOver ? 'Play again' : snakeRunning ? 'Restart run' : 'Start run'}</button></div>
                </div>
              )}

              {activeGame === 'chess' && (
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 rounded-[28px] border border-violet-200/10 bg-gradient-to-br from-[#171427] to-[#101323] p-4 shadow-2xl sm:gap-5 sm:p-6">
                  <div className="flex w-full flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                      Mode
                      <select value={chessMode} onChange={event => { setChessMode(event.target.value as 'local' | 'computer'); resetChess(); }} className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white">
                        <option value="local">Player vs player</option>
                        <option value="computer">Player vs computer</option>
                      </select>
                    </label>
                    {chessMode === 'computer' && <label className="flex items-center gap-2 text-xs text-slate-400">AI
                      <select value={chessDifficulty} onChange={event => setChessDifficulty(Number(event.target.value))} className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white">
                        <option value={0}>Easy</option><option value={1}>Medium</option><option value={2}>Hard</option><option value={3}>Expert</option>
                      </select>
                    </label>}
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${chessTurn === 'w' ? 'bg-amber-100/10 text-amber-100' : 'bg-violet-300/10 text-violet-200'}`}>
                      {computerThinking ? 'Computer thinking…' : chessStatus ?? `${chessTurn === 'w' ? 'White' : 'Black'} to move`}
                    </span>
                  </div>
                  <div className="mx-auto grid aspect-square w-full max-w-[min(100%,520px)] grid-cols-8 grid-rows-8 overflow-hidden rounded-2xl border-[6px] border-[#36294c] bg-[#36294c] shadow-[0_18px_55px_rgba(0,0,0,0.55),inset_0_2px_8px_rgba(255,255,255,0.14)]">
                    {chessGame.board().flatMap((row, y) => row.map((piece, x) => {
                      const light = (x + y) % 2 === 0;
                      const square = boardSquare(y, x);
                      const selected = chessPick === square;
                      const legal = legalChessMoves.includes(square);
                      const checkedKing = chessGame.isCheck() && piece?.type === 'k' && piece.color === chessTurn;
                      const lastMove = lastChessMove?.from === square || lastChessMove?.to === square;
                      return <button type="button" key={square} onClick={() => chessMove(square)} aria-label={`${piece?.color === 'w' ? 'white' : piece?.color === 'b' ? 'black' : 'empty'} ${piece?.type || 'square'} ${square}`} className={`relative flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden p-0 text-[clamp(1rem,4.2vw,2.8rem)] leading-none transition-colors ${light ? 'bg-[#e7d7c4]' : 'bg-[#73516f]'} ${lastMove ? 'ring-2 ring-inset ring-amber-300/60' : ''} ${selected ? '!bg-cyan-300/80' : ''} ${checkedKing ? '!bg-rose-500/70 animate-pulse' : ''} hover:brightness-110`}>
                        {piece && <span className={`relative z-10 select-none drop-shadow-[0_3px_3px_rgba(0,0,0,0.6)] ${piece.color === 'w' ? 'text-white' : 'text-[#25172b]'}`}>{pieceGlyph[piece.type]}</span>}
                        {legal && <span className={`absolute ${piece ? 'inset-1 rounded-full border-[3px] border-rose-500/55' : 'h-2.5 w-2.5 rounded-full bg-black/25'}`} />}
                      </button>;
                    }))}
                  </div>
                  <div className="flex w-full items-center justify-between gap-3 text-xs text-slate-400">
                    <p>{chessGame.isGameOver() ? 'Game complete — restart for a new game.' : 'Legal moves, check, castling, en passant, and promotion are enforced.'}</p>
                    <span className="shrink-0 text-[10px] text-slate-500">{chessHistory.length} half-moves</span>
                  </div>
                  {chessHistory.length > 0 && <ol className="flex w-full flex-wrap gap-2 text-[10px] text-slate-400">{Array.from({ length: Math.ceil(chessHistory.length / 2) }, (_, index) => <li key={index} className="rounded-md bg-white/[0.04] px-2 py-1">{index + 1}. {chessHistory[index * 2]?.san} {chessHistory[index * 2 + 1]?.san ?? ''}</li>)}</ol>}
                </div>
              )}

              {activeGame === 'platformer' && (
                <PixelDashGame restartKey={platformerRestartKey} />
              )}

              {activeGame === 'tictactoe' && (
                <div className="mx-auto max-w-lg rounded-[28px] border border-fuchsia-200/10 bg-gradient-to-br from-[#21152d] to-[#121426] p-6 shadow-2xl sm:p-8">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div><p className="text-[10px] uppercase tracking-widest text-fuchsia-200/50">{ticMode === 'local' ? 'Pass & play' : 'Player vs computer'}</p><p className="mt-1 text-xl font-black">{ticWinner ? ticWinner === 'draw' ? 'It’s a draw!' : `${ticWinner} takes the round!` : `${ticTurn}’s turn`}</p><p className="mt-1 text-[10px] text-slate-400">X {ticStats.x} · O {ticStats.o} · Draws {ticStats.draws}</p></div>
                    <label className="flex items-center gap-2 text-[10px] text-slate-400">Mode
                      <select value={ticMode} onChange={event => { setTicMode(event.target.value as 'local' | 'computer'); resetTic(); }} className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white">
                        <option value="local">Two players</option><option value="computer">Vs computer</option>
                      </select>
                    </label>
                    {ticMode === 'computer' && <label className="flex items-center gap-2 text-[10px] text-slate-400">AI
                      <select value={ticDifficulty} onChange={event => setTicDifficulty(Number(event.target.value))} className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white">
                        <option value={0}>Easy</option><option value={1}>Medium</option><option value={2}>Impossible</option>
                      </select>
                    </label>}
                  </div>
                  <div className="grid aspect-square grid-cols-3 gap-3">
                    {ticBoard.map((mark, index) => <motion.button type="button" key={index} disabled={Boolean(ticWinner) || Boolean(mark) || computerThinking || (ticMode === 'computer' && ticTurn === 'O')} whileTap={{ scale: 0.93 }} onClick={() => playTicCell(index)} className={`flex items-center justify-center rounded-[22px] border text-5xl font-black shadow-[0_8px_25px_rgba(0,0,0,0.22)] transition-all disabled:cursor-default ${mark === 'X' ? 'border-cyan-200/15 bg-gradient-to-br from-cyan-400/20 to-blue-500/10 text-cyan-200' : mark === 'O' ? 'border-fuchsia-200/15 bg-gradient-to-br from-fuchsia-400/20 to-violet-500/10 text-fuchsia-200' : 'border-white/[0.06] bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.08]'}`}>{mark}</motion.button>)}
                  </div>
                  <div className="mt-5 flex items-center justify-between"><p className="text-xs text-slate-500">{computerThinking ? 'Computer choosing a legal move…' : ticMode === 'local' ? 'Two players · one device' : 'X is you · O is the computer'}</p><button type="button" onClick={resetTic} className="text-xs font-bold text-fuchsia-200 hover:text-white">New round</button></div>
                </div>
              )}

              {activeGame === '2048' && (
                <div className="mx-auto max-w-lg rounded-[28px] border border-amber-200/10 bg-gradient-to-br from-[#292015] to-[#171421] p-5 shadow-2xl sm:p-7">
                  <div className="mb-4 flex items-center justify-between gap-2"><div><p className="text-[10px] uppercase tracking-widest text-amber-200/50">Merge your way up</p><h3 className="mt-1 text-2xl font-black">2048</h3><p className="text-[10px] text-slate-400">Best {best2048} · {moves2048} moves</p></div><div className="flex items-center gap-2"><div className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-center"><p className="text-[9px] font-bold tracking-widest text-white/40">SCORE</p><p className="text-lg font-black tabular-nums">{score2048}</p></div><button type="button" disabled={!undo2048} onClick={() => { if (!undo2048) return; setGrid2048(undo2048.board); setScore2048(undo2048.score); setMoves2048(undo2048.moves); setUndo2048(null); }} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-amber-100 disabled:opacity-40">Undo</button></div></div>
                  <div
                    onPointerDown={event => { swipeStartRef.current = [event.clientX, event.clientY]; }}
                    onPointerUp={event => {
                      if (!swipeStartRef.current) return;
                      const dx = event.clientX - swipeStartRef.current[0];
                      const dy = event.clientY - swipeStartRef.current[1];
                      swipeStartRef.current = null;
                      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
                      move2048(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up');
                    }}
                    className="relative grid aspect-square touch-none grid-cols-4 gap-2 rounded-[22px] border border-white/[0.06] bg-[#28243a] p-2.5 sm:gap-3 sm:p-3"
                  >
                    {grid2048.flatMap((row, y) => row.map((value, x) => <motion.div key={`${y}-${x}`} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={`flex items-center justify-center rounded-xl text-2xl font-black tabular-nums transition-colors sm:text-3xl ${value === 0 ? 'bg-white/[0.045]' : value <= 4 ? 'bg-[#eee4da] text-[#594c43]' : value <= 16 ? 'bg-[#f4b179] text-white' : value <= 64 ? 'bg-[#f3815e] text-white' : value <= 256 ? 'bg-[#e95a43] text-white' : 'bg-gradient-to-br from-amber-300 to-orange-500 text-white shadow-[0_0_22px_rgba(251,191,36,0.35)]'}`}>{value || ''}</motion.div>))}
                    {(gameOver2048 || (won2048 && !continue2048)) && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[22px] bg-slate-950/75 text-center backdrop-blur-sm"><strong className="text-xl font-black text-amber-100">{gameOver2048 ? 'No more moves' : '2048 reached!'}</strong><span className="text-xs text-slate-300">{gameOver2048 ? `Final score ${score2048}` : 'Keep going for a higher tile?'}</span>{gameOver2048 ? <button type="button" onClick={reset2048} className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950">New game</button> : <button type="button" onClick={() => setContinue2048(true)} className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950">Continue</button>}</div>}
                  </div>
                  <div className="mt-4 flex items-center justify-between"><p className="text-xs text-slate-400">Arrows / WASD · swipe to slide</p><button type="button" onClick={reset2048} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-amber-100 hover:bg-white/10">New game</button></div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <footer className="relative z-10 flex items-center justify-between border-t border-white/[0.07] px-5 py-2 text-[9px] text-slate-500">
        <span>ARLO OS · ARCADE</span><span className="flex items-center gap-1"><Circle className="h-1.5 w-1.5 fill-emerald-400 text-emerald-400" /> Local play · progress stays in this window</span>
      </footer>
    </div>
  );
};
