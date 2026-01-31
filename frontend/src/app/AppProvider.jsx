import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/hooks/use-toast';

// Initialize QueryClient with global error handling
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only show error toasts if we have an error message
      const errorMessage = error?.message || 'An error occurred while fetching data';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      // Only show error toasts for mutations if we have an error message
      const errorMessage = error?.message || 'An error occurred while processing your request';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
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
 * - Toaster for toast notifications (shadcn/ui)
 * - ReactQueryDevtools for development debugging
 */
export default function AppProvider({ children }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
          <Toaster />
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
