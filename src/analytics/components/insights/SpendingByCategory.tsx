import { GroupBadge } from '../../../ui/components/data-display/GroupBadge';
import type { GroupIcon, GroupColor } from '../../../categories/types/category.types';

interface CategorySpending {
  group_id: string;
  group_name: string;
  group_icon?: GroupIcon;
  group_color?: GroupColor;
  total_amount_thb: number;
  total_amount_usd: number;
  percentage: number;
  transaction_count: number;
}

interface SpendingByCategoryProps {
  categoryData: CategorySpending[];
  preferredCurrency?: 'THB' | 'USD';
  loading?: boolean;
  className?: string;
}

export function SpendingByCategory({ 
  categoryData, 
  preferredCurrency = 'THB',
  loading = false,
  className = '' 
}: SpendingByCategoryProps) {
  if (loading) {
    return (
      <div className={`card p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Spending by Category
        </h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!categoryData || categoryData.length === 0) {
    return (
      <div className={`card p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Spending by Category
        </h3>
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No category data available</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: 'THB' | 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100); // Convert from cents
  };

  const totalSpending = categoryData.reduce((sum, category) => {
    return sum + (preferredCurrency === 'THB' ? category.total_amount_thb : category.total_amount_usd);
  }, 0);

  return (
    <div className={`card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Spending by Category
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total: {formatCurrency(totalSpending, preferredCurrency)}
        </div>
      </div>

      <div className="space-y-4">
        {categoryData.map((category) => {
          const amount = preferredCurrency === 'THB' ? category.total_amount_thb : category.total_amount_usd;
          const percentage = totalSpending > 0 ? (amount / totalSpending) * 100 : 0;
          
          return (
            <div key={category.group_id} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <GroupBadge
                    name={category.group_name}
                    icon={category.group_icon}
                    color={category.group_color}
                    size="sm"
                    variant="filled"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {category.transaction_count} transaction{category.transaction_count !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(amount, preferredCurrency)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 group-hover:brightness-110 ${
                    category.group_color ? 
                      getProgressBarColor(category.group_color) : 
                      'bg-gray-400'
                  }`}
                  style={{ width: `${Math.max(percentage, 2)}%` }} // Minimum 2% for visibility
                />
              </div>
            </div>
          );
        })}
      </div>

      {categoryData.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
            View all categories →
          </button>
        </div>
      )}
    </div>
  );
}

// Helper function to get progress bar colors based on group color
function getProgressBarColor(color: GroupColor): string {
  const colorMap: Record<GroupColor, string> = {
    gray: 'bg-gray-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500', 
    amber: 'bg-amber-500',
    yellow: 'bg-yellow-500',
    lime: 'bg-lime-500',
    green: 'bg-green-500',
    emerald: 'bg-emerald-500',
    teal: 'bg-teal-500',
    cyan: 'bg-cyan-500',
    sky: 'bg-sky-500',
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    violet: 'bg-violet-500',
    purple: 'bg-purple-500',
    fuchsia: 'bg-fuchsia-500',
    pink: 'bg-pink-500',
    rose: 'bg-rose-500'
  };
  
  return colorMap[color] || 'bg-gray-500';
}
