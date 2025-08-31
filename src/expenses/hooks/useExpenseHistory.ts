import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import type { ExpenseWithConversions, ExpenseFilters, NewExpenseForm } from '../types/expense.types';

interface UseExpenseHistoryReturn {
  expenses: ExpenseWithConversions[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  addExpenseOptimistically: (expense: NewExpenseForm) => string;
  removeOptimisticExpense: (tempId: string) => void;
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
  const [optimisticExpenses, setOptimisticExpenses] = useState<Map<string, ExpenseWithConversions>>(new Map());

  const loadExpenses = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

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
          throw new Error('User not authenticated');
        }
      }

      // For development with mock admin user, return mock data
      if (userId === 'debug-user-id-12345') {
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const mockExpenses: ExpenseWithConversions[] = [
          {
            id: 'mock-expense-1',
            user_id: userId,
            item: 'Coffee and croissant',
            amount: 15000, // 150 THB in cents
            currency: 'THB',
            merchant: 'Starbucks',
            group_id: 'mock-group-1',
            tag_id: null,
            created_at: new Date().toISOString(),
            user_local_datetime: new Date().toISOString(),
            fx_rate_date: new Date().toISOString().split('T')[0],
            archived: false,
            archived_at: null,
            amount_thb: 150, // Display amounts in normal currency units
            amount_usd: 4.29,
            group_name: 'Food & Dining',
            tag_name: null,
            thb_per_usd: 35.0,
            usd_per_thb: 0.0286,
          },
          {
            id: 'mock-expense-2',
            user_id: userId,
            item: 'Lunch at local restaurant',
            amount: 25000, // 250 THB in cents
            currency: 'THB',
            merchant: 'Som Tam Shop',
            group_id: 'mock-group-1',
            tag_id: 'mock-tag-1',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            user_local_datetime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            fx_rate_date: new Date().toISOString().split('T')[0],
            archived: false,
            archived_at: null,
            amount_thb: 250,
            amount_usd: 7.14,
            group_name: 'Food & Dining',
            tag_name: 'Business',
            thb_per_usd: 35.0,
            usd_per_thb: 0.0286,
          },
          {
            id: 'mock-expense-3',
            user_id: userId,
            item: 'Taxi to airport',
            amount: 45000, // 450 THB in cents
            currency: 'THB',
            merchant: 'Grab',
            group_id: 'mock-group-2',
            tag_id: null,
            created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            user_local_datetime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            fx_rate_date: new Date().toISOString().split('T')[0],
            archived: false,
            archived_at: null,
            amount_thb: 450,
            amount_usd: 12.86,
            group_name: 'Transportation',
            tag_name: null,
            thb_per_usd: 35.0,
            usd_per_thb: 0.0286,
          },
          {
            id: 'mock-expense-4',
            user_id: userId,
            item: 'New headphones',
            amount: 3500, // $35 USD in cents
            currency: 'USD',
            merchant: 'Amazon',
            group_id: 'mock-group-3',
            tag_id: 'mock-tag-2',
            created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            user_local_datetime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            fx_rate_date: new Date().toISOString().split('T')[0],
            archived: false,
            archived_at: null,
            amount_thb: 1225,
            amount_usd: 35,
            group_name: 'Shopping',
            tag_name: 'Personal',
            thb_per_usd: 35.0,
            usd_per_thb: 0.0286,
          },
        ];
        
        // Apply filters similar to the real query
        let filteredExpenses = mockExpenses;
        
        if (filters?.dateRange) {
          const { from, to } = filters.dateRange;
          filteredExpenses = filteredExpenses.filter(expense => {
            const expenseDate = new Date(expense.user_local_datetime);
            return expenseDate >= from && expenseDate <= to;
          });
        }

        if (filters?.currencies && filters.currencies.length > 0) {
          filteredExpenses = filteredExpenses.filter(expense => 
            filters.currencies!.includes(expense.currency)
          );
        }

        if (filters?.groupIds && filters.groupIds.length > 0) {
          filteredExpenses = filteredExpenses.filter(expense => 
            expense.group_id && filters.groupIds!.includes(expense.group_id)
          );
        }

        if (filters?.searchQuery) {
          const searchTerm = filters.searchQuery.toLowerCase();
          filteredExpenses = filteredExpenses.filter(expense =>
            expense.item.toLowerCase().includes(searchTerm) ||
            (expense.merchant?.toLowerCase().includes(searchTerm) ?? false)
          );
        }
        
        if (reset) {
          setExpenses(filteredExpenses);
          setOffset(limit);
        } else {
          setExpenses(prev => [...prev, ...filteredExpenses]);
          setOffset(prev => prev + limit);
        }

        setHasMore(false); // No pagination for mock data
        return;
      }

      // Build query using the spends_with_conversions view
      let query = supabase
        .from('spends_with_conversions')
        .select('*')
        .eq('user_id', userId)
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
      const processedExpenses = newExpenses.map((expense: Record<string, unknown>) => ({
        ...expense,
        amount_thb: (expense.amount_thb as number) / 100, // Convert from cents to THB
        amount_usd: (expense.amount_usd as number) / 100, // Convert from cents to USD
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
      let errorMessage = 'Failed to load expenses';
      
      if (err instanceof Error) {
        if (err.message.includes('not authenticated')) {
          errorMessage = 'Please sign in to view your expenses';
          setExpenses([]);
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (err.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to the server. Please try again later.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      console.error('Error loading expenses:', err);
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

  // Optimistic expense management
  const addExpenseOptimistically = useCallback((expenseForm: NewExpenseForm): string => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create an optimistic expense object with simplified FX rates
    const simplifiedFXRate = 35; // Simplified rate for display purposes
    const amount = parseFloat(expenseForm.amount);
    
    const optimisticExpense: ExpenseWithConversions = {
      id: tempId,
      user_id: 'temp-user', // Will be replaced when actual expense is saved
      item: expenseForm.item.trim(),
      amount: Math.round(amount * 100), // Convert to cents for storage
      currency: expenseForm.currency,
      merchant: expenseForm.merchant?.trim() || null,
      group_id: expenseForm.group_id || null,
      tag_id: expenseForm.tag_id || null,
      created_at: new Date().toISOString(),
      user_local_datetime: new Date().toISOString(),
      fx_rate_date: new Date().toISOString().split('T')[0],
      archived: false,
      archived_at: null,
      // Add conversion amounts (simplified - real values will come from server)
      amount_thb: expenseForm.currency === 'THB' ? amount : amount * simplifiedFXRate,
      amount_usd: expenseForm.currency === 'USD' ? amount : amount / simplifiedFXRate,
      group_name: null,
      tag_name: null,
      // Add required FX rate fields
      thb_per_usd: simplifiedFXRate,
      usd_per_thb: 1 / simplifiedFXRate,
    };

    // Add to optimistic expenses
    setOptimisticExpenses(prev => new Map(prev).set(tempId, optimisticExpense));
    
    return tempId;
  }, []);

  const removeOptimisticExpense = useCallback((tempId: string) => {
    setOptimisticExpenses(prev => {
      const newMap = new Map(prev);
      newMap.delete(tempId);
      return newMap;
    });
  }, []);

  // Combine real expenses with optimistic ones for display
  const allExpenses = useMemo(() => {
    const optimisticList = Array.from(optimisticExpenses.values());
    const combined = [...optimisticList, ...expenses];
    
    // Sort by created_at descending (newest first)
    return combined.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [expenses, optimisticExpenses]);

  // Load initial data
  useEffect(() => {
    refresh();
  }, [filters, refresh]); // Only reload when filters change

  return {
    expenses: allExpenses,
    loading,
    error,
    refresh,
    loadMore,
    hasMore,
    addExpenseOptimistically,
    removeOptimisticExpense,
  };
}