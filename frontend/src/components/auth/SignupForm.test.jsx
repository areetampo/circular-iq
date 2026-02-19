import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock supabase methods used by SignupForm
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabase';
import { SignupForm } from './SignupForm';
import { getSession } from '@/utils/session';

function renderWithRouter(initialEntries = ['/auth']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <SignupForm onSwitchToLogin={() => {}} />
    </MemoryRouter>,
  );
}

describe('SignupForm redirects and preserves session', () => {
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('redirects to `from` location after successful signup and preserves session inputs', async () => {
    // Pre-populate persisted session (pending save from ResultsPage)
    const persisted = {
      inputs: {
        businessProblem: 'P1-existing',
        businessSolution: 'S1-existing',
        parameters: { x: 2 },
      },
      results: { overall_score: 10 },
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('session_evaluation_state', JSON.stringify(persisted));

    // Mock successful signUp + signIn
    supabase.auth.signUp.mockResolvedValue({ error: null });
    supabase.auth.signInWithPassword.mockResolvedValue({ error: null });

    const { getByPlaceholderText, getByText } = renderWithRouter([
      { pathname: '/auth', state: { from: '/results' } },
    ]);

    // Fill form
    fireEvent.change(getByPlaceholderText('create your username'), { target: { value: 'tester' } });
    fireEvent.change(getByPlaceholderText('create your password'), {
      target: { value: 'secret1' },
    });
    fireEvent.change(getByPlaceholderText('confirm your password'), {
      target: { value: 'secret1' },
    });

    fireEvent.click(getByText(/Create Account/i));

    await waitFor(() => {
      expect(window.location.href.endsWith('/results')).toBe(true);
    });

    // persisted session inputs should remain intact in localStorage
    const post = getSession();
    expect(post).toEqual(expect.objectContaining({ inputs: persisted.inputs }));
  });

  it("defaults to '/' when no return state is provided", async () => {
    supabase.auth.signUp.mockResolvedValue({ error: null });
    supabase.auth.signInWithPassword.mockResolvedValue({ error: null });

    const { getByPlaceholderText, getByText } = renderWithRouter(['/auth']);

    fireEvent.change(getByPlaceholderText('create your username'), { target: { value: 'alice' } });
    fireEvent.change(getByPlaceholderText('create your password'), {
      target: { value: 'p@ssw0rd' },
    });
    fireEvent.change(getByPlaceholderText('confirm your password'), {
      target: { value: 'p@ssw0rd' },
    });

    fireEvent.click(getByText(/Create Account/i));

    await waitFor(() => {
      expect(window.location.href.endsWith('/')).toBe(true);
    });
  });
});
