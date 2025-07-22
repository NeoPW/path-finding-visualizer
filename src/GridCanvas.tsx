import React from 'react';
import './GridCanvas.css';
import { breadthFirstSearchSteps, Point } from './algorithms/BreadthFirstSearch';
import { depthFirstSearchSteps } from './algorithms/DepthFirstSearch';
import { AlgorithmRunner, AlgorithmStep } from './algorithms/AlgorithmRunner';

export enum GridCellType {
  EMPTY,
  WALL,
  START,
  END,
  // Add more as needed (e.g., VISITED, PATH)
}
export type Grid = GridCellType[][];

interface GridCanvasProps {
  numRows: number;
  numCols: number;
}

interface GridCanvasState {
  grid: Grid;
  isDrawing: boolean;
  start: [number, number];
  end: [number, number];
  dragging: null | 'start' | 'end';
  visited?: boolean[][];
  currentStep?: Point;
  found?: boolean;
  runningAlgo: boolean;
  algoRunner?: AlgorithmRunner;
  isPlaying: boolean;
  path?: Point[];
  selectedAlgorithm: 'bfs' | 'dfs';
  revealedPathIndices?: number;
}

class GridCanvas extends React.Component<GridCanvasProps, GridCanvasState> {
  timer: NodeJS.Timeout | null = null;
  pathRevealTimer: NodeJS.Timeout | null = null;

  constructor(props: GridCanvasProps) {
    super(props);
    this.state = {
      grid: this.createEmptyGrid(),
      isDrawing: false,
      start: [0, 0],
      end: [props.numRows - 1, props.numCols - 1],
      dragging: null,
      runningAlgo: false,
      isPlaying: false,
      selectedAlgorithm: 'bfs',
    };
  }

  createEmptyGrid(): Grid {
    const { numRows, numCols } = this.props;
    return Array.from({ length: numRows }, () => Array(numCols).fill(GridCellType.EMPTY));
  }

  handleCellMouseDown = (row: number, col: number) => {
    const { start, end, runningAlgo, isPlaying } = this.state;
    if (runningAlgo || isPlaying) return;
    if (row === start[0] && col === start[1]) {
      this.setState({ dragging: 'start' });
      return;
    }
    if (row === end[0] && col === end[1]) {
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
      if ((row !== end[0] || col !== end[1])) {
        this.setState({ start: [row, col] });
      }
      return;
    }
    if (dragging === 'end') {
      if ((row !== start[0] || col !== start[1])) {
        this.setState({ end: [row, col] });
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

  handleAlgorithmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({ selectedAlgorithm: e.target.value as 'bfs' | 'dfs' });
  };

  handleAlgoStart = () => {
    const { grid, start, end, selectedAlgorithm } = this.state;
    let algoRunner: AlgorithmRunner;
    if (selectedAlgorithm === 'bfs') {
      algoRunner = new AlgorithmRunner(breadthFirstSearchSteps, grid, start, end);
    } else {
      algoRunner = new AlgorithmRunner(depthFirstSearchSteps, grid, start, end);
    }
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

  setAlgoState(algoRunner: AlgorithmRunner, step: AlgorithmStep | undefined, running: boolean, isPlaying?: boolean) {
    if (!step) {
      this.setState({ runningAlgo: false, isPlaying: false, path: undefined, revealedPathIndices: undefined });
      this.stopAutoStep();
      return;
    }
    let path: Point[] | undefined = undefined;
    if (step.found) {
      path = algoRunner.getPath();
    }
    this.setState({
      algoRunner,
      visited: step.visited.map((row: boolean[]) => [...row]),
      currentStep: step.current,
      found: step.found,
      runningAlgo: running && !step.found,
      isPlaying: !!isPlaying && !step.found,
      path,
      revealedPathIndices: step.found ? 0 : undefined,
    }, () => {
      if (step.found) {
        this.stopAutoStep();
        this.animatePathReveal();
      }
    });
  }

  animatePathReveal = () => {
    if (!this.state.path) return;
    if (this.state.revealedPathIndices === undefined) return;
    if (this.state.revealedPathIndices >= this.state.path.length) return;
    this.pathRevealTimer = setTimeout(() => {
      this.setState(prev => ({
        revealedPathIndices: prev.revealedPathIndices !== undefined ? prev.revealedPathIndices + 1 : undefined
      }), this.animatePathReveal);
    }, 40);
  };

  handleAlgoReset = () => {
    this.stopAutoStep();
    if (this.pathRevealTimer) clearTimeout(this.pathRevealTimer);
    this.setState({ algoRunner: undefined, visited: undefined, currentStep: undefined, found: false, runningAlgo: false, isPlaying: false, path: undefined, revealedPathIndices: undefined });
  };

  getGrid(): Grid {
    return this.state.grid;
  }

  setGrid(newGrid: Grid) {
    this.setState({ grid: newGrid });
  }

  render() {
    const { grid, start, end, visited, currentStep, runningAlgo, found, isPlaying, path, selectedAlgorithm, revealedPathIndices } = this.state;
    return (
      <div onMouseUp={this.handleMouseUp}>
        <div className="visualizer-card">
          <div className="controls-row">
            <label htmlFor="algo-select" className="algo-label">Algorithm: </label>
            <select id="algo-select" value={selectedAlgorithm} onChange={this.handleAlgorithmChange} className="algo-select">
              <option value="bfs">Breadth First Search</option>
              <option value="dfs">Depth First Search</option>
            </select>
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
                  if (rowIdx === start[0] && colIdx === start[1]) cellClass += ' start';
                  else if (rowIdx === end[0] && colIdx === end[1]) cellClass += ' end';
                  else if (cell === GridCellType.WALL) cellClass += ' filled';
                  // Animate path reveal
                  else if (
                    path &&
                    path.some((p, i) => i < (revealedPathIndices ?? 0) && p[0] === rowIdx && p[1] === colIdx)
                  ) cellClass += ' path';
                  else if (visited && visited[rowIdx][colIdx]) cellClass += ' visited';
                  if (currentStep && rowIdx === currentStep[0] && colIdx === currentStep[1]) cellClass += ' current';
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