import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { DialogProvider } from '@/contexts/DialogContext';
import { ModalProvider } from '@/contexts/ModalContext';

export function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

export function Providers({ children, initialEntries = ['/'] }) {
  const qc = createTestQueryClient();
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter
        initialEntries={Array.isArray(initialEntries) ? initialEntries : [initialEntries]}
      >
        <AuthProvider>
          <DialogProvider>
            <ModalProvider>{children}</ModalProvider>
          </DialogProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

export function renderWithProviders(ui, options = {}) {
  const { wrapperProps, ...renderOptions } = options;
  const Wrapper = ({ children }) => <Providers {...(wrapperProps || {})}>{children}</Providers>;
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export default Providers;
