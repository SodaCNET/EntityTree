import React from 'react';
import Tree from './Tree';
import data from './data.json';

function App() {
  return (
    <div className="App">
      <Tree data={data} />
    </div>
  );
}

export default App;
