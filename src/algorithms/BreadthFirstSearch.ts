// Random Search Algorithm for Pathfinding
// Returns a path as an array of [row, col] or null if not found

import { GridCellType, Grid } from '../GridCanvas';

export type Point = [number, number];

export function* breadthFirstSearchSteps(
  grid: Grid,
  start: Point,
  end: Point
): Generator<{
  current: Point;
  visited: boolean[][];
  parent: (Point | null)[][];
  found: boolean;
  layer: number;
}, void, unknown> {
  const numRows = grid.length;
  const numCols = grid[0].length;
  const visited = Array.from({ length: numRows }, () => Array(numCols).fill(false));
  const parent: (Point | null)[][] = Array.from({ length: numRows }, () => Array(numCols).fill(null));

  const queue: Point[] = [start];
  visited[start[0]][start[1]] = true;
  let layer = 0;

  while (queue.length > 0) {
    const currentLayerSize = queue.length;
    let lastCurrent: Point = start;
    for (let i = 0; i < currentLayerSize; i++) {
      const current = queue.shift()!;
      lastCurrent = current;
      const [row, col] = current;
      if (row === end[0] && col === end[1]) {
        yield { current, visited, parent, found: true, layer };
        return;
      }
      const neighbors: Point[] = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ];
      for (const [nRow, nCol] of neighbors) {
        if (
          nRow >= 0 && nRow < numRows &&
          nCol >= 0 && nCol < numCols &&
          !visited[nRow][nCol] &&
          grid[nRow][nCol] !== GridCellType.WALL
        ) {
          queue.push([nRow, nCol]);
          visited[nRow][nCol] = true;
          parent[nRow][nCol] = [row, col];
        }
      }
    }
    yield { current: lastCurrent, visited, parent, found: false, layer };
    layer++;
  }
} 