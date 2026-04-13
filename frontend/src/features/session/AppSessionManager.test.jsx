import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Router } from 'react-router-dom';
import { vi } from 'vitest';

// Mock useAuth to control authentication state
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

// Provide a mock for dialog hooks so we can assert calls
const openSaveSpy = vi.fn();
const openRestoreSpy = vi.fn();

vi.mock('@/contexts/DialogContext', () => ({
  useGlobalDialog: () => ({
    openSaveAssessmentDialog: openSaveSpy,
    openResultsRestoreDialog: openRestoreSpy,
    dialog: { type: null },
  }),
}));

import { toast } from '@heroui/react';

import AppSessionManager from './AppSessionManager';

describe('AppSessionManager (pending-save post-login)', () => {
  beforeEach(() => {
    // spy on toast.info for input restoration notifications
    vi.spyOn(toast, 'info');
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('does NOT automatically open SaveAssessmentDialog after login (user must click Save)', async () => {
    const persistedSession = {
      inputs: { businessProblem: 'P', businessSolution: 'S', evaluationParameters: {} },
      results: {
        overall_score: 55,
        businessProblem: 'P',
        businessSolution: 'S',
        evaluationParameters: {},
      },
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('session_evaluation_state', JSON.stringify(persistedSession));

    render(
      <MemoryRouter initialEntries={['/results']}>
        <AppSessionManager />
      </MemoryRouter>,
    );

    // Should NOT auto-open the save dialog after authentication; user must click Save
    await new Promise((res) => setTimeout(res, 50));
    expect(openSaveSpy).not.toHaveBeenCalled();
  });

  it('does NOT show ResultsRestoreDialog when user is viewing /results with session.results present', async () => {
    const persisted = {
      inputs: {
        businessProblem: 'EXIST',
        businessSolution: 'KEEP',
        evaluationParameters: { a: 1 },
      },
      results: { overall_score: 42 },
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('session_evaluation_state', JSON.stringify(persisted));

    render(
      <MemoryRouter initialEntries={['/results']}>
        <AppSessionManager />
      </MemoryRouter>,
    );

    // Should NOT open the session-restore dialog when user is already on /results
    await new Promise((res) => setTimeout(res, 50));
    expect(openRestoreSpy).not.toHaveBeenCalled();

    const { getSession } = await import('@/utils/session');
    const state = getSession();
    expect(state).toEqual(persisted);
  });

  it('does NOT open session-restore prompt for inputs-only persisted sessions', async () => {
    const persisted = {
      inputs: { businessProblem: 'EXIST', businessSolution: 'KEEP', evaluationParameters: {} },
      results: null,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('session_evaluation_state', JSON.stringify(persisted));

    render(
      <MemoryRouter initialEntries={['/']}>
        <AppSessionManager />
      </MemoryRouter>,
    );

    // Inputs-only should NOT open the restore dialog on page load
    await new Promise((res) => setTimeout(res, 50));
    expect(openRestoreSpy).not.toHaveBeenCalled();
  });

  it('shows toast when page loads on home and inputs exist', async () => {
    const persisted = {
      inputs: { businessProblem: 'EXIST', businessSolution: 'KEEP', evaluationParameters: {} },
      results: null,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('session_evaluation_state', JSON.stringify(persisted));

    render(
      <MemoryRouter initialEntries={['/']}>
        <AppSessionManager />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith('Previous inputs restored.', expect.any(Object)),
    );
  });

  it('shows toast when navigating to home via SPA after initial load', async () => {
    const persisted = {
      inputs: { businessProblem: 'X', businessSolution: 'Y', evaluationParameters: {} },
      results: null,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('session_evaluation_state', JSON.stringify(persisted));

    // use custom history to control navigation
    const { createMemoryHistory } = await import('history');
    const history = createMemoryHistory({ initialEntries: ['/other'] });

    const { rerender } = render(
      <Router location={history.location} navigator={history}>
        <AppSessionManager />
      </Router>,
    );

    // ensure no toast initially
    await new Promise((r) => setTimeout(r, 50));
    expect(toast.info).not.toHaveBeenCalled();

    history.push('/');
    rerender(
      <Router location={history.location} navigator={history}>
        <AppSessionManager />
      </Router>,
    );

    await waitFor(() => expect(toast.info).toHaveBeenCalled());
  });

  it('does not show restore dialog when muted', () => {
    // Mock localStorage to return muted state
    const currentTime = Date.now();
    const futureTime = currentTime + 5 * 60 * 1000; // 5 minutes from now

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => {
          if (key === 'results_restore_dialog_muted') return 'true';
          if (key === 'results_restore_dialog_muted_expiration') return futureTime.toString();
          return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });

    // Mock session with results
    vi.mock('@/utils/session', () => ({
      getSession: () => ({
        inputs: { businessProblem: 'test', businessSolution: 'solution' },
        results: { overall_score: 42 },
        timestamp: new Date().toISOString(),
      }),
    }));

    render(
      <MemoryRouter>
        <AppSessionManager />
      </MemoryRouter>,
    );

    // Should not call openResultsRestoreDialog when muted
    expect(openRestoreSpy).not.toHaveBeenCalled();
  });

  it('shows restore dialog when mute has expired', () => {
    // Mock localStorage to return expired muted state
    const pastTime = Date.now() - 5 * 60 * 1000; // 5 minutes ago

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => {
          if (key === 'results_restore_dialog_muted') return 'true';
          if (key === 'results_restore_dialog_muted_expiration') return pastTime.toString();
          return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });

    // Mock session with results
    vi.mock('@/utils/session', () => ({
      getSession: () => ({
        inputs: { businessProblem: 'test', businessSolution: 'solution' },
        results: { overall_score: 42 },
        timestamp: new Date().toISOString(),
      }),
    }));

    render(
      <MemoryRouter>
        <AppSessionManager />
      </MemoryRouter>,
    );

    // Should call openResultsRestoreDialog when mute has expired
    expect(openRestoreSpy).toHaveBeenCalledWith({
      sessionData: {
        inputs: { businessProblem: 'test', businessSolution: 'solution' },
        results: { overall_score: 42 },
        timestamp: expect.any(String),
      },
      onDismiss: expect.any(Function),
    });
  });
});
