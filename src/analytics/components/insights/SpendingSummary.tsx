import type { SpendingSummary } from '../../types/analytics.types';

interface SpendingSummaryProps {
  summary: SpendingSummary;
  preferredCurrency?: 'THB' | 'USD';
  loading?: boolean;
}

export function SpendingSummaryComponent({ 
  summary, 
  preferredCurrency = 'THB',
  loading = false 
}: SpendingSummaryProps) {
  
  const formatAmount = (amount: number) => {
    const currency = preferredCurrency === 'THB' ? 'THB' : 'USD';
    const locale = 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: preferredCurrency === 'THB' ? 0 : 2,
    }).format(amount);
  };

  const formatDateRange = (from: Date, to: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = to.toDateString() === today.toDateString();
    const isYesterday = to.toDateString() === yesterday.toDateString();
    
    if (isToday && from.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    if (isYesterday && from.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 7 && isToday) {
      return `Last ${daysDiff} days`;
    }
    
    if (daysDiff <= 30 && isToday) {
      return `Last ${daysDiff} days`;
    }
    
    return `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`;
  };

  const totalAmount = preferredCurrency === 'THB' ? summary.total_amount_thb : summary.total_amount_usd;
  const averagePerExpense = summary.total_expenses > 0 ? totalAmount / summary.total_expenses : 0;
  const topCategory = summary.category_breakdown.length > 0 ? summary.category_breakdown[0] : null;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Spending Overview
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {formatDateRange(summary.date_range.from, summary.date_range.to)}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Spending */}
        <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Total Spending
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatAmount(totalAmount)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {summary.total_expenses} {summary.total_expenses === 1 ? 'expense' : 'expenses'}
              </div>
            </div>
          </div>
        </div>

        {/* Average per Expense */}
        <div className="card p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                Average per Expense
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatAmount(averagePerExpense)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Per transaction
              </div>
            </div>
          </div>
        </div>

        {/* Top Category */}
        <div className="card p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                Top Category
              </div>
              {topCategory ? (
                <>
                  <div className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    {topCategory.group_name}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {topCategory.percentage.toFixed(1)}% of spending
                  </div>
                </>
              ) : (
                <>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    No categories
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Start categorizing expenses
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Category Breakdown */}
      {summary.category_breakdown.length > 0 && (
        <div className="card p-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Top Spending Categories
          </h4>
          
          <div className="space-y-3">
            {summary.category_breakdown.slice(0, 5).map((category, index) => {
              const amount = preferredCurrency === 'THB' ? category.total_amount_thb : category.total_amount_usd;
              
              return (
                <div key={category.group_id || `category-${index}`} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.group_name}
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatAmount(amount)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {category.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(category.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {category.expense_count} {category.expense_count === 1 ? 'expense' : 'expenses'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
