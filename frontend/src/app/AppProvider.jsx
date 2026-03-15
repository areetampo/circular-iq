import PropTypes from 'prop-types';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toast, toast } from '@heroui/react';
import { ErrorBoundary } from '@/components/error-boundaries';
import GlobalLoadingBar from '@/components/common/GlobalLoadingBar';
import { AuthProvider } from '@/contexts/AuthContext';
import { DrawerProvider } from '@/contexts/DrawerContext'; // ← was ModalProvider
import { DialogProvider } from '@/contexts/DialogContext';
import DrawerManager from '@/components/drawers/DrawerManager'; // ← add this

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
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toast.Provider placement="top" max={5} gap={12} duration={4000} />
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
