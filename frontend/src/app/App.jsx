import React from 'react';
import AppProvider from './AppProvider';
import AppRoutes from './AppRoutes';
import { AppSessionManager } from '@/components/AppSessionManager';

/**
 * App - Main application component (Phase 5 refactor)
 *
 * Clean separation of concerns:
 * - AppProvider: Wraps providers (ErrorBoundary, BrowserRouter, Toaster)
 * - AppRoutes: Defines all routes with lazy-loaded pages
 * - App.jsx: Minimal wrapper - NO logic, NO state, NO API calls
 *
 * All business logic, state, and API calls are handled by:
 * - Custom hooks in src/features/assessments/hooks/
 * - API layer in src/features/assessments/api/assessmentApi.js
 * - Page components that consume hooks
 */

export default function App() {
  return (
    <AppProvider>
      <AppSessionManager />
      <AppRoutes />
    </AppProvider>
  );
}
