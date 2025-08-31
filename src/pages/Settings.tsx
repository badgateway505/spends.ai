import { useAuth } from '../auth/hooks/useAuth';
import { CurrencySettings } from '../currency/components/CurrencySettings';
import { ThemeToggle } from '../ui/components/layout/ThemeToggle';
import { ToastContainer } from '../ui/components/feedback/Toast';

export function Settings() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Settings
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Manage your account preferences and application settings
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div className="space-y-8">
          {/* User Info Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Account Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Email:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.email}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">User ID:</span>
                <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                  {user?.id?.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>

          {/* Currency Settings Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <CurrencySettings />
          </div>

          {/* Account Actions Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Account Actions
            </h3>
            <div className="space-y-4">
              <button
                onClick={handleSignOut}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Back */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              window.history.pushState({}, '', '/');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
