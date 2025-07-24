import { Grid, GridCellType } from "../GridCanvas";

export type Point = {x: number, y: number};

export function getNeighbors(row: number, col: number): Point[] {
    return [
        {x: row - 1, y: col},
        {x: row + 1, y: col},
        {x: row, y: col - 1},
        {x: row, y: col + 1},
    ];
}

export function isInBounds(row: number, col: number, numRows: number, numCols: number) {
    return row >= 0 && row < numRows && col >= 0 && col < numCols;
}

export function isWall(grid: Grid, row: number, col: number) {
    return grid[row][col] === GridCellType.WALL;
}

export function isVisited(visited: boolean[][], row: number, col: number) {
    return visited[row][col];
}

export function isEnd(row: number, col: number, end: Point) {
    return row === end.x && col === end.y;
}