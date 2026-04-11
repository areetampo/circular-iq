// import { AppSessionManager } from '@/features/session';

// import AppProvider from './AppProvider';
// import AppRoutes from './AppRoutes';

/**
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
import { Dropdown, Label } from '@heroui/react';

import { Button } from '@/components/common';
// export default function App() {
//   return (
//     <AppProvider>
//       <AppSessionManager />
//       <AppRoutes />
//     </AppProvider>
//   );
// }
export default function App() {
  return (
    <Dropdown>
      <Button aria-label="Menu" variant="secondary">
        Actions
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu onAction={(key) => console.log(`Selected: ${key}`)}>
          <Dropdown.Item id="new-file" textValue="New file">
            <Label>New file</Label>
          </Dropdown.Item>
          <Dropdown.Item id="copy-link" textValue="Copy link">
            <Label>Copy link</Label>
          </Dropdown.Item>
          <Dropdown.Item id="edit-file" textValue="Edit file">
            <Label>Edit file</Label>
          </Dropdown.Item>
          <Dropdown.Item id="delete-file" textValue="Delete file" variant="danger">
            <Label>Delete file</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
