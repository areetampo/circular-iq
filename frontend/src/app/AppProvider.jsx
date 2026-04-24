import { Toast, toast } from '@heroui/react';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import PropTypes from 'prop-types';
import { useEffect } from 'react';

import GlobalLoadingBar from '@/components/common/GlobalLoadingBar';
import DrawerManager from '@/components/drawers/DrawerManager';
import { ErrorBoundary } from '@/components/error-boundaries';
import { AuthProvider } from '@/contexts/AuthContext';
import { DialogProvider } from '@/contexts/DialogContext';
import { DrawerProvider } from '@/contexts/DrawerContext';

// Initialize QueryClient with global error handling
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // Filter out pagination-related errors that we handle silently
      if (error?.message?.includes('Requested range not satisfiable')) {
        return; // Don't show toast for pagination errors
      }
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
 * - ErrorBoundary for error handling
 * - Toast.Provider for toast notifications
 * - AuthProvider for authentication state (SINGLE SHARED INSTANCE) ← NEW
 * - ModalProvider for modal state (global modals)
 * - DialogProvider for dialog state (global dialogs) ← NEW
 * - QueryClientProvider for React Query
 * - GlobalLoadingBar for loading indicator
 * - ReactQueryDevtools for development debugging
 */
export default function AppProvider({ children }) {
  // Enable browser scroll restoration for back/forward navigation
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'auto';
    }
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toast.Provider
          placement="top"
          maxVisibleToasts={5}
          scaleFactor={0}
          gap={60}
          duration={3500}
        />
        <DrawerProvider>
          <DialogProvider>
            <QueryClientProvider client={queryClient}>
              <GlobalLoadingBar />
              {children}
              <DrawerManager />
              <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
          </DialogProvider>
        </DrawerProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
