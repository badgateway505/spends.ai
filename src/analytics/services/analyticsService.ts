import { supabase } from '../../lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

// Analytics interfaces
export interface CategoryStats {
  group_id: string | null;
  group_name: string;
  total_amount_thb: number;
  total_amount_usd: number;
  expense_count: number;
  percentage: number;
}

export interface PeriodStats {
  period: string;
  total_amount_thb: number;
  total_amount_usd: number;
  expense_count: number;
}

export interface SpendingSummary {
  total_amount_thb: number;
  total_amount_usd: number;
  total_expenses: number;
  category_breakdown: CategoryStats[];
  date_range: {
    from: Date;
    to: Date;
  };
}

export interface AnalyticsFilters {
  dateRange?: {
    from: Date;
    to: Date;
  };
  groupIds?: string[];
  includeArchived?: boolean;
}

// Error handling
export class AnalyticsServiceError extends Error {
  constructor(
    public code: 'AUTH_ERROR' | 'DATABASE_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR',
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AnalyticsServiceError';
  }

  getUserMessage(): string {
    switch (this.code) {
      case 'AUTH_ERROR':
        return 'Please sign in and try again';
      case 'DATABASE_ERROR':
        return 'Analytics service temporarily unavailable';
      case 'NETWORK_ERROR':
        return 'Check your connection and try again';
      default:
        return 'An unexpected error occurred while loading analytics';
    }
  }
}

