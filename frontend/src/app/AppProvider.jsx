import React from 'react';
import PropTypes from 'prop-types';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toast, toast } from '@heroui/react';
import { ErrorBoundary } from '@/components/error-boundaries';
import GlobalLoadingBar from '@/components/common/GlobalLoadingBar';

// Initialize QueryClient with global error handling
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      const errorMessage = error?.message || 'An error occurred while fetching data';
      toast.danger(errorMessage);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      const errorMessage = error?.message || 'An error occurred while processing your request';
      toast.danger(errorMessage);
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 10, // 10 minutes - garbage collection time (formerly cacheTime)
    },
  },
});

/**
 * AppProvider wraps the entire app with necessary providers:
 * - QueryClientProvider for React Query
 * - BrowserRouter for routing
 * - ErrorBoundary for error handling
 * - HeroUI Toast for toast notifications
 * - ReactQueryDevtools for development debugging
 */
export default function AppProvider({ children }) {
  return (
    <ErrorBoundary>
      <Toast.Provider placement="top" />
      <QueryClientProvider client={queryClient}>
        <GlobalLoadingBar />
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
