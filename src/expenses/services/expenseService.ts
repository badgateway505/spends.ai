import { supabase } from '../../lib/supabase';
import type { NewExpenseForm, Expense, ExpenseWithConversions } from '../types/expense.types';
import type { PostgrestError } from '@supabase/supabase-js';
import { classificationService, type ClassificationResult } from './classificationService';
import { groupService } from '../../categories/services/groupService';

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

export interface CreateExpenseWithClassificationRequest extends CreateExpenseRequest {
  // Flag to enable AI classification
  useAI?: boolean;
}

export interface ExpenseCreationResult {
  expense: ExpenseRow;
  classification?: ClassificationResult;
}



class ExpenseServiceClass {
  /**
   * Get current authenticated user ID (with development mock support)
   */
  private async getCurrentUserId(): Promise<string> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Auth error getting user:', error);
        throw new ExpenseServiceError('AUTH_ERROR', 'Authentication failed');
      }
      
      if (user) {
        return user.id;
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
   * Ensure FX rate exists for the given date
   */
  private async ensureFxRateExists(rateDate: string): Promise<void> {
    try {
      console.log('🔍 [ExpenseService] Checking if fx_rate exists for date:', rateDate);
      
      // Check if fx_rate exists for this date
      const { data: existingRate, error: checkError } = await supabase
        .from('fx_rates')
        .select('rate_date')
        .eq('rate_date', rateDate)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no data

      if (checkError) {
        console.error('❌ [ExpenseService] Error checking fx_rate:', checkError);
        throw new ExpenseServiceError('DATABASE_ERROR', 'Failed to check exchange rate');
      }

      // If rate doesn't exist, create a default one
      if (!existingRate) {
        console.log('⚠️ [ExpenseService] FX rate not found, creating default for date:', rateDate);
        
        // Use reasonable default rates (approximate current rates)
        const defaultRates = {
          rate_date: rateDate,
          usd_per_thb: 0.027, // 1 THB = 0.027 USD
          thb_per_usd: 37.0,  // 1 USD = 37 THB
          manual: true,
          fetched_at: new Date().toISOString(),
        };

        console.log('💱 [ExpenseService] Default rates to insert:', defaultRates);

        const { error: insertError } = await supabase
          .from('fx_rates')
          .insert(defaultRates)
          .select()
          .single();

        if (insertError) {
          // Check if this is a duplicate key error (rate already exists)
          if (insertError.code === '23505') {
            console.log('✅ [ExpenseService] FX rate already exists (race condition handled)');
            return;
          }
          console.error('❌ [ExpenseService] Error creating default fx_rate:', insertError);
          throw new ExpenseServiceError('DATABASE_ERROR', 'Failed to create exchange rate');
        }

        console.log('✅ [ExpenseService] Created default fx_rate for', rateDate);
      } else {
        console.log('✅ [ExpenseService] FX rate already exists for date:', rateDate);
      }
    } catch (error) {
      if (error instanceof ExpenseServiceError) {
        throw error;
      }
      console.error('Unexpected error ensuring fx_rate exists:', error);
      throw new ExpenseServiceError('DATABASE_ERROR', 'Failed to ensure exchange rate exists');
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
      // Check if this is specifically about fx_rates
      if (error.message?.includes('fx_rates') || error.message?.includes('spends_fx_rate_date_fkey')) {
        return new ExpenseServiceError('DATABASE_ERROR', 'Exchange rate not available for this date. Please try again.', error);
      }
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
   * Create a new expense with optional AI classification
   */
  async createExpenseWithAI(formData: NewExpenseForm & { useAI?: boolean }): Promise<ExpenseCreationResult> {
    try {
      console.log('Creating expense with AI classification:', formData);
      
      let classification: ClassificationResult | undefined;
      const enhancedFormData = { ...formData };

      // Try AI classification if requested and not disabled
      if (formData.useAI !== false) {
        try {
          // Ensure user has default groups if they don't have any
          // This is a safety fallback since groups should be created on signup
          const hasGroups = await groupService.hasGroups();
          if (!hasGroups) {
            console.log('Creating default groups for existing user...');
            await groupService.createDefaultGroups();
          }

          // Create classification text from form data
          const classificationText = `${formData.item}${formData.merchant ? ` at ${formData.merchant}` : ''} ${formData.amount} ${formData.currency}`;
          
          classification = await classificationService.classifyExpense(classificationText);
          
          // Apply AI suggestions if they improve the expense data
          if (classification) {
            console.log('AI classification result:', classification);
            
            // Use AI-suggested item if it's more descriptive
            if (classification.item && classification.item.length > formData.item.length) {
              enhancedFormData.item = classification.item;
            }
            
            // Use AI-suggested merchant if not provided
            if (!formData.merchant && classification.merchant) {
              enhancedFormData.merchant = classification.merchant;
            }
            
            // Use AI-suggested group if not provided
            if (!formData.group_id && classification.group?.id) {
              enhancedFormData.group_id = classification.group.id;
            }
            
            // Use AI-suggested tag if not provided
            if (!formData.tag_id && classification.tag?.id) {
              enhancedFormData.tag_id = classification.tag.id;
            }
            
            // Use AI-suggested amount if not provided or if AI confidence is high
            if (classification.amount && (!formData.amount || classification.confidence > 0.9)) {
              enhancedFormData.amount = classification.amount.toString();
            }
            
            // Use AI-suggested currency if not provided or if AI confidence is high
            if (classification.currency && (!formData.currency || classification.confidence > 0.9)) {
              enhancedFormData.currency = classification.currency;
            }
          }
        } catch (classificationError) {
          console.warn('AI classification failed, proceeding without:', classificationError);
          // Continue with original form data if classification fails
        }
      }

      // Create the expense with enhanced data
      const expense = await this.createExpense(enhancedFormData);
      
      return {
        expense,
        classification
      };

    } catch (error) {
      if (error instanceof ExpenseServiceError) {
        throw error;
      }
      
      console.error('Unexpected error creating expense with AI:', error);
      throw new ExpenseServiceError(
        'UNKNOWN_ERROR',
        'An unexpected error occurred while creating the expense'
      );
    }
  }

  /**
   * Create a new expense (basic version without AI)
   */
  async createExpense(formData: NewExpenseForm): Promise<ExpenseRow> {
    try {
      console.log('🏗️ [ExpenseService] Starting expense creation');
      console.log('📝 [ExpenseService] Input data:', formData);
      
      // Get current user
      console.log('👤 [ExpenseService] Getting current user...');
      const userId = await this.getCurrentUserId();
      console.log('✅ [ExpenseService] User ID retrieved:', userId);

      // Convert form data to database format
      console.log('🔢 [ExpenseService] Converting amount...');
      const amountFloat = parseFloat(formData.amount);
      console.log('🔢 [ExpenseService] Amount parsing:', { input: formData.amount, parsed: amountFloat });
      
      if (isNaN(amountFloat) || amountFloat <= 0) {
        console.error('❌ [ExpenseService] Invalid amount detected');
        throw new ExpenseServiceError('VALIDATION_ERROR', 'Invalid amount');
      }

      // Convert amount to integer (cents/satang) for storage
      const amountInteger = Math.round(amountFloat * 100);
      console.log('💰 [ExpenseService] Amount conversion complete:', { 
        float: amountFloat, 
        integer: amountInteger 
      });

      // Get current FX rate date (today)
      const today = new Date();
      const fxRateDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      console.log('📅 [ExpenseService] FX rate date:', fxRateDate);

      // Ensure fx_rate exists for today - if not, create a default one
      console.log('💱 [ExpenseService] Ensuring FX rate exists...');
      await this.ensureFxRateExists(fxRateDate);
      console.log('✅ [ExpenseService] FX rate check completed');

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

      console.log('📤 [ExpenseService] Final expense data prepared:', expenseData);

      // Skip mock user logic in production
      if (false) {
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
      console.log('🗄️ [ExpenseService] Inserting into database...');
      const { data, error } = await supabase
        .from('spends')
        .insert(expenseData)
        .select()
        .single();

      if (error) {
        console.error('❌ [ExpenseService] Database insertion failed:', error);
        
        // If this is an fx_rate constraint error, try to create the rate again and retry
        if (error.code === '23503' && (error.message?.includes('fx_rates') || error.message?.includes('spends_fx_rate_date_fkey'))) {
          console.log('🔄 [ExpenseService] Retrying with fx_rate creation...');
          
          try {
            await this.ensureFxRateExists(fxRateDate);
            
            // Retry the insert
            const { data: retryData, error: retryError } = await supabase
              .from('spends')
              .insert(expenseData)
              .select()
              .single();
              
            if (retryError) {
              console.error('❌ [ExpenseService] Retry also failed:', retryError);
              throw this.handleSupabaseError(retryError, 'create expense');
            }
            
            console.log('✅ [ExpenseService] Retry successful:', retryData);
            return retryData;
            
          } catch (retryError) {
            console.error('❌ [ExpenseService] Retry failed:', retryError);
            throw this.handleSupabaseError(error, 'create expense');
          }
        }
        
        throw this.handleSupabaseError(error, 'create expense');
      }

      console.log('✅ [ExpenseService] Expense created successfully:', data);
      console.log('🎉 [ExpenseService] Expense creation process completed');
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
  } = {}): Promise<ExpenseWithConversions[]> {
    try {
      const userId = await this.getCurrentUserId();
      console.log('Fetching expenses for user:', userId, 'with options:', options);
      


      let query = supabase
        .from('spends_with_conversions')
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

      // Skip mock user logic in production
      if (false) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Create mock updated expense response
        const mockUpdatedExpense: ExpenseRow = {
          id: id,
          user_id: userId,
          item: updateData.item as string,
          amount: updateData.amount as number,
          currency: updateData.currency as 'THB' | 'USD',
          merchant: updateData.merchant as string | null,
          group_id: updateData.group_id as string | null,
          tag_id: updateData.tag_id as string | null,
          created_at: new Date().toISOString(),
          user_local_datetime: new Date().toISOString(),
          fx_rate_date: new Date().toISOString().split('T')[0],
          archived: false,
          archived_at: null,
        };
        
        console.log('Mock expense updated:', mockUpdatedExpense);
        return mockUpdatedExpense;
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

      // Skip mock user logic in production
      if (false) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('Mock expense deleted:', id);
        return;
      }

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
