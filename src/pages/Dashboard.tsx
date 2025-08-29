import { useMemo } from 'react';
import { ExpenseList } from '../expenses/components/management/ExpenseList';
import { useExpenseHistory } from '../expenses/hooks/useExpenseHistory';

export function Dashboard() {
  // Get today's date range for filtering
  const todayFilters = useMemo(() => {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    return {
      dateRange: {
        from: startOfDay,
        to: endOfDay,
      },
    };
  }, []);

  const { 
    expenses: todayExpenses, 
    loading: todayLoading, 
    error: todayError,
    refresh: refreshToday 
  } = useExpenseHistory({
    filters: todayFilters,
    limit: 50, // Show all expenses for today
  });

  // Calculate today's total
  const todayTotal = useMemo(() => {
    return todayExpenses.reduce((sum, expense) => sum + expense.amount_thb, 0);
  }, [todayExpenses]);

  const formatTotal = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            spends.ai
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Voice-powered expense tracking
          </p>
        </div>

        {/* Today's Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Today's Expenses
            </h2>
            <button
              onClick={refreshToday}
              disabled={todayLoading}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
            >
              {todayLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Total for today */}
          <div className="mb-6">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatTotal(todayTotal)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {todayExpenses.length} {todayExpenses.length === 1 ? 'expense' : 'expenses'} today
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 mb-6">
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              + Add Expense
            </button>
            <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              🎤 Voice Add
            </button>
          </div>
        </div>

        {/* Today's Expense List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Recent Expenses
          </h3>
          
          <ExpenseList
            expenses={todayExpenses}
            loading={todayLoading}
            error={todayError}
            preferredCurrency="THB"
            showDividers={false}
            emptyMessage="No expenses today. Start tracking your spending!"
          />

          {/* View All Link */}
          {todayExpenses.length > 0 && (
            <div className="mt-6 text-center">
              <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">
                View All Expenses →
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Development environment ready</p>
        </div>
      </div>
    </div>
  );
}
