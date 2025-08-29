import { format, formatDistanceToNow } from 'date-fns';
import { ExpenseWithConversions } from '../../types/expense.types';

interface ExpenseItemProps {
  expense: ExpenseWithConversions;
  showDate?: boolean;
  preferredCurrency?: 'THB' | 'USD';
}

export function ExpenseItem({ 
  expense, 
  showDate = true, 
  preferredCurrency = 'THB' 
}: ExpenseItemProps) {
  // Format amount based on preferred currency
  const formatAmount = () => {
    const amount = preferredCurrency === 'THB' ? expense.amount_thb : expense.amount_usd;
    const currency = preferredCurrency;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'THB' ? 0 : 2,
      maximumFractionDigits: currency === 'THB' ? 0 : 2,
    }).format(amount);
  };

  // Format time display
  const formatTime = () => {
    const date = new Date(expense.user_local_datetime);
    
    if (showDate) {
      return format(date, 'MMM d, HH:mm');
    } else {
      return format(date, 'HH:mm');
    }
  };

  // Get relative time for tooltip
  const getRelativeTime = () => {
    const date = new Date(expense.user_local_datetime);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* Left side: Item and optional details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {expense.item}
          </h3>
          {expense.group_name && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {expense.group_name}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <time 
            className="text-xs text-gray-500 dark:text-gray-400" 
            title={getRelativeTime()}
          >
            {formatTime()}
          </time>
          
          {expense.merchant && (
            <>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {expense.merchant}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right side: Amount */}
      <div className="flex flex-col items-end ml-4">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {formatAmount()}
        </span>
        
        {/* Show conversion if different from preferred currency */}
        {expense.currency !== preferredCurrency && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {expense.currency === 'THB' 
              ? `₿${expense.amount_thb.toLocaleString()}` 
              : `$${expense.amount_usd.toFixed(2)}`
            } {expense.currency}
          </span>
        )}
      </div>
    </div>
  );
}
