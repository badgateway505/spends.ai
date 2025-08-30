import { format, formatDistanceToNow } from 'date-fns';
import type { ExpenseWithConversions } from '../../types/expense.types';

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
    <div className="card-hoverable p-4 group cursor-pointer transition-all duration-200 hover:scale-[1.01]">
      {/* Left side: Item and optional details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
            {expense.item}
          </h3>
          {expense.group_name && (
            <span className="badge-primary">
              {expense.group_name}
            </span>
          )}
          {expense.tag_name && (
            <span className="badge-secondary">
              {expense.tag_name}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <time 
            className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1" 
            title={getRelativeTime()}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime()}
          </time>
          
          {expense.merchant && (
            <>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {expense.merchant}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right side: Amount */}
      <div className="flex flex-col items-end ml-4">
        <span className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
          {formatAmount()}
        </span>
        
        {/* Show conversion if different from preferred currency */}
        {expense.currency !== preferredCurrency && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
