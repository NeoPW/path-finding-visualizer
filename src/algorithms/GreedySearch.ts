import { GridCellType, Grid } from '../GridCanvas';
import { PriorityQueue } from 'priority-queue-typescript';
import { Point, isInBounds, isWall, isVisited, isEnd, getNeighbors, manhattanDistance } from './algorithmHelper';

export function* greedySearchSteps(
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

    const queue = new PriorityQueue<Point>(
        numRows * numCols,
        (a: Point, b: Point) => manhattanDistance(a, end) - manhattanDistance(b, end)
    );

    queue.add(start);
    visited[start.x][start.y] = true;

    while (!queue.empty())
    {
        const current = queue.poll();
        if(current === null)
            return;
        
        if(isEnd(current.x, current.y, end))
        {
            yield { current, visited, parent, found: true }
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
              queue.add(neighbor);
              visited[neighbor.x][neighbor.y] = true;
              parent[neighbor.x][neighbor.y] = {x: current.x, y: current.y};
            }
          }
    }

}