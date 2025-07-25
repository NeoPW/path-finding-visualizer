export type MazeType =
  | 'none'
  | 'random'
  | 'verticalLines'
  | 'horizontalLines'
  | 'comboLines'
  | 'spiral'
  | 'checkerboard'
  | 'diamonds'
  | 'caves'
  | 'dfsMaze';

// --- Maze Generators ---
function mazeNone(numRows: number, numCols: number): boolean[][] {
  return Array.from({ length: numRows }, () => Array(numCols).fill(false));
}

function mazeRandom(numRows: number, numCols: number): boolean[][] {
  return Array.from({ length: numRows }, () =>
    Array.from({ length: numCols }, () => Math.random() < 0.3)
  );
}

function mazeVerticalLines(numRows: number, numCols: number): boolean[][] {
  const maze = Array.from({ length: numRows }, () => Array(numCols).fill(false));
  for (let j = 1; j < numCols; j += 2) {
    const emptyRow = Math.floor(Math.random() * numRows);
    for (let i = 0; i < numRows; i++) {
      if (i !== emptyRow) {
        maze[i][j] = true;
      }
    }
  }
  return maze;
}

function mazeHorizontalLines(numRows: number, numCols: number): boolean[][] {
  const maze = Array.from({ length: numRows }, () => Array(numCols).fill(false));
  for (let i = 1; i < numRows; i += 2) {
    const emptyCol = Math.floor(Math.random() * numCols);
    for (let j = 0; j < numCols; j++) {
      if (j !== emptyCol) {
        maze[i][j] = true;
      }
    }
  }
  return maze;
}

function mazeComboLines(numRows: number, numCols: number): boolean[][] {
  const maze = mazeVerticalLines(numRows, numCols);
  const hMaze = mazeHorizontalLines(numRows, numCols);
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      maze[i][j] = maze[i][j] || hMaze[i][j];
    }
  }
  return maze;
}

function mazeSpiral(numRows: number, numCols: number): boolean[][] {
  const maze = Array.from({ length: numRows }, () => Array(numCols).fill(true));
  let top = 0, bottom = numRows - 1, left = 0, right = numCols - 1;
  while (top <= bottom && left <= right) {
    for (let j = left; j <= right; j++) maze[top][j] = false;
    top++;
    for (let i = top; i <= bottom; i++) maze[i][right] = false;
    right--;
    if (top <= bottom) {
      for (let j = right; j >= left; j--) maze[bottom][j] = false;
      bottom--;
    }
    if (left <= right) {
      for (let i = bottom; i >= top; i--) maze[i][left] = false;
      left++;
    }
  }
  return maze;
}

function mazeCheckerboard(numRows: number, numCols: number): boolean[][] {
  return Array.from({ length: numRows }, (_, i) =>
    Array.from({ length: numCols }, (_, j) => (i + j) % 2 === 0)
  );
}

function mazeDiamonds(numRows: number, numCols: number): boolean[][] {
  const maze = Array.from({ length: numRows }, () => Array(numCols).fill(false));
  const cx = Math.floor(numRows / 2), cy = Math.floor(numCols / 2);
  const maxDist = Math.min(cx, cy);
  for (let d = 1; d <= maxDist; d += 2) {
    for (let dx = -d; dx <= d; dx++) {
      const dy = d - Math.abs(dx);
      if (cx + dx >= 0 && cx + dx < numRows && cy + dy >= 0 && cy + dy < numCols)
        maze[cx + dx][cy + dy] = true;
      if (cx + dx >= 0 && cx + dx < numRows && cy - dy >= 0 && cy - dy < numCols)
        maze[cx + dx][cy - dy] = true;
    }
  }
  return maze;
}

function mazeCaves(numRows: number, numCols: number): boolean[][] {
  const maze = Array.from({ length: numRows }, () => Array(numCols).fill(true));
  let x = Math.floor(numRows / 2), y = Math.floor(numCols / 2);
  maze[x][y] = false;
  const steps = numRows * numCols * 2;
  for (let i = 0; i < steps; i++) {
    const dir = Math.floor(Math.random() * 4);
    if (dir === 0 && x > 0) x--;
    else if (dir === 1 && x < numRows - 1) x++;
    else if (dir === 2 && y > 0) y--;
    else if (dir === 3 && y < numCols - 1) y++;
    maze[x][y] = false;
  }
  return maze;
}

function mazeDFS(numRows: number, numCols: number): boolean[][] {
  const maze = Array.from({ length: numRows }, () => Array(numCols).fill(true));
  function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function carve(x: number, y: number) {
    maze[x][y] = false;
    const dirs = shuffle([[0,1],[1,0],[0,-1],[-1,0]]);
    for (const [dx, dy] of dirs) {
      const nx = x + dx * 2, ny = y + dy * 2;
      if (nx >= 0 && nx < numRows && ny >= 0 && ny < numCols && maze[nx][ny]) {
        maze[x + dx][y + dy] = false;
        carve(nx, ny);
      }
    }
  }
  maze[0][1] = false;
  const sx = Math.floor(Math.random() * Math.floor(numRows / 2)) * 2 + 1;
  const sy = Math.floor(Math.random() * Math.floor(numCols / 2)) * 2 + 1;
  carve(sx, sy);
  return maze;
}

// --- Path Carving ---
function carveRandomPath(maze: boolean[][], start: {x: number, y: number}, end: {x: number, y: number}) {
  let x = start.x, y = start.y;
  maze[x][y] = false;
  while (x !== end.x || y !== end.y) {
    const options = [];
    if (x < end.x) options.push([x + 1, y]);
    if (x > end.x) options.push([x - 1, y]);
    if (y < end.y) options.push([x, y + 1]);
    if (y > end.y) options.push([x, y - 1]);
    if (Math.random() < 0.5 && x > 0) options.push([x - 1, y]);
    if (Math.random() < 0.5 && x < maze.length - 1) options.push([x + 1, y]);
    if (Math.random() < 0.5 && y > 0) options.push([x, y - 1]);
    if (Math.random() < 0.5 && y < maze[0].length - 1) options.push([x, y + 1]);
    const [nx, ny] = options[Math.floor(Math.random() * options.length)];
    x = nx; y = ny;
    maze[x][y] = false;
  }
}

// --- Maze Type Map ---
const mazeGenerators: Record<MazeType, (numRows: number, numCols: number) => boolean[][]> = {
  none: mazeNone,
  random: mazeRandom,
  verticalLines: mazeVerticalLines,
  horizontalLines: mazeHorizontalLines,
  comboLines: mazeComboLines,
  spiral: mazeSpiral,
  checkerboard: mazeCheckerboard,
  diamonds: mazeDiamonds,
  caves: mazeCaves,
  dfsMaze: mazeDFS,
};

// --- Main API ---
const typesWithRandomPath = new Set<MazeType>([
  'comboLines', 'spiral', 'checkerboard', 'diamonds', 'caves'
]);

export function generateMaze(
  numRows: number,
  numCols: number,
  type: MazeType,
  start?: { x: number; y: number },
  end?: { x: number; y: number }
): boolean[][] {
  const maze = mazeGenerators[type](numRows, numCols);
  if (
    start &&
    end &&
    type !== 'none' &&
    type !== 'dfsMaze' &&
    typesWithRandomPath.has(type)
  ) {
    carveRandomPath(maze, start, end);
  }
  return maze;
} 