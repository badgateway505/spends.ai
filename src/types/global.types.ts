// Global type definitions used across the application

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type Currency = 'THB' | 'USD';

export interface DateRange {
  start: Date;
  end: Date;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ErrorInfo {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}
