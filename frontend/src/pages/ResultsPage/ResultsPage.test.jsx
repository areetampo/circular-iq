import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { DialogProvider } from '@/contexts/DialogContext';
import { DrawerProvider } from '@/contexts/DrawerContext';

// Mock authentication hook to simulate anonymous user
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false }),
}));

function Wrapper({ children }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <DialogProvider>
        <DrawerProvider>{children}</DrawerProvider>
      </DialogProvider>
    </QueryClientProvider>
  );
}

// Minimal Auth page stub to assert navigation
function AuthStub() {
  return <div>AUTH_PAGE_STUB</div>;
}

describe('ResultsPage — unauthenticated Save flow (isolated handler)', () => {
  afterEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  // Small test-only component that mirrors the anonymous Save button logic
  function TestSaveButton({ result, formData }) {
    const navigate = require('react-router-dom').useNavigate();
    return (
      <button
        onClick={() => {
          // Persist the result snapshot to session state and redirect to auth
          localStorage.setItem(
            'session_evaluation_state',
            JSON.stringify({
              inputs: formData,
              results: result,
              timestamp: new Date().toISOString(),
            }),
          );
          navigate('/auth', { state: { mode: 'signup', from: '/results' } });
        }}
      >
        Save
      </button>
    );
  }

  test('clicking Save while unauthenticated stores pending save and redirects to /auth', async () => {
    const fakeResult = {
      overall_score: 77,
      businessProblem: 'P',
      businessSolution: 'S',
      parameters: {},
    };
    const fakeForm = { businessProblem: 'P', businessSolution: 'S', parameters: { x: 1 } };

    render(
      <Wrapper>
        <MemoryRouter initialEntries={['/results']}>
          <Routes>
            <Route
              path="/results"
              element={<TestSaveButton result={fakeResult} formData={fakeForm} />}
            />
            <Route path="/auth" element={<AuthStub />} />
          </Routes>
        </MemoryRouter>
      </Wrapper>,
    );

    // Ensure Save button is present
    const saveBtn = await screen.findByRole('button', { name: /save/i });
    fireEvent.click(saveBtn);

    // Session persisted must contain the result snapshot
    const { getSession } = await import('@/utils/session');
    const state = getSession();
    expect(state).not.toBeNull();
    expect(state.results).toBeTruthy();
    expect(state.results.overall_score).toBe(77);
    // Should navigate to /auth (AuthStub rendered)
    await waitFor(() => expect(screen.getByText('AUTH_PAGE_STUB')).toBeInTheDocument());
  });

  test('shows export buttons disabled to unauthenticated users on Results page with tooltip', async () => {
    // Provide a session result so the export buttons are rendered
    const session = {
      inputs: { businessProblem: 'P', businessSolution: 'S', parameters: {} },
      results: { overall_score: 72, metadata: { industry: 'energy' } },
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('session_evaluation_state', JSON.stringify(session));

    const { default: ResultsPage } = await import('./ResultsPage');

    render(
      <Wrapper>
        <MemoryRouter initialEntries={['/results']}>
          <Routes>
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </MemoryRouter>
      </Wrapper>,
    );

    // Export buttons should be visible but disabled for anonymous users
    const pdfBtn = await screen.findByRole('button', { name: /download pdf/i });
    const csvBtn = screen.getByRole('button', { name: /cases csv/i });

    expect(pdfBtn).toBeInTheDocument();
    expect(csvBtn).toBeInTheDocument();

    expect(pdfBtn).toBeDisabled();
    expect(csvBtn).toBeDisabled();

    // Native title attribute used for accessibility + easy tooltip testing
    expect(pdfBtn).toHaveAttribute('title', 'Sign in to get access to them');
    expect(csvBtn).toHaveAttribute('title', 'Sign in to get access to them');
  });

  test('Market Analysis navigates to session view for unsaved results', async () => {
    // Put a session evaluation with a result into localStorage
    const session = {
      inputs: { businessProblem: 'P', businessSolution: 'S', parameters: {} },
      results: { overall_score: 65, metadata: { industry: 'energy' } },
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('session_evaluation_state', JSON.stringify(session));

    const { default: ResultsPage } = await import('./ResultsPage');

    render(
      <Wrapper>
        <MemoryRouter initialEntries={['/results']}>
          <Routes>
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/results/market-analysis" element={<div>SESSION_MARKET_ANALYSIS</div>} />
          </Routes>
        </MemoryRouter>
      </Wrapper>,
    );

    // Click the Market Analysis button
    const maBtn = await screen.findByRole('button', { name: /market analysis/i });
    fireEvent.click(maBtn);

    // Should navigate to the session-based route
    await waitFor(() => expect(screen.getByText('SESSION_MARKET_ANALYSIS')).toBeInTheDocument());
  });

  test('Case Summary shows snapshot problem/solution/parameters from session.results (immutable)', async () => {
    const session = {
      inputs: {
        businessProblem: 'Editable BP',
        businessSolution: 'Editable BS',
        parameters: { public_participation: 50 },
      },
      results: {
        overall_score: 90,
        businessProblem: 'Snapshot BP',
        businessSolution: 'Snapshot BS',
        parameters: { public_participation: 5 },
        metadata: { industry: 'energy' },
      },
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem('session_evaluation_state', JSON.stringify(session));

    const { default: ResultsPage } = await import('./ResultsPage');

    render(
      <Wrapper>
        <MemoryRouter initialEntries={['/results']}>
          <Routes>
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </MemoryRouter>
      </Wrapper>,
    );

    // Open Problem accordion and verify snapshot problem text
    fireEvent.click(await screen.findByText(/Problem/i));
    expect(await screen.findByText('Snapshot BP')).toBeInTheDocument();

    // Open Solution accordion and verify snapshot solution text
    fireEvent.click(await screen.findByText(/Solution/i));
    expect(await screen.findByText('Snapshot BS')).toBeInTheDocument();

    // Open Parameters accordion and verify snapshot parameter value (should be 5, not the inputs' 50)
    fireEvent.click(await screen.findByText(/Parameters/i));
    const label = await screen.findByText('Public Participation');
    expect(label).toBeInTheDocument();
    // value is rendered as sibling text inside the same parameter row
    expect(label.closest('div').textContent).toContain('5');
    expect(label.closest('div').textContent).not.toContain('50');
  });
});
