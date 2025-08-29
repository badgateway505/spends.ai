import { supabase } from '../../lib/supabase';
import type { NewExpenseForm } from '../types/expense.types';

// Temporary types until database is properly set up
interface ExpenseRow {
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

export interface CreateExpenseRequest {
  item: string;
  amount: number;
  currency: 'THB' | 'USD';
  merchant?: string;
  group_id?: string;
  tag_id?: string;
  user_local_datetime?: string;
}



class ExpenseServiceClass {
  /**
   * Create a new expense
   */
  async createExpense(formData: NewExpenseForm): Promise<ExpenseRow> {
    try {
      // Get current user or mock user for testing
      let userId: string;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        userId = user.id;
      } else {
        // Check for mock admin user
        const mockUserData = localStorage.getItem('mock-admin-user');
        if (mockUserData) {
          const mockUser = JSON.parse(mockUserData);
          userId = mockUser.id;
        } else {
          throw new ExpenseServiceError('AUTH_ERROR', 'User not authenticated');
        }
      }

      // Convert form data to database format
      const amountFloat = parseFloat(formData.amount);
      if (isNaN(amountFloat) || amountFloat <= 0) {
        throw new ExpenseServiceError('VALIDATION_ERROR', 'Invalid amount');
      }

      // Convert amount to integer (cents/satang) for storage
      const amountInteger = Math.round(amountFloat * 100);

      // Get current FX rate date (today)
      const today = new Date();
      const fxRateDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

      const expenseData = {
        user_id: userId,
        item: formData.item.trim(),
        amount: amountInteger,
        currency: formData.currency,
        merchant: formData.merchant?.trim() || null,
        group_id: formData.group_id || null,
        tag_id: formData.tag_id || null,
        user_local_datetime: new Date().toISOString(),
        fx_rate_date: fxRateDate,
        archived: false,
      };

      // Insert expense into database
      const { data, error } = await (supabase as any)
        .from('spends')
        .insert(expenseData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new ExpenseServiceError(
          'DATABASE_ERROR', 
          'Failed to save expense',
          error
        );
      }

      return data;

    } catch (error) {
      if (error instanceof ExpenseServiceError) {
        throw error;
      }
      
      console.error('Unexpected error creating expense:', error);
      throw new ExpenseServiceError(
        'UNKNOWN_ERROR',
        'An unexpected error occurred while creating the expense'
      );
    }
  }

  /**
   * Get user's expenses with optional filtering
   */
  async getExpenses(options: {
    limit?: number;
    offset?: number;
    dateFrom?: Date;
    dateTo?: Date;
    currency?: 'THB' | 'USD';
    archived?: boolean;
  } = {}): Promise<ExpenseRow[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new ExpenseServiceError('AUTH_ERROR', 'User not authenticated');
      }

      let query = (supabase as any)
        .from('spends')
        .select('*')
        .eq('user_id', user.id)
        .eq('archived', options.archived ?? false)
        .order('created_at', { ascending: false });

      // Apply filters
      if (options.dateFrom) {
        query = query.gte('user_local_datetime', options.dateFrom.toISOString());
      }
      
      if (options.dateTo) {
        query = query.lte('user_local_datetime', options.dateTo.toISOString());
      }

      if (options.currency) {
        query = query.eq('currency', options.currency);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw new ExpenseServiceError(
          'DATABASE_ERROR',
          'Failed to fetch expenses',
          error
        );
      }

      return data || [];

    } catch (error) {
      if (error instanceof ExpenseServiceError) {
        throw error;
      }
      
      console.error('Unexpected error fetching expenses:', error);
      throw new ExpenseServiceError(
        'UNKNOWN_ERROR',
        'An unexpected error occurred while fetching expenses'
      );
    }
  }

  /**
   * Update an existing expense
   */
  async updateExpense(id: string, updates: Partial<CreateExpenseRequest>): Promise<ExpenseRow> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new ExpenseServiceError('AUTH_ERROR', 'User not authenticated');
      }

      const updateData: any = {};

      if (updates.item !== undefined) {
        updateData.item = updates.item.trim();
      }
      
      if (updates.amount !== undefined) {
        if (isNaN(updates.amount) || updates.amount <= 0) {
          throw new ExpenseServiceError('VALIDATION_ERROR', 'Invalid amount');
        }
        // Convert to integer (cents/satang) for storage
        updateData.amount = Math.round(updates.amount * 100);
      }

      if (updates.currency !== undefined) {
        updateData.currency = updates.currency;
      }

      if (updates.merchant !== undefined) {
        updateData.merchant = updates.merchant?.trim() || null;
      }

      if (updates.group_id !== undefined) {
        updateData.group_id = updates.group_id || null;
      }

      if (updates.tag_id !== undefined) {
        updateData.tag_id = updates.tag_id || null;
      }

      const { data, error } = await (supabase as any)
        .from('spends')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user can only update their own expenses
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new ExpenseServiceError(
          'DATABASE_ERROR',
          'Failed to update expense',
          error
        );
      }

      return data;

    } catch (error) {
      if (error instanceof ExpenseServiceError) {
        throw error;
      }
      
      console.error('Unexpected error updating expense:', error);
      throw new ExpenseServiceError(
        'UNKNOWN_ERROR',
        'An unexpected error occurred while updating the expense'
      );
    }
  }

  /**
   * Delete an expense (mark as archived)
   */
  async deleteExpense(id: string): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new ExpenseServiceError('AUTH_ERROR', 'User not authenticated');
      }

      const { error } = await (supabase as any)
        .from('spends')
        .update({ 
          archived: true, 
          archived_at: new Date().toISOString() 
        })
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user can only delete their own expenses

      if (error) {
        console.error('Supabase error:', error);
        throw new ExpenseServiceError(
          'DATABASE_ERROR',
          'Failed to delete expense',
          error
        );
      }

    } catch (error) {
      if (error instanceof ExpenseServiceError) {
        throw error;
      }
      
      console.error('Unexpected error deleting expense:', error);
      throw new ExpenseServiceError(
        'UNKNOWN_ERROR',
        'An unexpected error occurred while deleting the expense'
      );
    }
  }
}

// Custom error class
export class ExpenseServiceError extends Error {
  public code: string;
  public details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'ExpenseServiceError';
    this.code = code;
    this.details = details;
  }
}

// Export singleton instance
export const expenseService = new ExpenseServiceClass();
