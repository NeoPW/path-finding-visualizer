// Random Search Algorithm for Pathfinding
// Returns a path as an array of [row, col] or null if not found

import { GridCellType, Grid } from '../GridCanvas';
import { Point, isInBounds, isWall, isVisited, isEnd, getNeighbors } from './algorithmHelper';

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
  visited[start.x][start.y] = true;
  let layer = 0;

  while (queue.length > 0) {
    const currentLayerSize = queue.length;
    let lastCurrent: Point = start;
    for (let i = 0; i < currentLayerSize; i++) {
      const current = queue.shift()!;
      lastCurrent = current;
      if (isEnd(current.x, current.y, end)) {
        yield { current, visited, parent, found: true, layer };
        return;
      }
      const neighbors: Point[] = getNeighbors(current.x, current.y);
      for (const neighbor of neighbors) {
        if (
          isInBounds(neighbor.x, neighbor.y, numRows, numCols) &&
          !isVisited(visited, neighbor.x, neighbor.y) &&
          !isWall(grid, neighbor.x, neighbor.y)
        ) {
          queue.push(neighbor);
          visited[neighbor.x][neighbor.y] = true;
          parent[neighbor.x][neighbor.y] = {x: current.x, y: current.y};
        }
      }
    }
    yield { current: lastCurrent, visited, parent, found: false, layer };
    layer++;
  }
} 