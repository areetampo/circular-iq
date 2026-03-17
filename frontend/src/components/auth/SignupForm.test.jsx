// Mock @heroui/react to include all components, including TextField
vi.mock('@heroui/react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    // override only what you need to stub
  };
});
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock supabase methods used by SignupForm
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn().mockResolvedValue({ user: { id: '123' }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ user: { id: '123' }, error: null }),
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

    renderWithRouter({ from: '/results' });

    // Fill form
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'tester' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'secret1' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'secret1' } });

    await act(async () => {
      fireEvent.click(screen.getByText(/Create Account/i));
    });

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

    renderWithRouter();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'alice' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'p@ssw0rd' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'p@ssw0rd' } });

    await act(async () => {
      fireEvent.click(screen.getByText(/Create Account/i));
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });
});
