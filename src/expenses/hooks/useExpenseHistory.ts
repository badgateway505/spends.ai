import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ExpenseWithConversions, ExpenseFilters } from '../types/expense.types';

interface UseExpenseHistoryReturn {
  expenses: ExpenseWithConversions[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

interface UseExpenseHistoryOptions {
  limit?: number;
  filters?: ExpenseFilters;
  initialLoad?: boolean;
}

export function useExpenseHistory(options: UseExpenseHistoryOptions = {}): UseExpenseHistoryReturn {
  const { 
    limit = 20, 
    filters, 
    initialLoad = true 
  } = options;

  const [expenses, setExpenses] = useState<ExpenseWithConversions[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  const loadExpenses = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('spends_with_conversions')
        .select('*')
        .eq('archived', false)
        .order('user_local_datetime', { ascending: false })
        .limit(limit);

      // Apply cursor pagination
      if (cursor && !reset) {
        query = query.lt('user_local_datetime', cursor);
      }

      // Apply filters
      if (filters) {
        if (filters.dateRange) {
          query = query
            .gte('user_local_datetime', filters.dateRange.from.toISOString())
            .lte('user_local_datetime', filters.dateRange.to.toISOString());
        }

        if (filters.groupIds && filters.groupIds.length > 0) {
          query = query.in('group_id', filters.groupIds);
        }

        if (filters.tagIds && filters.tagIds.length > 0) {
          query = query.in('tag_id', filters.tagIds);
        }

        if (filters.currencies && filters.currencies.length > 0) {
          query = query.in('currency', filters.currencies);
        }

        if (filters.searchQuery) {
          query = query.or(`item.ilike.%${filters.searchQuery}%,merchant.ilike.%${filters.searchQuery}%`);
        }

        if (filters.minAmount !== undefined) {
          query = query.gte('amount', filters.minAmount);
        }

        if (filters.maxAmount !== undefined) {
          query = query.lte('amount', filters.maxAmount);
        }
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw new Error(`Failed to load expenses: ${queryError.message}`);
      }

      const newExpenses = data || [];
      
      if (reset) {
        setExpenses(newExpenses);
      } else {
        setExpenses(prev => [...prev, ...newExpenses]);
      }

      // Update cursor and hasMore
      if (newExpenses.length > 0) {
        setCursor(newExpenses[newExpenses.length - 1].user_local_datetime);
        setHasMore(newExpenses.length === limit);
      } else {
        setHasMore(false);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setCursor(null);
    setHasMore(true);
    await loadExpenses(true);
  };

  const loadMore = async () => {
    if (!loading && hasMore) {
      await loadExpenses(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      refresh();
    }
  }, [
    initialLoad,
    filters?.dateRange,
    filters?.groupIds,
    filters?.tagIds,
    filters?.currencies,
    filters?.searchQuery,
    filters?.minAmount,
    filters?.maxAmount,
  ]);

  return {
    expenses,
    loading,
    error,
    refresh,
    loadMore,
    hasMore,
  };
}
