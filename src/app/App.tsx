import { useState, useEffect } from 'react';
import { Dashboard } from '../pages/Dashboard';
import { Settings } from '../pages/Settings';
import { AuthGuard } from '../auth/components/AuthGuard';
import { ErrorBoundary } from '../ui/components/feedback/ErrorBoundary';
import './App.css';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Simple routing based on pathname
  const getCurrentPage = () => {
    switch (currentPath) {
      case '/settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ErrorBoundary>
      <AuthGuard>
        {getCurrentPage()}
      </AuthGuard>
    </ErrorBoundary>
  );
}

export default App;
