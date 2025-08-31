import { useState, useMemo } from 'react';
import { useAnalytics } from '../analytics/hooks/useAnalytics';
import { SpendingPieChart } from '../analytics/components/charts/SpendingPieChart';
import { SpendingSummaryComponent } from '../analytics/components/insights/SpendingSummary';
import { ThemeToggle } from '../ui/components/layout/ThemeToggle';
import { useAuth } from '../auth/hooks/useAuth';
import type { AnalyticsFilters } from '../analytics/types/analytics.types';

type TimePeriod = 'today' | '7days' | '30days' | '90days' | 'year';

export function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30days');
  const [preferredCurrency, setPreferredCurrency] = useState<'THB' | 'USD'>('THB');
  
  const { user, signOut } = useAuth();

  // Calculate date range based on selected period
  const analyticsFilters = useMemo((): AnalyticsFilters => {
    const now = new Date();
    let daysBack = 30;
    
    switch (selectedPeriod) {
      case 'today':
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        return {
          dateRange: { from: todayStart, to: now },
          includeArchived: false
        };
      case '7days':
        daysBack = 7;
        break;
      case '30days':
        daysBack = 30;
        break;
      case '90days':
        daysBack = 90;
        break;
      case 'year':
        daysBack = 365;
        break;
    }
    
    const fromDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    return {
      dateRange: { from: fromDate, to: now },
      includeArchived: false
    };
  }, [selectedPeriod]);

  const { 
    summary: analyticsSummary, 
    categoryStats, 
    loading: analyticsLoading,
    error: analyticsError
  } = useAnalytics(analyticsFilters);

  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: '7days', label: 'Last 7 days' },
    { value: '30days', label: 'Last 30 days' },
    { value: '90days', label: 'Last 90 days' },
    { value: 'year', label: 'Last year' }
  ] as const;

  if (analyticsError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 19C2.962 20.167 3.924 21 5.464 21z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Analytics Error</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{analyticsError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Spending insights and category breakdown
              </p>
              {user && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Signed in as {user.email}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  window.history.pushState({}, '', '/');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                title="Back to Dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <ThemeToggle />
              <button
                onClick={signOut}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                title="Sign out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="card p-6 mb-6 animate-slide-up">
          <div className="flex flex-wrap items-center gap-4">
            {/* Time Period Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Period:
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as TimePeriod)}
                className="input-field text-sm min-w-0"
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Currency:
              </label>
              <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value as 'THB' | 'USD')}
                className="input-field text-sm min-w-0"
              >
                <option value="THB">THB (฿)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Analytics Summary */}
        {analyticsSummary && (
          <div className="animate-slide-up mb-6" style={{ animationDelay: '100ms' }}>
            <SpendingSummaryComponent 
              summary={analyticsSummary}
              preferredCurrency={preferredCurrency}
              loading={analyticsLoading}
            />
          </div>
        )}

        {/* Category Breakdown */}
        {categoryStats.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            {/* Pie Chart */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Spending Distribution
              </h3>
              
              <SpendingPieChart
                data={categoryStats}
                preferredCurrency={preferredCurrency}
                size="lg"
                showLegend={false}
                showValues={false}
              />
            </div>

            {/* Detailed Category List */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Category Details
              </h3>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {categoryStats.map((category, index) => {
                  const colors = [
                    { bg: 'bg-blue-500', text: 'text-blue-600' },
                    { bg: 'bg-green-500', text: 'text-green-600' },
                    { bg: 'bg-orange-500', text: 'text-orange-600' },
                    { bg: 'bg-red-500', text: 'text-red-600' },
                    { bg: 'bg-purple-500', text: 'text-purple-600' },
                    { bg: 'bg-cyan-500', text: 'text-cyan-600' },
                    { bg: 'bg-lime-500', text: 'text-lime-600' },
                    { bg: 'bg-pink-500', text: 'text-pink-600' },
                    { bg: 'bg-indigo-500', text: 'text-indigo-600' },
                    { bg: 'bg-gray-500', text: 'text-gray-600' }
                  ];
                  
                  const colorSet = colors[index % colors.length];
                  const amount = preferredCurrency === 'THB' ? category.total_amount_thb : category.total_amount_usd;
                  
                  return (
                    <div key={category.group_id || `category-${index}`} className="border-l-4 pl-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-r-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800" style={{ borderLeftColor: colorSet.bg.replace('bg-', '#') }}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {category.group_name}
                        </h4>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: preferredCurrency,
                              minimumFractionDigits: 0,
                              maximumFractionDigits: preferredCurrency === 'THB' ? 0 : 2,
                            }).format(amount)}
                          </div>
                          <div className={`text-sm font-medium ${colorSet.text}`}>
                            {category.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>
                          {category.expense_count} {category.expense_count === 1 ? 'expense' : 'expenses'}
                        </span>
                        <span>
                          Avg: {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: preferredCurrency,
                            minimumFractionDigits: 0,
                            maximumFractionDigits: preferredCurrency === 'THB' ? 0 : 2,
                          }).format(amount / category.expense_count)}
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`${colorSet.bg} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${Math.min(category.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-12 text-center animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Data Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No expenses found for the selected period. Start tracking your spending to see analytics.
            </p>
            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="btn-primary"
            >
              Add Your First Expense
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Analytics powered by your spending data</p>
        </footer>
      </div>
    </div>
  );
}
