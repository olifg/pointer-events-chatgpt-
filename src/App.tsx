import React from 'react';
import './App.css';

import { PointerCanvas } from './CanvasV2';

function App() {

  return (
    <div className="App"  >
      <PointerCanvas width={window.innerWidth} height={window.innerHeight} />
    </div>
  );
}

export default App;
