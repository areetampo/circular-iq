/**
 * @module App
 * @description Root application component with minimal wrapper logic.
 * Delegates to AppProvider for providers and AppRoutes for routing.
 * Contains no business logic, state, or API calls.
 *
 * Architecture:
 * - AppProvider: Wraps providers (ErrorBoundary, BrowserRouter, Toaster)
 * - AppRoutes: Defines all routes with lazy-loaded pages
 * - App.jsx: Minimal wrapper - NO logic, NO state, NO API calls
 *
 * All business logic, state, and API calls are handled by:
 * - Custom hooks in src/features/assessments/hooks/
 * - API layer in src/features/assessments/api/assessmentApi.js
 * - Page components that consume hooks
 */
import { AppSessionManager } from '@/features/session';

import AppProvider from './AppProvider';
import AppRoutes from './AppRoutes';

/**
 * Root application component with minimal wrapper logic.
 * @returns {import('react').ReactElement}
 */
export default function App() {
  return (
    <AppProvider>
      <AppSessionManager />
      <AppRoutes />
    </AppProvider>
  );
}
