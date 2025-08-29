import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { ExpenseWithConversions, ExpenseFilters } from '../types/expense.types';

interface UseExpenseHistoryReturn {
  expenses: ExpenseWithConversions[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

interface UseExpenseHistoryProps {
  filters?: ExpenseFilters;
  limit?: number;
}

export function useExpenseHistory({ 
  filters,
  limit = 20 
}: UseExpenseHistoryProps = {}): UseExpenseHistoryReturn {
  const [expenses, setExpenses] = useState<ExpenseWithConversions[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadExpenses = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Build query using the spends_with_conversions view
      let query = supabase
        .from('spends_with_conversions')
        .select('*')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      // Apply date range filter
      if (filters?.dateRange) {
        const { from, to } = filters.dateRange;
        query = query
          .gte('user_local_datetime', from.toISOString())
          .lte('user_local_datetime', to.toISOString());
      }

      // Apply currency filter
      if (filters?.currencies && filters.currencies.length > 0) {
        query = query.in('currency', filters.currencies);
      }

      // Apply group filter
      if (filters?.groupIds && filters.groupIds.length > 0) {
        query = query.in('group_id', filters.groupIds);
      }

      // Apply tag filter
      if (filters?.tagIds && filters.tagIds.length > 0) {
        query = query.in('tag_id', filters.tagIds);
      }

      // Apply amount filters
      if (filters?.minAmount !== undefined) {
        query = query.gte('amount_thb', filters.minAmount * 100); // Convert to integer cents
      }
      if (filters?.maxAmount !== undefined) {
        query = query.lte('amount_thb', filters.maxAmount * 100); // Convert to integer cents
      }

      // Apply search query
      if (filters?.searchQuery) {
        const searchTerm = `%${filters.searchQuery.toLowerCase()}%`;
        query = query.or(`item.ilike.${searchTerm},merchant.ilike.${searchTerm}`);
      }

      // Apply pagination
      const currentOffset = reset ? 0 : offset;
      query = query.range(currentOffset, currentOffset + limit - 1);

      const { data, error: queryError } = await query;

      if (queryError) {
        console.error('Supabase query error:', queryError);
        throw new Error(`Failed to fetch expenses: ${queryError.message}`);
      }

      const newExpenses = data || [];
      
      // Convert amount from integer cents to display format
      const processedExpenses = newExpenses.map(expense => ({
        ...expense,
        amount_thb: expense.amount_thb / 100, // Convert from cents to THB
        amount_usd: expense.amount_usd / 100, // Convert from cents to USD
      }));

      if (reset) {
        setExpenses(processedExpenses);
        setOffset(limit);
      } else {
        setExpenses(prev => [...prev, ...processedExpenses]);
        setOffset(prev => prev + limit);
      }

      // Check if there are more records
      setHasMore(processedExpenses.length === limit);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error loading expenses:', err);
      
      // If this is the first load and there's an auth error, clear expenses
      if (errorMessage.includes('not authenticated')) {
        setExpenses([]);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, limit, offset]);

  const refresh = useCallback(async () => {
    setOffset(0);
    await loadExpenses(true);
  }, [loadExpenses]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadExpenses(false);
  }, [hasMore, loading, loadExpenses]);

  // Load initial data
  useEffect(() => {
    refresh();
  }, [filters]); // Only reload when filters change

  return {
    expenses,
    loading,
    error,
    refresh,
    loadMore,
    hasMore,
  };
}