import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query Client configuration
 * Managing Server State & Remote Caching (Week 6 - Agenda 4)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes cache
      gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
      refetchOnWindowFocus: false,
    },
  },
});
