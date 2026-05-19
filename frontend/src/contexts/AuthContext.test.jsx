/**
 * @module AuthContext.test
 * @description Tests for AuthContext provider behaviour.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock supabase client used by AuthContext
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: () => {} } } })),
      signOut: vi.fn(),
    },
  },
}));

import { MemoryRouter } from 'react-router-dom';

import { AuthProvider, useAuth } from './AuthContext';

/** Test harness that exposes `useAuth` state as DOM text for assertions. */
function Consumer() {
  const { authLoading, isAuthenticated, user, profile } = useAuth();
  return (
    <div>
      <span data-testid="authLoading">{String(authLoading)}</span>
      <span data-testid="isAuthenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user?.id || ''}</span>
      <span data-testid="profile">{profile?.id || ''}</span>
    </div>
  );
}

describe('AuthProvider (init behavior)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('sets authLoading to false promptly even if profile fetch is slow', async () => {
    const { supabase } = await import('@/lib/supabase');

    // supabase.getSession resolves immediately with a session
    supabase.auth.getSession.mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'tok-123',
          user: { id: 'u-1', user_metadata: { username: 'tester' } },
        },
      },
    });

    // Make global.fetch return resolved profile data immediately
    const originalFetch = global.fetch;
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({ id: 'profile-1' }) }),
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      </MemoryRouter>,
    );

    // authLoading should become false quickly
    await waitFor(() => expect(screen.getByTestId('authLoading').textContent).toBe('false'));

    // profile should eventually be populated from fetch
    await waitFor(() => expect(screen.getByTestId('profile').textContent).toBe('profile-1'), {
      timeout: 5000,
    });

    // restore
    global.fetch = originalFetch;
  });

  it('does NOT mutate persisted session state on auth init', async () => {
    const { supabase } = await import('@/lib/supabase');

    // Existing persisted session should remain untouched by AuthProvider
    const existingSessionState = {
      inputs: {
        businessProblem: 'EXISTING',
        businessSolution: 'KEEP',
        evaluationParameters: { x: 1 },
      },
      results: { overall_score: 10 },
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('session_evaluation_state', JSON.stringify(existingSessionState));

    // supabase.getSession resolves with a session (user logged in)
    supabase.auth.getSession.mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'tok-xyz',
          user: { id: 'user-1', user_metadata: { username: 'tester' } },
        },
      },
    });

    // Mock profile fetch used by fetchUserProfile
    const originalFetch = global.fetch;
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({ id: 'profile-1' }) }),
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      </MemoryRouter>,
    );

    // Wait for auth initialization to complete
    await waitFor(() => expect(screen.getByTestId('authLoading').textContent).toBe('false'), {
      timeout: 5000,
    });

    // AuthProvider should NOT create the assessment automatically
    const assessmentApi = await import('@/features/assessments/api/assessmentApi');
    const spy = vi.spyOn(assessmentApi, 'createAssessment');
    expect(spy).not.toHaveBeenCalled();

    // session_evaluation_state should be left unchanged
    const { getSession } = await import('@/utils/session');
    const state = getSession();
    expect(state).toEqual(existingSessionState);

    // restore fetch
    global.fetch = originalFetch;
  });

  it('leaves persisted session state unchanged on auth init when only inputs/results exist', async () => {
    const { supabase } = await import('@/lib/supabase');

    // Persisted session already contains inputs + results (edge case)
    const persistedSessionState = {
      inputs: { businessProblem: 'P2', businessSolution: 'S2', evaluationParameters: {} },
      results: {
        overall_score: 88,
        businessProblem: 'P2',
        businessSolution: 'S2',
        evaluationParameters: {},
      },
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('session_evaluation_state', JSON.stringify(persistedSessionState));

    supabase.auth.getSession.mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'tok-abc',
          user: { id: 'user-2', user_metadata: { username: 'tester2' } },
        },
      },
    });

    const originalFetch = global.fetch;
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({ id: 'profile-2' }) }),
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      </MemoryRouter>,
    );

    // Wait for auth initialization to complete
    await waitFor(() => expect(screen.getByTestId('authLoading').textContent).toBe('false'), {
      timeout: 5000,
    });

    // AuthProvider should NOT auto-save nor mutate persisted session
    const assessmentApi = await import('@/features/assessments/api/assessmentApi');
    const spy = vi.spyOn(assessmentApi, 'createAssessment');
    expect(spy).not.toHaveBeenCalled();

    // session_evaluation_state should be left unchanged
    const { getSession: getSession2 } = await import('@/utils/session');
    const state2 = getSession2();
    expect(state2).toEqual(persistedSessionState);

    global.fetch = originalFetch;
  });
});
