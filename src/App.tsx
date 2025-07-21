import React from 'react';
import './App.css';
import GridCanvas from './GridCanvas';

const NUM_ROWS = 20;
const NUM_COLS = 30;

function App() {
  return (
    <div className="App">
      <h1>Path Finding Visualizer</h1>
      <GridCanvas numRows={NUM_ROWS} numCols={NUM_COLS} />
    </div>
  );
}

export default App;
