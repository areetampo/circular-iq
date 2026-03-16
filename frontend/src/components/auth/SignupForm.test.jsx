import { fireEvent, render, waitFor } from '@testing-library/react';
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

// Mock useNavigate
const mockNavigate = vi.fn();
let mockLocationState = {};
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState }),
  };
});

import { supabase } from '@/lib/supabase';
import { getSession } from '@/utils/session';

import { SignupForm } from './SignupForm';

function renderWithRouter(locationState = {}) {
  mockLocationState = locationState;
  return render(
    <MemoryRouter initialEntries={['/auth']}>
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

    const { getByPlaceholderText, getByText } = renderWithRouter({ from: '/results' });

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
      expect(mockNavigate).toHaveBeenCalledWith('/results', { replace: true });
    });

    // persisted session inputs should remain intact in localStorage
    const post = getSession();
    expect(post).toEqual(expect.objectContaining({ inputs: persisted.inputs }));
  });

  it("defaults to '/' when no return state is provided", async () => {
    supabase.auth.signUp.mockResolvedValue({ error: null });
    supabase.auth.signInWithPassword.mockResolvedValue({ error: null });

    const { getByPlaceholderText, getByText } = renderWithRouter();

    fireEvent.change(getByPlaceholderText('create your username'), { target: { value: 'alice' } });
    fireEvent.change(getByPlaceholderText('create your password'), {
      target: { value: 'p@ssw0rd' },
    });
    fireEvent.change(getByPlaceholderText('confirm your password'), {
      target: { value: 'p@ssw0rd' },
    });

    fireEvent.click(getByText(/Create Account/i));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });
});
