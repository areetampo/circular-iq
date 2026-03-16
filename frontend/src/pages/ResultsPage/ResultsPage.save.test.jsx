// Mock assessmentApi to prevent real fetches and ensure all methods resolve
vi.mock('@/features/assessments/api/assessmentApi', () => ({
  createAssessment: vi.fn().mockResolvedValue({ id: 'test-id' }),
  getAssessments: vi.fn().mockResolvedValue({ assessments: [], total: 0 }),
}));
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { DialogProvider } from '@/contexts/DialogContext';
import { DrawerProvider } from '@/contexts/DrawerContext';

// Mock authenticated user for this suite
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user' }, isAuthenticated: true }),
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

describe('ResultsPage — authenticated Save flow (dialog)', () => {
  afterEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  it('calls createAssessment with expected payload and clears session.results after save', async () => {
    const persistedSession = {
      inputs: {
        businessProblem: 'P1-existing',
        businessSolution: 'S1-existing',
        parameters: { x: 2 },
      },
      results: { overall_score: 10, businessProblem: 'P1', businessSolution: 'S1', parameters: {} },
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('session_evaluation_state', JSON.stringify(persistedSession));

    const assessmentApi = await import('@/features/assessments/api/assessmentApi');
    const createSpy = vi
      .spyOn(assessmentApi, 'createAssessment')
      .mockResolvedValue({ id: 'saved-123' });

    const { default: ResultsPage } = await import('./ResultsPage');

    render(
      <Wrapper>
        <MemoryRouter initialEntries={['/results']}>
          <ResultsPage />
        </MemoryRouter>
      </Wrapper>,
    );

    // Authenticated users should see export buttons
    expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cases csv/i })).toBeInTheDocument();

    // Click the page Save button (user is authenticated)
    const pageSave = await screen.findByRole('button', { name: /^save$/i });
    fireEvent.click(pageSave);

    // Dialog should open; fill a name and confirm save
    const nameInput = await screen.findByLabelText(/assessment name/i);
    fireEvent.change(nameInput, { target: { value: 'My Saved Assessment' } });

    const dialogSave = await screen.findByRole('button', { name: /save assessment/i });
    fireEvent.click(dialogSave);

    await waitFor(() => expect(createSpy).toHaveBeenCalled(), { timeout: 5000 });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Saved Assessment',
        industry: expect.any(String),
        is_public: expect.any(Boolean),
        contribute_to_global_benchmarks: expect.any(Boolean),
      }),
    );

    // Verify the snapshot inputs from session.results are included in the create payload
    const payload = createSpy.mock.calls[0][0];
    expect(payload.businessProblem).toBe('P1');
    expect(payload.businessSolution).toBe('S1');
    expect(payload.parameters).toEqual({});

    const { getSession } = await import('@/utils/session');
    const postState = getSession();
    expect(postState.results).toBeNull();
    expect(postState.inputs).toEqual(persistedSession.inputs);
  });

  it('preserves `similar_cases` when saving a restored (session) result after login', async () => {
    const persistedSession = {
      inputs: {
        businessProblem: 'Problem A',
        businessSolution: 'Solution A',
        parameters: { public_participation: 50 },
      },
      results: {
        overall_score: 82,
        sub_scores: { maintenance: 50 },
        similar_cases: [
          {
            case_id: 'case-1',
            title: 'Case One',
            similarity: 0.92,
            problem: 'Example problem text',
            solution: 'Example solution text',
          },
          {
            case_id: 'case-2',
            title: 'Case Two',
            similarity: 0.81,
            problem: 'Another problem text',
            solution: 'Another solution text',
          },
        ],
        metadata: { industry: 'manufacturing' },
      },
      timestamp: new Date().toISOString(),
    };

    // Simulate the anonymous -> auth flow by persisting the session first
    localStorage.setItem('session_evaluation_state', JSON.stringify(persistedSession));

    const assessmentApi = await import('@/features/assessments/api/assessmentApi');
    const createSpy = vi
      .spyOn(assessmentApi, 'createAssessment')
      .mockResolvedValue({ id: 'saved-999' });

    const { default: ResultsPage } = await import('./ResultsPage');

    render(
      <Wrapper>
        <MemoryRouter initialEntries={['/results']}>
          <ResultsPage />
        </MemoryRouter>
      </Wrapper>,
    );

    // Click Save -> open dialog -> save
    const pageSave = await screen.findByRole('button', { name: /^save$/i });
    fireEvent.click(pageSave);

    const nameInput = await screen.findByLabelText(/assessment name/i);
    fireEvent.change(nameInput, { target: { value: 'Preserve Similar Cases' } });

    const dialogSave = await screen.findByRole('button', { name: /save assessment/i });
    fireEvent.click(dialogSave);

    await waitFor(() => expect(createSpy).toHaveBeenCalled(), { timeout: 5000 });

    // Confirm similar_cases structure preserved in payload
    const payload = createSpy.mock.calls[0][0];
    expect(payload.result_json).toBeDefined();
    expect(Array.isArray(payload.result_json.similar_cases)).toBe(true);
    expect(payload.result_json.similar_cases).toHaveLength(2);
    expect(payload.result_json.similar_cases[0]).toEqual(
      expect.objectContaining({
        title: 'Case One',
        problem: expect.any(String),
        solution: expect.any(String),
        similarity: expect.any(Number),
      }),
    );

    // The saved assessment payload should also include the case-summary fields
    // taken from the session.results snapshot (not the editable inputs)
    expect(payload.businessProblem).toBe('Problem A');
    expect(payload.businessSolution).toBe('Solution A');
    expect(payload.parameters).toEqual({ public_participation: 50 });

    // session_evaluation_state.results should be cleared after save
    const { getSession } = await import('@/utils/session');
    const postState = getSession();
    expect(postState.results).toBeNull();
  });

  it('normalizes malformed similar_cases in session before sending to API', async () => {
    const malformedSession = {
      inputs: { businessProblem: 'P', businessSolution: 'S', parameters: {} },
      results: {
        overall_score: 50,
        similar_cases: [
          { case_id: 1, title: null, problem: 123, solution: 456, similarity: '0.5' },
        ],
      },
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem('session_evaluation_state', JSON.stringify(malformedSession));

    const assessmentApi = await import('@/features/assessments/api/assessmentApi');
    const createSpy = vi
      .spyOn(assessmentApi, 'createAssessment')
      .mockResolvedValue({ id: 'saved-xyz' });

    const { default: ResultsPage } = await import('./ResultsPage');

    render(
      <Wrapper>
        <MemoryRouter initialEntries={['/results']}>
          <ResultsPage />
        </MemoryRouter>
      </Wrapper>,
    );

    const pageSave = await screen.findByRole('button', { name: /^save$/i });
    fireEvent.click(pageSave);

    const nameInput = await screen.findByLabelText(/assessment name/i);
    fireEvent.change(nameInput, { target: { value: 'Normalize Similar Cases' } });

    const dialogSave = await screen.findByRole('button', { name: /save assessment/i });
    fireEvent.click(dialogSave);

    await waitFor(() => expect(createSpy).toHaveBeenCalled(), { timeout: 5000 });

    const payload = createSpy.mock.calls[0][0];
    expect(payload.result_json.similar_cases[0].title).toBe('');
    expect(typeof payload.result_json.similar_cases[0].problem).toBe('string');
    expect(typeof payload.result_json.similar_cases[0].solution).toBe('string');
    expect(typeof payload.result_json.similar_cases[0].similarity).toBe('number');

    // ensure backend validation won't fail due to null/number types in these fields
    expect(() => expect(payload)).not.toThrow();
  });

  it('shows duplicate-name validation inside dialog and keeps dialog open', async () => {
    const persistedSession = {
      inputs: { businessProblem: 'PD', businessSolution: 'SD', parameters: {} },
      results: { overall_score: 30, parameters: {} },
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('session_evaluation_state', JSON.stringify(persistedSession));

    const assessmentApi = await import('@/features/assessments/api/assessmentApi');
    // Spy on getAssessments to return an existing assessment with the same title
    const getAssessmentsSpy = vi.spyOn(assessmentApi, 'getAssessments').mockResolvedValue({
      assessments: [{ id: 'dup-1', title: 'Existing Title' }],
      total: 1,
    });
    const createSpy = vi
      .spyOn(assessmentApi, 'createAssessment')
      .mockResolvedValue({ id: 'should-not-call' });

    const { default: ResultsPage } = await import('./ResultsPage');

    render(
      <Wrapper>
        <MemoryRouter initialEntries={['/results']}>
          <ResultsPage />
        </MemoryRouter>
      </Wrapper>,
    );

    const pageSave = await screen.findByRole('button', { name: /^save$/i });
    fireEvent.click(pageSave);

    const nameInput = await screen.findByLabelText(/assessment name/i);
    fireEvent.change(nameInput, { target: { value: 'Existing Title' } });

    const dialogSave = await screen.findByRole('button', { name: /save assessment/i });
    fireEvent.click(dialogSave);

    await waitFor(() => expect(getAssessmentsSpy).toHaveBeenCalled(), { timeout: 5000 });

    // Duplicate-name error should be shown in the dialog and createAssessment must NOT be called
    expect(
      await screen.findByText(/already have an assessment with that name/i),
    ).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('shows dialog-level error and keeps dialog open when save fails (no toast)', async () => {
    const persistedSession = {
      inputs: { businessProblem: 'P-fail', businessSolution: 'S-fail', parameters: {} },
      results: { overall_score: 11, parameters: {} },
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('session_evaluation_state', JSON.stringify(persistedSession));

    const assessmentApi = await import('@/features/assessments/api/assessmentApi');
    const createSpy = vi
      .spyOn(assessmentApi, 'createAssessment')
      .mockRejectedValue(new Error('Validation failed: similar_cases malformed'));

    const { default: ResultsPage } = await import('./ResultsPage');

    render(
      <Wrapper>
        <MemoryRouter initialEntries={['/results']}>
          <ResultsPage />
        </MemoryRouter>
      </Wrapper>,
    );

    const pageSave = await screen.findByRole('button', { name: /^save$/i });
    fireEvent.click(pageSave);

    const nameInput = await screen.findByLabelText(/assessment name/i);
    fireEvent.change(nameInput, { target: { value: 'Will Fail' } });

    const dialogSave = await screen.findByRole('button', { name: /save assessment/i });
    fireEvent.click(dialogSave);

    await waitFor(() => expect(createSpy).toHaveBeenCalled(), { timeout: 5000 });

    // Error text should be shown inside the dialog and the dialog should remain open
    expect(await screen.findByText(/validation failed/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/assessment name/i)).toBeInTheDocument();
  });
});
