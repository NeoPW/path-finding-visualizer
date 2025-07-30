import { Grid } from '../GridCanvas';
import { PriorityQueue } from 'priority-queue-typescript';
import { Point, isInBounds, isWall, isEnd, manhattanDistance } from './algorithmHelper';

interface JPSNode extends Point {
  g: number; // cost from start
  f: number; // g + h
}

interface JumpResult {
  jumpPoint: Point | null;
  visitedNodes: Point[];
}

const HEURISTIC_MULTIPLIER = 1.0;

// Direction vectors for 4-directional movement (cardinal only)
const DIRECTIONS = [
  [-1, 0], [0, -1], [0, 1], [1, 0]  // up, left, right, down
];

export function* jumpPointSearchSteps(
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

  const queue = new PriorityQueue<JPSNode>(
    numRows * numCols,
    (a: JPSNode, b: JPSNode) => a.f - b.f
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

    // Get jump points in all directions
    const jumpResults = getJumpResults(grid, current, end, numRows, numCols);
    
    for (const jumpResult of jumpResults) {
      if (jumpResult.jumpPoint && !visited[jumpResult.jumpPoint.x][jumpResult.jumpPoint.y]) {
        const distance = Math.abs(jumpResult.jumpPoint.x - current.x) + Math.abs(jumpResult.jumpPoint.y - current.y);
        const tentativeG = gScore[current.x][current.y] + distance;
        
        if (tentativeG < gScore[jumpResult.jumpPoint.x][jumpResult.jumpPoint.y]) {
          gScore[jumpResult.jumpPoint.x][jumpResult.jumpPoint.y] = tentativeG;
          
          // Mark all nodes along the jump path as visited and set parent pointers
          markJumpPath(visited, parent, current, jumpResult, numRows, numCols);
          
          queue.add({
            x: jumpResult.jumpPoint.x,
            y: jumpResult.jumpPoint.y,
            g: tentativeG,
            f: tentativeG + manhattanDistance(jumpResult.jumpPoint, end) * HEURISTIC_MULTIPLIER
          });
        }
      }
    }
  }
}

function getJumpResults(
  grid: Grid,
  current: Point,
  end: Point,
  numRows: number,
  numCols: number
): JumpResult[] {
  const jumpResults: JumpResult[] = [];
  
  // Check all 4 directions
  for (const [dx, dy] of DIRECTIONS) {
    const jumpResult = jump(grid, current, dx, dy, end, numRows, numCols);
    jumpResults.push(jumpResult);
  }
  
  return jumpResults.filter(result => result.jumpPoint !== null);
}

function jump(
  grid: Grid,
  current: Point,
  dx: number,
  dy: number,
  end: Point,
  numRows: number,
  numCols: number
): JumpResult {
  const visitedNodes: Point[] = [];
  let currentPos = { x: current.x, y: current.y };
  
  while (true) {
    const nextX = currentPos.x + dx;
    const nextY = currentPos.y + dy;
    
    // Check bounds
    if (!isInBounds(nextX, nextY, numRows, numCols)) {
      return { jumpPoint: null, visitedNodes };
    }
    
    // Check if it's a wall
    if (isWall(grid, nextX, nextY)) {
      return { jumpPoint: null, visitedNodes };
    }
    
    // Add the next position to visited nodes
    visitedNodes.push({ x: nextX, y: nextY });
    currentPos = { x: nextX, y: nextY };
    
    // If we reached the goal, return it
    if (isEnd(nextX, nextY, end)) {
      return { jumpPoint: { x: nextX, y: nextY }, visitedNodes };
    }
    
    // Check for forced neighbors
    if (hasForcedNeighbor(grid, nextX, nextY, dx, dy, numRows, numCols)) {
      return { jumpPoint: { x: nextX, y: nextY }, visitedNodes };
    }
  }
}

function markJumpPath(
  visited: boolean[][],
  parent: (Point | null)[][],
  start: Point,
  jumpResult: JumpResult,
  numRows: number,
  numCols: number
) {
  if (!jumpResult.jumpPoint) return;
  
  // Mark all nodes along the jump path as visited
  for (const node of jumpResult.visitedNodes) {
    if (isInBounds(node.x, node.y, numRows, numCols)) {
      visited[node.x][node.y] = true;
    }
  }
  
  // Set parent pointers along the path
  let prevNode = start;
  for (const node of jumpResult.visitedNodes) {
    if (isInBounds(node.x, node.y, numRows, numCols)) {
      parent[node.x][node.y] = { x: prevNode.x, y: prevNode.y };
      prevNode = node;
    }
  }
  
  // Set parent pointer for the final jump point
  if (jumpResult.visitedNodes.length > 0) {
    const lastVisited = jumpResult.visitedNodes[jumpResult.visitedNodes.length - 1];
    parent[jumpResult.jumpPoint.x][jumpResult.jumpPoint.y] = { x: lastVisited.x, y: lastVisited.y };
  } else {
    parent[jumpResult.jumpPoint.x][jumpResult.jumpPoint.y] = { x: start.x, y: start.y };
  }
}

function hasForcedNeighbor(
  grid: Grid,
  x: number,
  y: number,
  dx: number,
  dy: number,
  numRows: number,
  numCols: number
): boolean {
  // Check perpendicular directions for forced neighbors
  const perpDirs = dx === 0 ? [[-1, 0], [1, 0]] : [[0, -1], [0, 1]];
  
  for (const [perpDx, perpDy] of perpDirs) {
    const neighborX = x + perpDx;
    const neighborY = y + perpDy;
    const oppositeX = x - perpDx;
    const oppositeY = y - perpDy;
    
    // Check if there's a wall behind us and a clear path to the side
    if (isInBounds(oppositeX, oppositeY, numRows, numCols) &&
        isWall(grid, oppositeX, oppositeY) &&
        isInBounds(neighborX, neighborY, numRows, numCols) &&
        !isWall(grid, neighborX, neighborY)) {
      return true;
    }
  }
  
  return false;
} 