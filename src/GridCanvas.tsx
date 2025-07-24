import React from 'react';
import './GridCanvas.css';
import { breadthFirstSearchSteps } from './algorithms/BreadthFirstSearch';
import { depthFirstSearchSteps } from './algorithms/DepthFirstSearch';
import { greedySearchSteps } from './algorithms/GreedySearch';
import { AlgorithmRunner, AlgorithmStep } from './algorithms/AlgorithmRunner';
import { Point } from './algorithms/algorithmHelper';
import { aStarSteps } from './algorithms/AStar';

export enum GridCellType {
  EMPTY,
  WALL,
  START,
  END,
}
export type Grid = GridCellType[][];

interface GridCanvasProps {
  numRows: number;
  numCols: number;
}

interface GridCanvasState {
  grid: Grid;
  isDrawing: boolean;
  start: Point;
  end: Point;
  dragging: null | 'start' | 'end';
  visited?: boolean[][];
  currentStep?: Point;
  found?: boolean;
  runningAlgo: boolean;
  algoRunner?: AlgorithmRunner;
  isPlaying: boolean;
  path?: Point[];
  selectedAlgorithm: 'bfs' | 'dfs' | 'greedy' | 'astar';
  revealedPathIndices?: number;
}

class GridCanvas extends React.Component<GridCanvasProps, GridCanvasState> {
  timer: NodeJS.Timeout | null = null;
  pathRevealTimer: NodeJS.Timeout | null = null;

  // Algorithm descriptions for tooltip
  algorithmDescriptions: Record<string, string> = {
    bfs: 'Breadth First Search (BFS) explores all neighbors at the current depth before moving to the next level. It guarantees the shortest path in unweighted graphs.',
    dfs: 'Depth First Search (DFS) explores as far as possible along each branch before backtracking. It does not guarantee the shortest path but is useful for exhaustive searches.',
    greedy: 'Greedy Search (GS) explores the node that appears to be closest to the goal, without considering the total cost. It is faster than BFS but does not guarantee the shortest path.',
    astar: 'A* Search (A*) uses both the cost to reach a node and a heuristic estimate to the goal. It is efficient and guarantees the shortest path if the heuristic is admissible.'
  };

  constructor(props: GridCanvasProps) {
    super(props);
    this.state = {
      grid: this.createEmptyGrid(),
      isDrawing: false,
      start: {x: 0, y: 0},
      end: {x: props.numRows - 1, y: props.numCols - 1},
      dragging: null,
      runningAlgo: false,
      isPlaying: false,
      selectedAlgorithm: 'bfs',
    };
  }

  // --- Grid helpers ---
  createEmptyGrid(): Grid {
    const { numRows, numCols } = this.props;
    return Array.from({ length: numRows }, () => Array(numCols).fill(GridCellType.EMPTY));
  }

  getGrid(): Grid {
    return this.state.grid;
  }

  setGrid(newGrid: Grid) {
    this.setState({ grid: newGrid });
  }

  // --- Mouse and drawing handlers ---
  handleCellMouseDown = (row: number, col: number) => {
    const { start, end, runningAlgo, isPlaying } = this.state;
    if (runningAlgo || isPlaying) return;
    if (row === start.x && col === start.y) {
      this.setState({ dragging: 'start' });
      return;
    }
    if (row === end.x && col === end.y) {
      this.setState({ dragging: 'end' });
      return;
    }
    this.setState(prev => {
      const newGrid = prev.grid.map(arr => [...arr]);
      newGrid[row][col] = newGrid[row][col] === GridCellType.WALL ? GridCellType.EMPTY : GridCellType.WALL;
      return { grid: newGrid, isDrawing: true };
    });
  };

  handleCellMouseEnter = (row: number, col: number) => {
    const { dragging, start, end, runningAlgo, isPlaying } = this.state;
    if (runningAlgo || isPlaying) return;
    if (dragging === 'start') {
      if ((row !== end.x || col !== end.y)) {
        this.setState({ start: {x: row, y: col} });
      }
      return;
    }
    if (dragging === 'end') {
      if ((row !== start.x || col !== start.y)) {
        this.setState({ end: {x: row, y: col} });
      }
      return;
    }
    if (!this.state.isDrawing) return;
    this.setState(prev => {
      const newGrid = prev.grid.map(arr => [...arr]);
      if (newGrid[row][col] !== GridCellType.WALL) {
        newGrid[row][col] = GridCellType.WALL;
      }
      return { grid: newGrid };
    });
  };

  handleMouseUp = () => {
    this.setState({ isDrawing: false, dragging: null });
  };

  handleClear = () => {
    this.setState({ grid: this.createEmptyGrid() });
  };

