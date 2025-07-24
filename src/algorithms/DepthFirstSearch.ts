import { GridCellType, Grid } from '../GridCanvas';
import { Point, isInBounds, isWall, isVisited, isEnd, getNeighbors } from './algorithmHelper';

export function* depthFirstSearchSteps(
  grid: Grid,
  start: Point,
  end: Point
): Generator<{
  current: Point;
  visited: boolean[][];
  parent: (Point | null)[][];
  found: boolean;
}, void, unknown> {
  const numRows = grid.length;
  const numCols = grid[0].length;
  const visited = Array.from({ length: numRows }, () => Array(numCols).fill(false));
  const parent: (Point | null)[][] = Array.from({ length: numRows }, () => Array(numCols).fill(null));

  const stack: Point[] = [start];
  visited[start.x][start.y] = true;

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (isEnd(current.x, current.y, end)) {
      yield { current, visited, parent, found: true };
      return;
    }
    yield { current, visited, parent, found: false };
    const neighbors: Point[] = getNeighbors(current.x, current.y);
    for (const neighbor of neighbors) {
      if (
        isInBounds(neighbor.x, neighbor.y, numRows, numCols) &&
        !isVisited(visited, neighbor.x, neighbor.y) &&
        !isWall(grid, neighbor.x, neighbor.y)
      ) {
        stack.push(neighbor);
        visited[neighbor.x][neighbor.y] = true;
        parent[neighbor.x][neighbor.y] = {x: current.x, y: current.y};
      }
    }
  }
} 