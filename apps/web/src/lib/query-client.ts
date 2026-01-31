/**
 * TanStack Query client configuration.
 * Cache: 5min stale for list/read; 0 stale for mutations (invalidate on success).
 * Refetch: on window focus for fresh data when user returns.
 */
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
