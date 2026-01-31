import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';

// Initialize QueryClient with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
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
