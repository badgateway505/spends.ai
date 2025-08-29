import { ExpenseItem } from './ExpenseItem';
import { ExpenseWithConversions } from '../../types/expense.types';

interface ExpenseListProps {
  expenses: ExpenseWithConversions[];
  loading?: boolean;
  error?: string | null;
  preferredCurrency?: 'THB' | 'USD';
  showDividers?: boolean;
  emptyMessage?: string;
}

export function ExpenseList({ 
  expenses, 
  loading = false, 
  error = null,
  preferredCurrency = 'THB',
  showDividers = true,
  emptyMessage = "No expenses found"
}: ExpenseListProps) {
  
  if (loading) {
    return (
      <div className="space-y-3">
        {/* Loading skeleton */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 dark:text-red-400 mb-2">
          Error loading expenses
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {error}
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400 mb-2">
          {emptyMessage}
        </div>
        <div className="text-sm text-gray-400 dark:text-gray-500">
          Start tracking your expenses by adding your first one!
        </div>
      </div>
    );
  }

  // Group expenses by date for dividers
  const groupedExpenses = showDividers ? groupByDate(expenses) : [{ date: null, expenses }];

  return (
    <div className="space-y-3">
      {groupedExpenses.map((group, groupIndex) => (
        <div key={group.date || 'no-date'}>
          {group.date && (
            <div className="flex items-center gap-4 mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDateDivider(group.date)}
              </h3>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {getDayTotal(group.expenses, preferredCurrency)}
              </span>
            </div>
          )}
          
          <div className="space-y-2">
            {group.expenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                preferredCurrency={preferredCurrency}
                showDate={!showDividers}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper functions
function groupByDate(expenses: ExpenseWithConversions[]) {
  const groups: { date: string; expenses: ExpenseWithConversions[] }[] = [];
  
  expenses.forEach((expense) => {
    const date = new Date(expense.user_local_datetime).toDateString();
    let group = groups.find(g => g.date === date);
    
    if (!group) {
      group = { date, expenses: [] };
      groups.push(group);
    }
    
    group.expenses.push(expense);
  });
  
  return groups;
}

function formatDateDivider(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

function getDayTotal(expenses: ExpenseWithConversions[], preferredCurrency: 'THB' | 'USD'): string {
  const total = expenses.reduce((sum, expense) => {
    return sum + (preferredCurrency === 'THB' ? expense.amount_thb : expense.amount_usd);
  }, 0);
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: preferredCurrency,
    minimumFractionDigits: preferredCurrency === 'THB' ? 0 : 2,
    maximumFractionDigits: preferredCurrency === 'THB' ? 0 : 2,
  }).format(total);
}
