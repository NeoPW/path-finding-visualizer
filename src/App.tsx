import React from 'react';
import './App.css';
import GridCanvas from './GridCanvas';

const NUM_ROWS = 20;
const NUM_COLS = 30;

function App() {
  return (
    <div className="App">
      <h1 className="main-title">Pathfinding Visualizer</h1>
      <GridCanvas numRows={20} numCols={40} />
    </div>
  );
}

export default App;
