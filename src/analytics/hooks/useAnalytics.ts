import { useState, useEffect, useCallback } from 'react';
import { analyticsService, type AnalyticsFilters, type SpendingSummary, type CategoryStats } from '../services/analyticsService';

interface UseAnalyticsReturn {
  summary: SpendingSummary | null;
  categoryStats: CategoryStats[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAnalytics(filters: AnalyticsFilters = {}): UseAnalyticsReturn {
  const [summary, setSummary] = useState<SpendingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const summaryData = await analyticsService.getSpendingSummary(filters);
      setSummary(summaryData);
      
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      setError(error?.getUserMessage?.() || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    summary,
    categoryStats: summary?.category_breakdown || [],
    loading,
    error,
    refresh: fetchAnalytics
  };
}
