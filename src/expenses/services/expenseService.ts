import { supabase } from '../../lib/supabase';
import { isDevelopment } from '../../utils/env';
import type { NewExpenseForm, Expense } from '../types/expense.types';
import type { PostgrestError } from '@supabase/supabase-js';

// Use the proper database type for expenses
type ExpenseRow = Expense;

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
   * Get current authenticated user ID (with development mock support)
   */
  private async getCurrentUserId(): Promise<string> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error && !isDevelopment) {
        console.error('Auth error getting user:', error);
        throw new ExpenseServiceError('AUTH_ERROR', 'Authentication failed');
      }
      
      if (user) {
        return user.id;
      }
      
      // Development-only mock user fallback
      if (isDevelopment) {
        const mockUserData = localStorage.getItem('mock-admin-user');
        const mockSessionData = localStorage.getItem('mock-admin-session');
        
        if (mockUserData && mockSessionData) {
          const mockUser = JSON.parse(mockUserData);
          console.log('Using mock admin user:', mockUser.id);
          return mockUser.id;
        }
      }
      
      throw new ExpenseServiceError('AUTH_ERROR', 'User not authenticated');
    } catch (error) {
      if (error instanceof ExpenseServiceError) {
        throw error;
      }
      console.error('Unexpected error getting user ID:', error);
      throw new ExpenseServiceError('AUTH_ERROR', 'Authentication system error');
    }
  }

  /**
   * Handle Supabase errors and convert to ExpenseServiceError
   */
  private handleSupabaseError(error: PostgrestError, operation: string): ExpenseServiceError {
    console.error(`Supabase error during ${operation}:`, error);
    
    // Map specific Supabase error codes to user-friendly messages
    if (error.code === '23505') {
      return new ExpenseServiceError('DUPLICATE_ERROR', 'This item already exists', error);
    }
    
    if (error.code === '23503') {
      return new ExpenseServiceError('REFERENCE_ERROR', 'Referenced item not found', error);
    }
    
    if (error.code === 'PGRST116') {
      return new ExpenseServiceError('NOT_FOUND', 'Item not found', error);
    }
    
    // Default database error
    return new ExpenseServiceError(
      'DATABASE_ERROR',
      `Failed to ${operation}`,
      error
    );
  }

  /**
   * Create a new expense
   */
  async createExpense(formData: NewExpenseForm): Promise<ExpenseRow> {
    try {
      console.log('Creating expense with data:', formData);
      
      // Get current user
      const userId = await this.getCurrentUserId();
      console.log('Creating expense for user:', userId);

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
        currency: formData.currency as 'THB' | 'USD',
        merchant: formData.merchant?.trim() || null,
        group_id: formData.group_id || null,
        tag_id: formData.tag_id || null,
        user_local_datetime: new Date().toISOString(),
        fx_rate_date: fxRateDate,
        archived: false,
      };

      console.log('Inserting expense data:', expenseData);

      // For development with mock user, simulate database insert
      if (isDevelopment && userId === 'admin-user-id-12345') {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Create mock expense response
        const mockExpense: ExpenseRow = {
          id: `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          archived_at: null,
          ...expenseData,
        };
        
        console.log('Mock expense created:', mockExpense);
        return mockExpense;
      }

      // Insert expense into database
      const { data, error } = await supabase
        .from('spends')
        .insert(expenseData)
        .select()
        .single();

      if (error) {
        throw this.handleSupabaseError(error, 'create expense');
      }

      console.log('Expense created successfully:', data);
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
      const userId = await this.getCurrentUserId();
      console.log('Fetching expenses for user:', userId, 'with options:', options);
      
      // For development with mock user, return mock data
      if (isDevelopment && userId === 'admin-user-id-12345') {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Return mock expenses for demo
        const mockExpenses: ExpenseRow[] = [
          {
            id: 'mock-expense-1',
            user_id: userId,
            item: 'Coffee and croissant',
            amount: 15000, // 150 THB in cents
            currency: 'THB',
            merchant: 'Starbucks',
            group_id: null,
            tag_id: null,
            created_at: new Date().toISOString(),
            user_local_datetime: new Date().toISOString(),
            fx_rate_date: new Date().toISOString().split('T')[0],
            archived: false,
            archived_at: null,
          },
          {
            id: 'mock-expense-2',
            user_id: userId,
            item: 'Lunch at local restaurant',
            amount: 25000, // 250 THB in cents
            currency: 'THB',
            merchant: 'Som Tam Shop',
            group_id: null,
            tag_id: null,
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            user_local_datetime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            fx_rate_date: new Date().toISOString().split('T')[0],
            archived: false,
            archived_at: null,
          },
        ];
        
        console.log('Returning mock expenses:', mockExpenses.length);
        return mockExpenses;
      }

      let query = supabase
        .from('spends')
        .select('*')
        .eq('user_id', userId)
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
        throw this.handleSupabaseError(error, 'fetch expenses');
      }

      console.log('Fetched expenses:', (data || []).length);
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
      const userId = await this.getCurrentUserId();

      const updateData: Record<string, string | number | boolean | null> = {};

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

      const { data, error } = await supabase
        .from('spends')
        .update(updateData)
        .eq('id', id)
.eq('user_id', userId) // Ensure user can only update their own expenses
        .select()
        .single();

      if (error) {
        throw this.handleSupabaseError(error, 'update expense');
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
      const userId = await this.getCurrentUserId();

      const { error } = await supabase
        .from('spends')
        .update({ 
          archived: true, 
          archived_at: new Date().toISOString() 
        })
        .eq('id', id)
.eq('user_id', userId); // Ensure user can only delete their own expenses

      if (error) {
        throw this.handleSupabaseError(error, 'delete expense');
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

// Error code types for better error handling
export type ExpenseErrorCode = 
  | 'AUTH_ERROR'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'DUPLICATE_ERROR'
  | 'REFERENCE_ERROR'
  | 'NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

// Custom error class with typed error codes
export class ExpenseServiceError extends Error {
  public code: ExpenseErrorCode;
  public details?: unknown;
  public isRetryable: boolean;

  constructor(code: ExpenseErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'ExpenseServiceError';
    this.code = code;
    this.details = details;
    
    // Determine if this error is retryable
    this.isRetryable = ['NETWORK_ERROR', 'UNKNOWN_ERROR'].includes(code);
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case 'AUTH_ERROR':
        return 'Please sign in to continue';
      case 'VALIDATION_ERROR':
        return this.message;
      case 'DUPLICATE_ERROR':
        return 'This expense already exists';
      case 'REFERENCE_ERROR':
        return 'The selected category or tag is no longer available';
      case 'NOT_FOUND':
        return 'Expense not found';
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection and try again';
      case 'DATABASE_ERROR':
        return 'Database error. Please try again later';
      default:
        return 'An unexpected error occurred. Please try again';
    }
  }
}

// Export singleton instance
export const expenseService = new ExpenseServiceClass();
