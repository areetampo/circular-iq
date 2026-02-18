import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
    openSessionRestoreDialog: openRestoreSpy,
    dialog: { type: null },
  }),
}));

import AppSessionManager from './AppSessionManager';
import DIALOGS from '@/components/dialogs/dialogTypes';

describe('AppSessionManager (pending-save post-login)', () => {
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('does NOT automatically open SaveAssessmentDialog after login (user must click Save)', async () => {
    const persistedSession = {
      inputs: { businessProblem: 'P', businessSolution: 'S', parameters: {} },
      results: { overall_score: 55, businessProblem: 'P', businessSolution: 'S', parameters: {} },
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

  it('does NOT show SessionRestoreDialog when user is viewing /results with session.results present', async () => {
    const persisted = {
      inputs: { businessProblem: 'EXIST', businessSolution: 'KEEP', parameters: { a: 1 } },
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
      inputs: { businessProblem: 'EXIST', businessSolution: 'KEEP', parameters: {} },
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
});
