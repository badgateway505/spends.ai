import { useMemo } from 'react';
import { ExpenseList } from '../expenses/components/management/ExpenseList';
import { useExpenseHistory } from '../expenses/hooks/useExpenseHistory.mock';
import { ThemeToggle } from '../ui/components/layout/ThemeToggle';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-balance">
                spends.ai
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Voice-powered expense tracking
              </p>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Today's Summary */}
        <div className="card-dashboard p-6 mb-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Today's Expenses
            </h2>
            <button
              onClick={refreshToday}
              disabled={todayLoading}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50 transition-colors duration-200 font-medium"
            >
              {todayLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </span>
              ) : (
                'Refresh'
              )}
            </button>
          </div>

          {/* Total for today */}
          <div className="mb-6">
            <div className="text-4xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text">
              {formatTotal(todayTotal)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {todayExpenses.length} {todayExpenses.length === 1 ? 'expense' : 'expenses'} today
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 mb-6">
            <button className="btn-primary flex-1 flex items-center justify-center gap-2 transition-transform duration-200 hover:scale-105">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Expense
            </button>
            <button className="btn-secondary flex-1 flex items-center justify-center gap-2 transition-transform duration-200 hover:scale-105">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Voice Add
            </button>
          </div>
        </div>

        {/* Today's Expense List */}
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
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
              <button className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 text-sm font-medium transition-colors duration-200 flex items-center gap-1 mx-auto group">
                View All Expenses
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p className="flex items-center justify-center gap-1">
            <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse-subtle"></span>
            Development environment ready
          </p>
        </footer>
      </div>
    </div>
  );
}
