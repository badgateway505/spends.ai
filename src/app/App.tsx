import { Dashboard } from '../pages/Dashboard';
import { AuthGuard } from '../auth/components/AuthGuard';
import { ErrorBoundary } from '../ui/components/feedback/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthGuard>
        <Dashboard />
      </AuthGuard>
    </ErrorBoundary>
  );
}

export default App;