class AnalyticsServiceClass {
  /**
   * Get current authenticated user ID
   */
  private async getCurrentUserId(): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        return user.id;
      }
      

      
      throw new AnalyticsServiceError('AUTH_ERROR', 'User not authenticated');
    } catch (error: any) {
      if (error instanceof AnalyticsServiceError) {
        throw error;
      }
      throw new AnalyticsServiceError('AUTH_ERROR', 'Failed to get user authentication');
    }
  }

  /**
   * Handle Supabase errors
   */
  private handleSupabaseError(error: PostgrestError, operation: string): AnalyticsServiceError {
    console.error(`Analytics ${operation} error:`, error);
    
    if (error.code === 'PGRST116') {
      return new AnalyticsServiceError('AUTH_ERROR', `Authentication required for ${operation}`, error);
    }
    
    return new AnalyticsServiceError('DATABASE_ERROR', `Failed to ${operation}`, error);
  }

  /**
   * Get spending summary with category breakdown
   */
  async getSpendingSummary(filters: AnalyticsFilters = {}): Promise<SpendingSummary> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Skip mock user logic in production
      if (false) {
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const mockCategoryStats: CategoryStats[] = [
          {
            group_id: 'group-1',
            group_name: 'Food & Dining',
            total_amount_thb: 1250.00,
            total_amount_usd: 35.71,
            expense_count: 8,
            percentage: 45.5
          },
          {
            group_id: 'group-2',
            group_name: 'Transportation',
            total_amount_thb: 680.00,
            total_amount_usd: 19.43,
            expense_count: 5,
            percentage: 24.7
          },
          {
            group_id: 'group-3',
            group_name: 'Shopping',
            total_amount_thb: 420.00,
            total_amount_usd: 12.00,
            expense_count: 3,
            percentage: 15.3
          },
          {
            group_id: 'group-4',
            group_name: 'Entertainment',
            total_amount_thb: 280.00,
            total_amount_usd: 8.00,
            expense_count: 2,
            percentage: 10.2
          },
          {
            group_id: null,
            group_name: 'Uncategorized',
            total_amount_thb: 120.00,
            total_amount_usd: 3.43,
            expense_count: 1,
            percentage: 4.4
          }
        ];

        const totalAmount = mockCategoryStats.reduce((sum, cat) => sum + cat.total_amount_thb, 0);
        
        return {
          total_amount_thb: totalAmount,
          total_amount_usd: totalAmount / 35.0,
          total_expenses: mockCategoryStats.reduce((sum, cat) => sum + cat.expense_count, 0),
          category_breakdown: mockCategoryStats,
          date_range: {
            from: filters.dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            to: filters.dateRange?.to || new Date()
          }
        };
      }

      // Build the query with filters
      let query = supabase
        .from('spends')
        .select(`
          id,
          amount,
          currency,
          group_id,
          groups(name),
          created_at,
          fx_rate_date,
          fx_rates(thb_per_usd, usd_per_thb)
        `)
        .eq('user_id', userId);

      if (!filters.includeArchived) {
        query = query.eq('archived', false);
      }

      if (filters.dateRange?.from) {
        query = query.gte('created_at', filters.dateRange.from.toISOString());
      }

      if (filters.dateRange?.to) {
        query = query.lte('created_at', filters.dateRange.to.toISOString());
      }

      if (filters.groupIds && filters.groupIds.length > 0) {
        query = query.in('group_id', filters.groupIds);
      }

      const { data: expenses, error } = await query;

      if (error) {
        throw this.handleSupabaseError(error, 'fetch spending summary');
      }

      if (!expenses) {
        return {
          total_amount_thb: 0,
          total_amount_usd: 0,
          total_expenses: 0,
          category_breakdown: [],
          date_range: {
            from: filters.dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            to: filters.dateRange?.to || new Date()
          }
        };
      }

      // Calculate category statistics
      const categoryMap = new Map<string, {
        group_id: string | null;
        group_name: string;
        total_amount_thb: number;
        total_amount_usd: number;
        expense_count: number;
      }>();

      let totalAmountThb = 0;
      let totalAmountUsd = 0;

      for (const expense of expenses) {
        const groupId = expense.group_id || 'uncategorized';
        const groupName = expense.groups?.name || 'Uncategorized';
        
        // Convert amounts to display units (from cents to full units)
        const amountThb = expense.currency === 'THB' 
          ? expense.amount / 100
          : (expense.amount / 100) * (expense.fx_rates?.thb_per_usd || 35.0);
        
        const amountUsd = expense.currency === 'USD'
          ? expense.amount / 100
          : (expense.amount / 100) * (expense.fx_rates?.usd_per_thb || 0.0286);

        totalAmountThb += amountThb;
        totalAmountUsd += amountUsd;

        if (!categoryMap.has(groupId)) {
          categoryMap.set(groupId, {
            group_id: expense.group_id,
            group_name: groupName,
            total_amount_thb: 0,
            total_amount_usd: 0,
            expense_count: 0
          });
        }

        const category = categoryMap.get(groupId)!;
        category.total_amount_thb += amountThb;
        category.total_amount_usd += amountUsd;
        category.expense_count += 1;
      }

      // Convert to array and calculate percentages
      const categoryBreakdown: CategoryStats[] = Array.from(categoryMap.values())
        .map(category => ({
          ...category,
          percentage: totalAmountThb > 0 ? (category.total_amount_thb / totalAmountThb) * 100 : 0
        }))
        .sort((a, b) => b.total_amount_thb - a.total_amount_thb); // Sort by amount desc

      return {
        total_amount_thb: totalAmountThb,
        total_amount_usd: totalAmountUsd,
        total_expenses: expenses.length,
        category_breakdown: categoryBreakdown,
        date_range: {
          from: filters.dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          to: filters.dateRange?.to || new Date()
        }
      };

    } catch (error) {
      if (error instanceof AnalyticsServiceError) {
        throw error;
      }
      
      console.error('Failed to get spending summary:', error);
      throw new AnalyticsServiceError('UNKNOWN_ERROR', 'Failed to load spending summary');
    }
  }

  /**
   * Get category statistics for a specific time period
   */
  async getCategoryStats(filters: AnalyticsFilters = {}): Promise<CategoryStats[]> {
    const summary = await this.getSpendingSummary(filters);
    return summary.category_breakdown;
  }

  /**
   * Get spending trends over time periods
   */
  async getSpendingTrends(
    periodType: 'daily' | 'weekly' | 'monthly' = 'daily',
    filters: AnalyticsFilters = {}
  ): Promise<PeriodStats[]> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Skip mock user logic in production
      if (false) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const mockTrends: PeriodStats[] = [];
        const days = 7;
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          
          mockTrends.push({
            period: date.toISOString().split('T')[0],
            total_amount_thb: Math.random() * 500 + 100,
            total_amount_usd: Math.random() * 15 + 3,
            expense_count: Math.floor(Math.random() * 5) + 1
          });
        }
        
        return mockTrends;
      }

      // Real implementation would go here
      // For now, return empty array
      return [];

    } catch (error) {
      if (error instanceof AnalyticsServiceError) {
        throw error;
      }
      
      console.error('Failed to get spending trends:', error);
      throw new AnalyticsServiceError('UNKNOWN_ERROR', 'Failed to load spending trends');
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsServiceClass();
