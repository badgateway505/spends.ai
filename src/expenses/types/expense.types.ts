import { Database } from '../../../supabase/types/database.types';

// Re-export database types for convenience
export type Expense = Database['public']['Tables']['spends']['Row'];
export type ExpenseInsert = Database['public']['Tables']['spends']['Insert'];
export type ExpenseUpdate = Database['public']['Tables']['spends']['Update'];
export type ExpenseWithConversions = Database['public']['Views']['spends_with_conversions']['Row'];

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
