/**
 * @module AppProvider
 * @description Root provider stack: error boundary, auth, toasts, drawers, dialogs, React Query, and devtools.
 * Wraps the entire app with necessary providers for error handling,
 * authentication, dialogs, drawers, React Query, and loading indicators.
 *
 * Providers (in order):
 * - ErrorBoundary: Global error handling
 * - AuthProvider: Authentication state (SINGLE SHARED INSTANCE)
 * - Toast.Provider: Toast notifications
 * - DrawerProvider: Drawer state management
 * - DialogProvider: Dialog state management
 * - QueryClientProvider: React Query for data fetching
 * - GlobalLoadingBar: Loading indicator
 * - ReactQueryDevtools: Development debugging
 */

import { Toast, toast } from '@heroui/react';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import PropTypes from 'prop-types';
import { useEffect } from 'react';

import DrawerManager from '@/components/drawers/DrawerManager';
import { ErrorBoundary } from '@/components/error-boundaries';
import { GlobalLoadingBar } from '@/components/layout';
import { AuthProvider } from '@/contexts/AuthContext';
import { DialogProvider } from '@/contexts/DialogContext';
import { DrawerProvider } from '@/contexts/DrawerContext';

// Set of error message strings to skip showing toast notifications
const SKIPPED_TOASTS = {
  // Filter out pagination-related errors that we handle silently
  'Requested range not satisfiable': "Don't show toast for pagination errors",

  // Filter out compare/share validation errors that are handled by DetailsBadge
  'Invalid assessment ID': "Don't show toast for validation errors handled by forms",
  'One or more ids incorrect': "Don't show toast for validation errors handled by forms",
  'not public': "Don't show toast for validation errors handled by forms",
  'Validation failed': "Don't show toast for validation errors handled by forms",

  // Filter out assessment view page errors that are handled by DetailsDisplay
  'Failed to load shared assessment':
    "Don't show toast for errors handled by DetailsDisplay on view pages",
  'Failed to load assessment':
    "Don't show toast for errors handled by DetailsDisplay on view pages",
  'Assessment not publicly available':
    "Don't show toast for errors handled by DetailsDisplay on view pages",
  'One or more assessments not public':
    "Don't show toast for errors handled by DetailsDisplay on view pages",
  'Public assessment ID is required':
    "Don't show toast for errors handled by DetailsDisplay on view pages",
  'Both assessment ids are required and must be valid strings':
    "Don't show toast for errors handled by DetailsDisplay on view pages",
  'Assessment id is required':
    "Don't show toast for errors handled by DetailsDisplay on view pages",
};

// Initialize QueryClient with global error handling
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // Check if error message should be skipped
      const errorMsg = error?.message;
      if (errorMsg && Object.keys(SKIPPED_TOASTS).some((skipMsg) => errorMsg.includes(skipMsg))) {
        return;
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
 * Wraps the app with global providers and enables browser scroll restoration.
 *
 * @param {Object} props
 * @param {import('react').ReactNode} props.children - Routed page tree.
 * @returns {import('react').ReactElement}
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
          placement="top start"
          maxVisibleToasts={5}
          scaleFactor={0}
          gap={50}
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
