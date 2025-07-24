import { GridCellType, Grid } from '../GridCanvas';
import { PriorityQueue } from 'priority-queue-typescript';

export type Point = [number, number];

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

    const queue = new PriorityQueue<Point>(
        20 * 30,
        (a: Point, b: Point) => distanceCalc(a, end) - distanceCalc(b, end)
    );

    const numRows = grid.length;
    const numCols = grid[0].length;
    const visited = Array.from({ length: numRows }, () => Array(numCols).fill(false));
    const parent: (Point | null)[][] = Array.from({ length: numRows }, () => Array(numCols).fill(null));

    queue.add(start);
    visited[start[0]][start[1]] = true;

    while(!queue.empty())
    {
        const current = queue.poll();
        if(current == null)
            return
        
        if(current?.[0] == end[0] && current[1] == end[1])
        {
            yield { current, visited, parent, found: true }
            return;
        }

        yield { current, visited, parent, found: false };
        const neighbors: Point[] = [
            [current[0] - 1, current[1]],
            [current[0] + 1, current[1]],
            [current[0], current[1] - 1],
            [current[0], current[1] + 1],
        ];
        for (const [nRow, nCol] of neighbors) {
            if (
              nRow >= 0 && nRow < numRows &&
              nCol >= 0 && nCol < numCols &&
              !visited[nRow][nCol] &&
              grid[nRow][nCol] !== GridCellType.WALL
            ) {
              queue.add([nRow, nCol]);
              visited[nRow][nCol] = true;
              parent[nRow][nCol] = [current[0], current[1]];
            }
          }
    }

}

export function testQueueWithPointsAndGoal() {
    const goal: Point = [5, 5];
    const points: Point[] = [
        [1, 1],
        [4, 4],
        [6, 6],
        [2, 8],
        [5, 5],
        [0, 0]
    ];
    const queue = new PriorityQueue<Point>(
        points.length,
        (a: Point, b: Point) => distanceCalc(a, goal) - distanceCalc(b, goal)
    );
    points.forEach(pt => queue.add(pt));
    console.log('Dequeuing points in order of increasing distance to goal', goal);
    while (!queue.empty()) {
        const pt = queue.poll();
        if (pt) {
            console.log(`Point: [${pt[0]}, ${pt[1]}], Distance: ${distanceCalc(pt, goal).toFixed(2)}`);
        }
    }
}

function distanceCalc(a: Point, b: Point)
{
    return Math.sqrt(Math.pow(Math.abs(a[0]-b[0]), 2) + Math.pow(Math.abs(a[1]-b[1]), 2));
}