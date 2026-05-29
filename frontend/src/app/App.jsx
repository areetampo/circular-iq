/**
 * Application shell that composes providers, session restoration, and routed pages.
 */
import { AppSessionManager } from '@/features/session';

import AppProvider from './AppProvider';
import AppRoutes from './AppRoutes';

/**
 * Renders the root provider stack, session restore manager, and application routes.
 *
 * @returns {import('react').ReactElement} Provider-wrapped application tree with session and route managers.
 */
export default function App() {
  return (
    <AppProvider>
      <AppSessionManager />
      <AppRoutes />
    </AppProvider>
  );
}
