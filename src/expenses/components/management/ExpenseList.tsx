import { ExpenseItem } from './ExpenseItem';
import { ExpenseItemSkeleton } from '../../../ui/components/feedback/LoadingSkeleton';
import type { ExpenseWithConversions } from '../../types/expense.types';

interface ExpenseListProps {
  expenses: ExpenseWithConversions[];
  loading?: boolean;
  error?: string | null;
  preferredCurrency?: 'THB' | 'USD';
  showDividers?: boolean;
  emptyMessage?: string;
  onExpenseUpdated?: (updatedExpense: ExpenseWithConversions) => void;
  onExpenseDeleted?: (expenseId: string) => void;
}

export function ExpenseList({ 
  expenses, 
  loading = false, 
  error = null,
  preferredCurrency = 'THB',
  showDividers = true,
  emptyMessage = "No expenses found",
  onExpenseUpdated,
  onExpenseDeleted
}: ExpenseListProps) {
  
  if (loading) {
    return <ExpenseItemSkeleton count={3} />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="flex items-center justify-center mb-3">
          <svg className="w-8 h-8 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.19 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="text-danger-600 dark:text-danger-400 mb-2 font-medium">
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
      <div className="text-center py-12">
        <div className="flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div className="text-gray-600 dark:text-gray-400 mb-2 font-medium">
          {emptyMessage}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-500">
          Start tracking your expenses by adding your first one!
        </div>
      </div>
    );
  }

  // Group expenses by date for dividers
  const groupedExpenses = showDividers ? groupByDate(expenses) : [{ date: null, expenses }];

  return (
    <div className="space-y-3">
      {groupedExpenses.map((group) => (
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
                onExpenseUpdated={onExpenseUpdated}
                onExpenseDeleted={onExpenseDeleted}
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
