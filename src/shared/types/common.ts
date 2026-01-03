// Common/shared type definitions

export type ViewMode = 'vertical' | 'grid';

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

export interface SearchState {
  query: string;
  results: number;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

// Generic mutation result
export interface MutationResult {
  success: boolean;
  message?: string;
  error?: string;
}
