// Expense types based on database schema
export interface Expense {
  id: string;
  user_id: string;
  item: string;
  amount: number;
  currency: 'THB' | 'USD';
  merchant: string | null;
  group_id: string | null;
  tag_id: string | null;
  created_at: string;
  user_local_datetime: string;
  fx_rate_date: string;
  archived: boolean;
  archived_at: string | null;
}

export interface ExpenseWithConversions extends Expense {
  amount_thb: number;
  amount_usd: number;
  group_name: string | null;
  tag_name: string | null;
  thb_per_usd: number;
  usd_per_thb: number;
}

// Additional frontend types
export interface ExpenseDisplay extends ExpenseWithConversions {
  // Computed fields for display
  formattedAmount: string;
  formattedTime: string;
  relativeTime: string;
}

export interface NewExpenseForm {
  item: string;
  amount: string; // String for form input, converted to number for storage
  currency: 'THB' | 'USD';
  merchant?: string;
  group_id?: string;
  tag_id?: string;
}

export interface ExpenseFilters {
  dateRange?: {
    from: Date;
    to: Date;
  };
  groupIds?: string[];
  tagIds?: string[];
  currencies?: ('THB' | 'USD')[];
  searchQuery?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface ExpenseListState {
  expenses: ExpenseWithConversions[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  cursor?: string;
}
