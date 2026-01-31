import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';

/**
 * AppProvider wraps the entire app with necessary providers:
 * - BrowserRouter for routing
 * - ErrorBoundary for error handling
 * - Toaster for toast notifications (shadcn/ui)
 */
export default function AppProvider({ children }) {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        {children}
        <Toaster />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
