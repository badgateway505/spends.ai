// Re-export types from the service for easier imports
export type {
  CategoryStats,
  PeriodStats,
  SpendingSummary,
  AnalyticsFilters
} from '../services/analyticsService';

// Additional UI-specific types
export interface ChartColor {
  background: string;
  border: string;
  hover: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  percentage: number;
  color: ChartColor;
}

export interface CategoryChartData {
  labels: string[];
  datasets: [{
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    hoverBackgroundColor: string[];
    borderWidth: number;
  }];
}

export interface AnalyticsViewMode {
  period: 'today' | '7days' | '30days' | '90days' | 'year' | 'all';
  groupBy: 'category' | 'time' | 'merchant';
  chartType: 'pie' | 'bar' | 'line';
}
