import { Grid } from '../GridCanvas';
import { Point } from './BreadthFirstSearch';

export interface AlgorithmStep {
  current: Point;
  visited: boolean[][];
  parent: (Point | null)[][];
  found: boolean;
}

export class AlgorithmRunner {
  private algoGen: Generator<AlgorithmStep, void, unknown> | undefined;
  private lastStep: AlgorithmStep | undefined;
  private lastParent: (Point | null)[][] | undefined;
  private grid: Grid;
  private startPoint: Point;
  private endPoint: Point;
  private algorithm: (grid: Grid, start: Point, end: Point) => Generator<AlgorithmStep, void, unknown>;

  constructor(
    algorithm: (grid: Grid, start: Point, end: Point) => Generator<AlgorithmStep, void, unknown>,
    grid: Grid,
    start: Point,
    end: Point
  ) {
    this.algorithm = algorithm;
    this.grid = grid;
    this.startPoint = start;
    this.endPoint = end;
  }

  start() {
    this.algoGen = this.algorithm(this.grid, this.startPoint, this.endPoint);
    this.lastStep = undefined;
    this.lastParent = undefined;
    return this.next();
  }

  next() {
    if (!this.algoGen) return undefined;
    const result = this.algoGen.next();
    if (result.done) return undefined;
    this.lastStep = result.value;
    this.lastParent = result.value.parent;
    return result.value;
  }

  reset() {
    this.algoGen = undefined;
    this.lastStep = undefined;
    this.lastParent = undefined;
  }

  getCurrentStep() {
    return this.lastStep;
  }

  getPath(): Point[] | undefined {
    if (!this.lastStep || !this.lastStep.found || !this.lastParent) return undefined;
    const path: Point[] = [];
    let p: Point | null = this.endPoint;
    while (p && this.lastParent[p[0]][p[1]]) {
      path.push(p);
      p = this.lastParent[p[0]][p[1]];
    }
    path.push(this.startPoint);
    return path.reverse();
  }
} 