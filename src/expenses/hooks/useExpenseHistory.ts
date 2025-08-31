import { useState, useEffect, useCallback } from 'react';
import { expenseService } from '../services/expenseService';
import type { ExpenseWithConversions, ExpenseFilters } from '../types/expense.types';

interface UseExpenseHistoryReturn {
  expenses: ExpenseWithConversions[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  addOptimisticExpense: (expense: ExpenseWithConversions) => void;
  removeOptimisticExpense: (id: string) => void;
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

      const currentOffset = reset ? 0 : offset;
      const result = await expenseService.getExpenses({
        limit,
        offset: currentOffset,
        ...filters,
      });

      if (reset) {
        setExpenses(result);
        setOffset(limit);
      } else {
        setExpenses(prev => [...prev, ...result]);
        setOffset(prev => prev + limit);
      }

      // Check if we have more data
      setHasMore(result.length === limit);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error loading expenses:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, limit, offset]);

  const refresh = useCallback(async () => {
    setOffset(0);
    setOptimisticExpenses(new Map());
    await loadExpenses(true);
  }, [loadExpenses]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadExpenses(false);
  }, [hasMore, loading, loadExpenses]);

  const addOptimisticExpense = useCallback((expense: ExpenseWithConversions) => {
    setOptimisticExpenses(prev => new Map(prev).set(expense.id, expense));
  }, []);

  const removeOptimisticExpense = useCallback((id: string) => {
    setOptimisticExpenses(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  // Load initial data when filters change
  useEffect(() => {
    setOffset(0);
    setOptimisticExpenses(new Map());
    loadExpenses(true);
  }, [filters]);

  // Merge optimistic expenses with real expenses
  const allExpenses = [
    ...Array.from(optimisticExpenses.values()),
    ...expenses.filter(expense => !optimisticExpenses.has(expense.id))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    expenses: allExpenses,
    loading,
    error,
    refresh,
    loadMore,
    hasMore,
    addOptimisticExpense,
    removeOptimisticExpense,
  };
}