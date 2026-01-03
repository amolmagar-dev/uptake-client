import { useState, useCallback } from 'react';
import { useAppStore } from '../../store/appStore';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

interface UseApiResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Generic hook for API calls with loading/error state management
 * 
 * @example
 * const { data, isLoading, error, execute } = useApi(
 *   dashboardsApi.getAll,
 *   { showToast: true, successMessage: 'Dashboards loaded' }
 * );
 * 
 * useEffect(() => {
 *   execute();
 * }, []);
 */
export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<{ data: T }>,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const { addToast } = useAppStore();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    onSuccess,
    onError,
    showToast = false,
    successMessage,
    errorMessage,
  } = options;

  const execute = useCallback(
    async (...args: any[]) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiFunction(...args);
        setData(response.data);

        if (onSuccess) {
          onSuccess(response.data);
        }

        if (showToast && successMessage) {
          addToast('success', successMessage);
        }

        return response.data;
      } catch (err) {
        const error = err as Error;
        setError(error);

        if (onError) {
          onError(error);
        }

        if (showToast) {
          addToast('error', errorMessage || 'An error occurred');
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunction, onSuccess, onError, addToast, showToast, successMessage, errorMessage]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, isLoading, error, execute, reset };
}
