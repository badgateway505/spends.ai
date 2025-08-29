import { Dashboard } from '../pages/Dashboard';
import { AuthGuard } from '../auth/components/AuthGuard';
import './App.css';

function App() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}

export default App;
