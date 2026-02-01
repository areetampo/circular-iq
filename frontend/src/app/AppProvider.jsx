import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Initialize QueryClient with global error handling
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only show error toasts if we have an error message
      const errorMessage = error?.message || 'An error occurred while fetching data';

      toast.error('Error', {
        description: errorMessage,
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      // Only show error toasts for mutations if we have an error message
      const errorMessage = error?.message || 'An error occurred while processing your request';

      toast.error('Error', {
        description: errorMessage,
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
 * - Sonner for toast notifications (shadcn/ui)
 * - ReactQueryDevtools for development debugging
 */
export default function AppProvider({ children }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
          <Sonner position="top-right" richColors closeButton />
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
