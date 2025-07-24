import { GridCellType, Grid } from '../GridCanvas';
import { PriorityQueue } from 'priority-queue-typescript';
import { Point, isInBounds, isWall, isVisited, isEnd, getNeighbors, manhattanDistance } from './algorithmHelper';

interface AStarNode extends Point {
  g: number; // cost from start
  f: number; // g + h
}

export function* aStarSteps(
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
  const gScore = Array.from({ length: numRows }, () => Array(numCols).fill(Infinity));

  const queue = new PriorityQueue<AStarNode>(
    numRows * numCols,
    (a: AStarNode, b: AStarNode) => a.f - b.f
  );

  queue.add({ x: start.x, y: start.y, g: 0, f: manhattanDistance(start, end) });
  gScore[start.x][start.y] = 0;

  while (!queue.empty()) {
    const current = queue.poll();
    if (!current) return;
    if (visited[current.x][current.y]) continue; 
    visited[current.x][current.y] = true;
    if (isEnd(current.x, current.y, end)) {
      yield { current, visited, parent, found: true };
      return;
    }
    yield { current, visited, parent, found: false };
    const neighbors = getNeighbors(current.x, current.y);
    for (const neighbor of neighbors) {
      if (
        isInBounds(neighbor.x, neighbor.y, numRows, numCols) &&
        !isWall(grid, neighbor.x, neighbor.y)
      ) {
        const tentativeG = gScore[current.x][current.y] + 1;
        if (tentativeG < gScore[neighbor.x][neighbor.y] && !visited[neighbor.x][neighbor.y]) {
          gScore[neighbor.x][neighbor.y] = tentativeG;
          parent[neighbor.x][neighbor.y] = { x: current.x, y: current.y };
          queue.add({
            x: neighbor.x,
            y: neighbor.y,
            g: tentativeG,
            f: tentativeG + manhattanDistance(neighbor, end) * 1.5
          });
        }
      }
    }
  }
}
