import { useState, useEffect } from 'react';
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
  filters 
}: UseExpenseHistoryProps = {}): UseExpenseHistoryReturn {
  const [expenses, setExpenses] = useState<ExpenseWithConversions[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [, setCursor] = useState<string | null>(null);

  const loadExpenses = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for MVP demo
      const mockExpenses: ExpenseWithConversions[] = [
        {
          id: '1',
          user_id: 'demo-user',
          item: 'Coffee from Starbucks',
          amount: 15000, // 150 THB
          currency: 'THB',
          merchant: 'Starbucks',
          group_id: 'food-group',
          group_name: 'Food & Drinks',
          tag_id: null,
          tag_name: null,
          created_at: new Date().toISOString(),
          user_local_datetime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          fx_rate_date: new Date().toISOString().split('T')[0],
          archived: false,
          archived_at: null,
          amount_thb: 15000,
          amount_usd: 4.29,
          usd_per_thb: 0.0286,
          thb_per_usd: 35.0
        },
        {
          id: '2',
          user_id: 'demo-user',
          item: 'Lunch at local restaurant',
          amount: 25000, // 250 THB
          currency: 'THB',
          merchant: 'Som Tam Nua',
          group_id: 'food-group',
          group_name: 'Food & Drinks',
          tag_id: null,
          tag_name: null,
          created_at: new Date().toISOString(),
          user_local_datetime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          fx_rate_date: new Date().toISOString().split('T')[0],
          archived: false,
          archived_at: null,
          amount_thb: 25000,
          amount_usd: 7.15,
          usd_per_thb: 0.0286,
          thb_per_usd: 35.0
        },
        {
          id: '3',
          user_id: 'demo-user',
          item: 'Taxi ride',
          amount: 12000, // 120 THB
          currency: 'THB',
          merchant: 'Grab',
          group_id: 'transport-group',
          group_name: 'Transport',
          tag_id: null,
          tag_name: null,
          created_at: new Date().toISOString(),
          user_local_datetime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          fx_rate_date: new Date().toISOString().split('T')[0],
          archived: false,
          archived_at: null,
          amount_thb: 12000,
          amount_usd: 3.43,
          usd_per_thb: 0.0286,
          thb_per_usd: 35.0
        },
        {
          id: '4',
          user_id: 'demo-user',
          item: 'Groceries',
          amount: 45000, // 450 THB
          currency: 'THB',
          merchant: 'Big C',
          group_id: 'shopping-group',
          group_name: 'Shopping',
          tag_id: null,
          tag_name: null,
          created_at: new Date().toISOString(),
          user_local_datetime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
          fx_rate_date: new Date().toISOString().split('T')[0],
          archived: false,
          archived_at: null,
          amount_thb: 45000,
          amount_usd: 12.87,
          usd_per_thb: 0.0286,
          thb_per_usd: 35.0
        },
        {
          id: '5',
          user_id: 'demo-user',
          item: 'Movie tickets',
          amount: 1500, // $15 USD
          currency: 'USD',
          merchant: 'Major Cineplex',
          group_id: 'entertainment-group',
          group_name: 'Entertainment',
          tag_id: null,
          tag_name: null,
          created_at: new Date().toISOString(),
          user_local_datetime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
          fx_rate_date: new Date().toISOString().split('T')[0],
          archived: false,
          archived_at: null,
          amount_thb: 52500, // 525 THB
          amount_usd: 1500,
          usd_per_thb: 0.0286,
          thb_per_usd: 35.0
        }
      ];

      // Filter by date range if specified
      let filteredExpenses = mockExpenses;
      if (filters?.dateRange) {
        const { from, to } = filters.dateRange;
        filteredExpenses = mockExpenses.filter(expense => {
          const expenseDate = new Date(expense.user_local_datetime);
          return expenseDate >= from && expenseDate <= to;
        });
      }

      // Filter by search query if specified
      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredExpenses = filteredExpenses.filter(expense => 
          expense.item.toLowerCase().includes(query) ||
          expense.merchant?.toLowerCase().includes(query)
        );
      }

      // Simulate loading delay for better UX demo
      await new Promise(resolve => setTimeout(resolve, 500));

      const newExpenses = filteredExpenses;
      
      if (reset) {
        setExpenses(newExpenses);
      } else {
        setExpenses(prev => [...prev, ...newExpenses]);
      }

      // Update cursor and hasMore
      if (newExpenses.length > 0) {
        setCursor(newExpenses[newExpenses.length - 1].user_local_datetime);
        setHasMore(false); // No pagination for mock data
      } else {
        setHasMore(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error loading expenses:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setCursor(null);
    await loadExpenses(true);
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;
    await loadExpenses(false);
  };

  // Load initial data
  useEffect(() => {
    loadExpenses(true);
  }, [filters]);

  return {
    expenses,
    loading,
    error,
    refresh,
    loadMore,
    hasMore,
  };
}
