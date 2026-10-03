export type TicMark = 'X' | 'O' | null;
export type TicResult = TicMark | 'draw' | null;
export type SlideDirection = 'left' | 'right' | 'up' | 'down';

export const initial2048 = () => {
  const board = Array.from({ length: 4 }, () => Array(4).fill(0));
  for (let i = 0; i < 2; i += 1) {
    const cells = board.flatMap((row, y) => row.map((value, x) => value ? null : [y, x] as [number, number])).filter((cell): cell is [number, number] => cell !== null);
    const [y, x] = cells[Math.floor(Math.random() * cells.length)];
    board[y][x] = Math.random() < 0.9 ? 2 : 4;
  }
  return board;
};

export const spawnSnakeFood = (snake: Array<[number, number]>): [number, number] | null => {
  const occupied = new Set(snake.map(([y, x]) => `${y}:${x}`));
  const empty: Array<[number, number]> = [];
  for (let y = 0; y < 15; y += 1) {
    for (let x = 0; x < 15; x += 1) {
      if (!occupied.has(`${y}:${x}`)) empty.push([y, x]);
    }
  }
  return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
};

export const slide2048 = (board: number[][], direction: SlideDirection) => {
  const next = board.map(row => [...row]);
  let gained = 0;
  for (let line = 0; line < 4; line += 1) {
    let values = Array.from({ length: 4 }, (_, i) =>
      direction === 'left' || direction === 'right' ? next[line][i] : next[i][line],
    );
    if (direction === 'right' || direction === 'down') values.reverse();
    values = values.filter(Boolean);
    for (let i = 0; i < values.length - 1; i += 1) {
      if (values[i] !== values[i + 1]) continue;
      values[i] *= 2;
      gained += values[i];
      values.splice(i + 1, 1);
    }
    values = [...values, ...Array(4 - values.length).fill(0)];
    if (direction === 'right' || direction === 'down') values.reverse();
    for (let i = 0; i < 4; i += 1) {
      if (direction === 'left' || direction === 'right') next[line][i] = values[i];
      else next[i][line] = values[i];
    }
  }
  return { board: next, gained };
};

export const canMove2048 = (board: number[][]) =>
  board.some((row, y) => row.some((value, x) =>
    value === 0 ||
    (x < 3 && value === row[x + 1]) ||
    (y < 3 && value === board[y + 1][x])
  ));

const ticLines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

export const getTicResult = (board: TicMark[]): TicResult => {
  const line = ticLines.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
  return line ? board[line[0]] : board.every(Boolean) ? 'draw' : null;
};

const minimaxTic = (board: TicMark[], mark: 'X' | 'O', depth: number): number => {
  const result = getTicResult(board);
  if (result === 'O') return 10 - depth;
  if (result === 'X') return depth - 10;
  if (result === 'draw') return 0;

  const scores = board.flatMap((cell, index) => {
    if (cell) return [];
    const next = [...board];
    next[index] = mark;
    return [minimaxTic(next, mark === 'X' ? 'O' : 'X', depth + 1)];
  });
  return mark === 'O' ? Math.max(...scores) : Math.min(...scores);
};

export const chooseTicCell = (board: TicMark[], difficulty: number): number | undefined => {
  const openCells = board.flatMap((cell, index) => cell ? [] : [index]);
  if (!openCells.length) return undefined;
  if (difficulty === 0) return openCells[Math.floor(Math.random() * openCells.length)];
  const winningMove = (mark: 'X' | 'O') => openCells.find(index => {
    const next = [...board];
    next[index] = mark;
    return getTicResult(next) === mark;
  });
  const winning = winningMove('O');
  if (winning !== undefined) return winning;
  const block = winningMove('X');
  if (block !== undefined) return block;
  if (difficulty === 1 && Math.random() < 0.45) return openCells[Math.floor(Math.random() * openCells.length)];

  let best = openCells[0];
  let bestScore = -Infinity;
  openCells.forEach(index => {
    const next = [...board];
    next[index] = 'O';
    const score = minimaxTic(next, 'X', 1);
    if (score > bestScore) {
      best = index;
      bestScore = score;
    }
  });
  return best;
};
