/**
 * Root provider stack that wires error handling, auth, overlays, React Query, and global managers.
 */

import { Toast, toast } from '@heroui/react';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import PropTypes from 'prop-types';
import { useEffect } from 'react';

import DialogManager from '@/components/dialogs/DialogManager';
import DrawerManager from '@/components/drawers/DrawerManager';
import { ErrorBoundary } from '@/components/error-boundaries';
import { GlobalLoadingBar } from '@/components/layout';
import { AuthProvider } from '@/contexts/AuthContext';
import { DialogProvider } from '@/contexts/DialogContext';
import { DrawerProvider } from '@/contexts/DrawerContext';

/**
 * Error-message fragments whose matching query failures are already surfaced by the active page.
 */
const SKIPPED_TOASTS = {
  // Pagination range misses are expected when a page asks beyond available history.
  'Requested range not satisfiable': "Don't show toast for pagination errors",

  // Compare and share validation errors are displayed inline by DetailsBadge.
  'Invalid assessment ID': "Don't show toast for validation errors handled by forms",
  'One or more ids incorrect': "Don't show toast for validation errors handled by forms",
  'not public': "Don't show toast for validation errors handled by forms",
  'Validation failed': "Don't show toast for validation errors handled by forms",

  // Assessment view errors are displayed inline by DetailsDisplay.
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

/**
 * Shared React Query client with global toast handling for unexpected query and mutation failures.
 */
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
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
 * Provides application-wide context, overlay managers, React Query, and scroll restoration.
 */
export default function AppProvider({ children }) {
  // Back/forward navigation should restore the browser-managed scroll position.
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
              <DialogManager />
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
