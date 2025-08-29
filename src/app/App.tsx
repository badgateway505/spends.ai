import { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>spends.ai</h1>
        <p>Voice-powered expense tracking PWA</p>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>
            Edit <code>src/app/App.tsx</code> and save to test HMR
          </p>
        </div>
        <p className="read-the-docs">Development environment ready</p>
      </header>
    </div>
  );
}

export default App;
