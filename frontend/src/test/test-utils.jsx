/**
 * @module test-utils
 * @description Shared React Testing Library wrappers (router, auth, dialog, drawer, React Query).
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import PropTypes from 'prop-types';
import { MemoryRouter } from 'react-router-dom';

import { AuthProvider } from '@/contexts/AuthContext';
import { DialogProvider } from '@/contexts/DialogContext';
import { DrawerProvider } from '@/contexts/DrawerContext';

/**
 * React Query client with retries disabled for deterministic tests.
 *
 * @returns {import('@tanstack/react-query').QueryClient}
 */
export function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

/**
 * Wraps children with app providers used in integration tests.
 *
 * @param {Object} props
 * @param {import('react').ReactNode} props.children
 * @param {string[]} [props.initialEntries=['/']] - React Router memory history entries.
 * @returns {import('react').ReactElement}
 */
export function Providers({ children, initialEntries = ['/'] }) {
  const qc = createTestQueryClient();
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter
        initialEntries={Array.isArray(initialEntries) ? initialEntries : [initialEntries]}
      >
        <AuthProvider>
          <DialogProvider>
            <DrawerProvider>{children}</DrawerProvider>
          </DialogProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

Providers.propTypes = {
  children: PropTypes.node.isRequired,
  initialEntries: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
};

/**
 * Renders UI wrapped in {@link Providers} for integration tests.
 *
 * @param {import('react').ReactElement} ui - Component tree to render.
 * @param {Object} [options] - Passed through to `@testing-library/react` `render`.
 * @param {Object} [options.wrapperProps] - Props forwarded to `Providers`.
 * @returns {import('@testing-library/react').RenderResult}
 */
export function renderWithProviders(ui, options = {}) {
  const { wrapperProps, ...renderOptions } = options;
  const Wrapper = ({ children }) => <Providers {...(wrapperProps || {})}>{children}</Providers>;
  Wrapper.propTypes = {
    children: PropTypes.node.isRequired,
  };
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