  // --- Algorithm controls ---
  handleAlgorithmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({ selectedAlgorithm: e.target.value as 'bfs' | 'dfs' | 'greedy' | 'astar' });
  };

  handleAlgoStart = () => {
    const { grid, start, end, selectedAlgorithm } = this.state;
    const algoRunner = new AlgorithmRunner(
      selectedAlgorithm === 'bfs' ? breadthFirstSearchSteps
      : selectedAlgorithm === 'dfs' ? depthFirstSearchSteps
      : selectedAlgorithm === 'greedy' ? greedySearchSteps
      : aStarSteps,
      grid,
      start,
      end
    );
    const firstStep = algoRunner.start();
    this.setAlgoState(algoRunner, firstStep, true, false);
    this.handlePlayPause();
  };

  handlePlayPause = () => {
    if (this.state.isPlaying) {
      this.stopAutoStep();
    } else {
      this.setState({ isPlaying: true }, this.autoStep);
    }
  };

  autoStep = () => {
    if (!this.state.isPlaying || !this.state.runningAlgo) return;
    this.handleAlgoNext();
    this.timer = setTimeout(this.autoStep, 50);
  };

  stopAutoStep = () => {
    if (this.timer) clearTimeout(this.timer);
    this.setState({ isPlaying: false });
  };

  handleAlgoNext = () => {
    const { algoRunner, isPlaying } = this.state;
    if (!algoRunner) return;
    const step = algoRunner.next();
    this.setAlgoState(algoRunner, step, true, isPlaying);
  };

  setAlgoState(
    algoRunner: AlgorithmRunner,
    step: AlgorithmStep | undefined,
    running: boolean,
    isPlaying?: boolean
  ) {
    if (!step) {
      this.setState({ runningAlgo: false, isPlaying: false, path: undefined, revealedPathIndices: undefined });
      this.stopAutoStep();
      return;
    }
    let path: Point[] | undefined = undefined;
    if (step.found) {
      path = algoRunner.getPath();
    }
    this.setState(
      {
        algoRunner,
        visited: step.visited.map((row: boolean[]) => [...row]),
        currentStep: step.current,
        found: step.found,
        runningAlgo: running && !step.found,
        isPlaying: !!isPlaying && !step.found,
        path,
        revealedPathIndices: step.found ? 0 : undefined,
      },
      () => {
        if (step.found) {
          this.stopAutoStep();
          this.animatePathReveal();
        }
      }
    );
  }

  // --- Path reveal animation ---
  animatePathReveal = () => {
    if (!this.state.path) return;
    if (this.state.revealedPathIndices === undefined) return;
    if (this.state.revealedPathIndices >= this.state.path.length) return;
    this.pathRevealTimer = setTimeout(() => {
      this.setState(prev => ({
        revealedPathIndices: prev.revealedPathIndices !== undefined ? prev.revealedPathIndices + 1 : undefined,
      }), this.animatePathReveal);
    }, 40);
  };

  handleAlgoReset = () => {
    this.stopAutoStep();
    if (this.pathRevealTimer) clearTimeout(this.pathRevealTimer);
    this.setState({
      algoRunner: undefined,
      visited: undefined,
      currentStep: undefined,
      found: false,
      runningAlgo: false,
      isPlaying: false,
      path: undefined,
      revealedPathIndices: undefined,
    });
  };

  // --- Render ---
  render() {
    const {
      grid, start, end, visited, currentStep, runningAlgo, found, isPlaying, path, selectedAlgorithm, revealedPathIndices
    } = this.state;
    return (
      <div onMouseUp={this.handleMouseUp}>
        <div className="visualizer-card">
          <div className="algo-row-center">
            <div className="algo-select-group">
              <select
                id="algo-select"
                value={selectedAlgorithm}
                onChange={this.handleAlgorithmChange}
                className="algo-select"
              >
                <option value="bfs">Breadth First Search</option>
                <option value="dfs">Depth First Search</option>
                <option value="greedy">Greedy Search</option>
                <option value="astar">A* Search</option>
              </select>
            </div>
            <div className="explanation-btn-wrapper">
              <div className="explanation-btn" tabIndex={0}>
                Explanation
                <div className="explanation-tooltip">
                  <div className="algo-desc-title">
                    {selectedAlgorithm === 'bfs' ? 'Breadth First Search' : selectedAlgorithm === 'dfs' ? 'Depth First Search' : selectedAlgorithm === 'greedy' ? 'Greedy Search' : 'A* Search'}
                  </div>
                  <div className="algo-desc-text">{this.algorithmDescriptions[selectedAlgorithm]}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="controls-row">
            <button className="modern-btn" onClick={this.handleAlgoStart} disabled={runningAlgo || isPlaying}>Start Search</button>
            <button className="modern-btn" onClick={this.handleAlgoNext} disabled={!runningAlgo}>Next Step</button>
            <button className="modern-btn" onClick={this.handlePlayPause} disabled={!runningAlgo}>{isPlaying ? 'Pause' : 'Play'}</button>
            <button className="modern-btn" onClick={this.handleAlgoReset}>Reset Search</button>
            <button className="clear-btn" onClick={this.handleClear}>Clear</button>
          </div>
          <hr className="divider" />
          <div className="grid">
            {grid.map((row, rowIdx) => (
              <div className="grid-row" key={rowIdx}>
                {row.map((cell, colIdx) => {
                  let cellClass = 'grid-cell';
                  if (rowIdx === start.x && colIdx === start.y) cellClass += ' start';
                  else if (rowIdx === end.x && colIdx === end.y) cellClass += ' end';
                  else if (cell === GridCellType.WALL) cellClass += ' filled';
                  else if (
                    path &&
                    path.some((p, i) => i < (revealedPathIndices ?? 0) && p.x === rowIdx && p.y === colIdx)
                  ) cellClass += ' path';
                  else if (visited && visited[rowIdx][colIdx]) cellClass += ' visited';
                  if (currentStep && rowIdx === currentStep.x && colIdx === currentStep.y) cellClass += ' current';
                  return (
                    <div
                      key={colIdx}
                      className={cellClass}
                      onMouseDown={() => this.handleCellMouseDown(rowIdx, colIdx)}
                      onMouseEnter={() => this.handleCellMouseEnter(rowIdx, colIdx)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          {found && <div className="path-found">Path found!</div>}
        </div>
      </div>
    );
  }
}

export default GridCanvas; 