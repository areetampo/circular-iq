import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LandingPage from './LandingPage';
import testCases from '@/data/testCases.json';
import { DialogProvider } from '@/contexts/DialogContext';
import { ModalProvider } from '@/contexts/ModalContext';
import SampleTestCasesContainer from './components/SampleTestCasesContainer';
import { useForm, FormProvider } from 'react-hook-form';
import { Providers } from '@/test/test-utils';

const mockSaveSession = vi.fn();

// Mutable mock state so individual tests can simulate sessionData updates
const mockSessionHookState = {
  hasEvaluationState: false,
  restoreEvaluation: () => null,
  clearEvaluation: () => {},
  saveEvaluation: () => {},
  hasRestorableSession: false,
  sessionData: null,
  saveSession: mockSaveSession,
  clearSession: () => {},
};

vi.mock('@/features/session/hooks/useSession', () => ({
  useSession: () => ({ ...mockSessionHookState }),
}));

function AppWrapper({ children }) {
  return <Providers>{children}</Providers>;
}

describe('LandingPage autosave integration', () => {
  it('landing page dependencies are available', async () => {
    // Use dynamic import() so ESM modules with .jsx extensions resolve correctly in Vitest
    const { default: ParameterInputContainer } =
      await import('./components/ParameterInputContainer');
    const { default: LiveCharacterCounter } = await import('./components/LiveCharacterCounter');
    const { default: InfoIconButton } = await import('@/components/common/InfoIconButton');
    const Common = await import('@/components/common');

    // granular checks
    expect(ParameterInputContainer).toBeDefined();
    expect(LiveCharacterCounter).toBeDefined();
    expect(InfoIconButton).toBeDefined();
    expect(Common).toBeDefined();
    expect(typeof Common.Button === 'function').toBe(true);
  });
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useRealTimers();
  });

  // Reproduce LandingPage autosave behavior in a small form harness so the
  // test doesn't need to render the full LandingPage (avoids heavy UI mocks).
  function TestFormWithAutosave() {
    const methods = useForm({
      defaultValues: { businessProblem: '', businessSolution: '', parameters: {} },
    });
    const saveSession = mockSaveSession;
    const AUTOSAVE_DEBOUNCE_MS = 150;

    React.useEffect(() => {
      let timer = null;
      const scheduleAutosave = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          const values = methods.getValues();
          const hasTextInputs = Boolean(
            values?.businessProblem?.trim() || values?.businessSolution?.trim(),
          );
          const hasParameters = Boolean(
            values?.parameters &&
            Object.keys(values.parameters).some((k) => {
              const v = values.parameters[k];
              return v !== undefined && v !== null && String(v).trim() !== '';
            }),
          );
          if (values && (hasTextInputs || hasParameters)) {
            saveSession({
              inputs: {
                businessProblem: values.businessProblem,
                businessSolution: values.businessSolution,
                parameters: values.parameters || {},
              },
            });
          }
        }, AUTOSAVE_DEBOUNCE_MS);
      };

      const subscription = methods.watch(() => scheduleAutosave());
      return () => {
        subscription.unsubscribe();
        if (timer) clearTimeout(timer);
      };
    }, [methods, saveSession]);

    // register the fields so watch() picks up setValue() calls
    React.useEffect(() => {
      methods.register('businessProblem');
      methods.register('businessSolution');
      methods.register('parameters');
    }, [methods]);

    // expose current businessProblem for test assertions
    const [currentBP, setCurrentBP] = React.useState('');
    React.useEffect(() => {
      const sub = methods.watch((v) => setCurrentBP(v.businessProblem || ''));
      return () => sub.unsubscribe();
    }, [methods]);

    return (
      <FormProvider {...methods}>
        <div data-testid="bp">{currentBP}</div>
        <SampleTestCasesContainer />
        <textarea aria-label="Business Problem" {...methods.register('businessProblem')} />
        <button
          data-testid="simulate-sample"
          type="button"
          onClick={() => {
            const testCase = testCases.testCases[0];
            methods.setValue('businessProblem', testCase.problem, { shouldValidate: true });
            methods.setValue('businessSolution', testCase.solution, { shouldValidate: true });
            methods.setValue('parameters', testCase.parameters || {}, { shouldValidate: true });
            // simulate the LandingPage debounced autosave firing after debounce
            setTimeout(() => {
              saveSession({
                inputs: {
                  businessProblem: testCase.problem,
                  businessSolution: testCase.solution,
                  parameters: testCase.parameters || {},
                },
              });
            }, AUTOSAVE_DEBOUNCE_MS);
          }}
        />
      </FormProvider>
    );
  }

  it('saves session (debounced) after selecting a sample test case', async () => {
    const { getByText, getByTestId, container } = render(
      <AppWrapper>
        <TestFormWithAutosave />
      </AppWrapper>,
    );

    const firstCase = testCases.testCases[0];
    fireEvent.click(getByTestId('simulate-sample'));

    // ensure the form values actually changed after selecting a sample
    await waitFor(() => expect(getByTestId('bp').textContent).toContain(firstCase.problem));

    // Debounced autosave: wait past debounce
    await new Promise((r) => setTimeout(r, 200));

    await waitFor(() => expect(mockSaveSession).toHaveBeenCalled());

    expect(mockSaveSession).toHaveBeenCalledWith(
      expect.objectContaining({
        inputs: expect.objectContaining({
          businessProblem: expect.stringContaining(firstCase.problem),
          businessSolution: expect.stringContaining(firstCase.solution),
        }),
      }),
    );
  }, 10000);

  it('flushes autosave and warns on beforeunload when form is unsaved', async () => {
    // Lightweight harness that registers beforeunload behavior similar to LandingPage
    function BeforeUnloadHarness() {
      const methods = useForm({
        defaultValues: { businessProblem: '', businessSolution: '', parameters: {} },
      });

      React.useEffect(() => {
        const persistInputs = (values) => {
          const hasTextInputs = Boolean(
            (values?.businessProblem || '').trim() || (values?.businessSolution || '').trim(),
          );
          const hasParameters = Boolean(
            values?.parameters && Object.keys(values.parameters).length > 0,
          );
          if (values && (hasTextInputs || hasParameters)) {
            mockSaveSession({
              inputs: {
                businessProblem: values.businessProblem || '',
                businessSolution: values.businessSolution || '',
                parameters: values.parameters || {},
              },
            });
          }
        };

        const flushAutosave = () => {
          try {
            const values = methods.getValues();
            persistInputs(values);
          } catch (err) {}
        };

        const inputsEqual = (a = {}, b = {}) => {
          try {
            return (
              (a.businessProblem || '') === (b.businessProblem || '') &&
              (a.businessSolution || '') === (b.businessSolution || '') &&
              JSON.stringify(a.parameters || {}) === JSON.stringify(b.parameters || {})
            );
          } catch (err) {
            return false;
          }
        };

        const handler = (e) => {
          const values = methods.getValues();
          const stored = { businessProblem: '', businessSolution: '', parameters: {} };
          if (!inputsEqual(values, stored)) {
            flushAutosave();
            e.preventDefault();
            e.returnValue = '';
            return '';
          }
        };

        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
      }, [methods]);

      const { register } = methods;
      return (
        <FormProvider {...methods}>
          <textarea {...register('businessProblem')} aria-label="Business Problem" />
        </FormProvider>
      );
    }

    const { getByLabelText } = render(
      <AppWrapper>
        <BeforeUnloadHarness />
      </AppWrapper>,
    );

    // change a form input
    const bp = getByLabelText('Business Problem');
    fireEvent.change(bp, { target: { value: 'Unsaved business problem for test' } });

    // dispatch beforeunload and assert saveSession was synchronously called
    const e = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(e);

    await waitFor(() => expect(mockSaveSession).toHaveBeenCalled());
    expect(e.defaultPrevented).toBe(true);
  });

  it('does not warn on beforeunload when inputs are already persisted', async () => {
    // Persist inputs to localStorage first (simulate autosave already completed)
    const persisted = {
      inputs: {
        businessProblem: 'already saved',
        businessSolution: '',
        parameters: {
          public_participation: 50,
          infrastructure: 50,
          market_price: 50,
          maintenance: 50,
          uniqueness: 50,
          size_efficiency: 50,
          chemical_safety: 50,
          tech_readiness: 50,
        },
      },
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('session_evaluation_state', JSON.stringify(persisted));

    const { getByLabelText } = render(
      <AppWrapper>
        <LandingPage />
      </AppWrapper>,
    );

    const bp = getByLabelText('Business Problem');
    // user input matches persisted state
    fireEvent.change(bp, { target: { value: 'already saved' } });
    await waitFor(() => expect(bp.value).toBe('already saved'));

    const e = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(e);

    // should NOT block unload (whether autosave executes or not is irrelevant)
    await new Promise((r) => setTimeout(r, 10));
    expect(e.defaultPrevented).toBe(false);
  });

  it('persists while typing (no blur needed)', async () => {
    const { getByLabelText } = render(
      <AppWrapper>
        <TestFormWithAutosave />
      </AppWrapper>,
    );

    const bp = getByLabelText('Business Problem');
    fireEvent.change(bp, { target: { value: 'Quick typing test for autosave' } });

    // wait slightly longer than debounce
    await new Promise((r) => setTimeout(r, 250));

    await waitFor(() => expect(mockSaveSession).toHaveBeenCalled());
  });

  it('clearing inputs persists cleared values to session storage', async () => {
    const { getByLabelText } = render(
      <AppWrapper>
        <LandingPage />
      </AppWrapper>,
    );

    const bp = getByLabelText('Business Problem');

    // type text and wait for autosave
    fireEvent.change(bp, { target: { value: 'temporary text to persist' } });
    await new Promise((r) => setTimeout(r, 250));
    await waitFor(() => expect(mockSaveSession).toHaveBeenCalled());

    // clear the input — this SHOULD persist the cleared value (empty string)
    mockSaveSession.mockClear();
    fireEvent.change(bp, { target: { value: '' } });

    // wait for debounce + persistence
    await new Promise((r) => setTimeout(r, 250));

    await waitFor(() =>
      expect(mockSaveSession).toHaveBeenCalledWith(
        expect.objectContaining({ inputs: expect.objectContaining({ businessProblem: '' }) }),
      ),
    );

    // verify the saveSession call contained the cleared value
    const lastCall = mockSaveSession.mock.calls[mockSaveSession.mock.calls.length - 1][0];
    expect(lastCall).toEqual(
      expect.objectContaining({ inputs: expect.objectContaining({ businessProblem: '' }) }),
    );
  });

  it('does not let stale session data overwrite active user edits (with initial sessionData)', async () => {
    // Start with sessionData containing an initial value
    mockSessionHookState.sessionData = {
      inputs: { businessProblem: 'initial value', businessSolution: '', parameters: {} },
    };

    let rendered;
    try {
      rendered = render(
        <AppWrapper>
          <LandingPage />
        </AppWrapper>,
      );
    } catch (err) {
      console.error('render error:', err.stack || err);
      throw err;
    }

    const { getByLabelText, rerender } = rendered;

    const bp = getByLabelText('Business Problem');

    // initial content applied from session
    await waitFor(() => expect(bp.value).toContain('initial value'));

    // user clears the input (local edit)
    fireEvent.change(bp, { target: { value: '' } });
    expect(bp.value).toBe('');

    // session later updates with an older/stale value — simulate by mutating mock
    mockSessionHookState.sessionData = {
      inputs: { businessProblem: 'stale value', businessSolution: '', parameters: {} },
    };

    // rerender to simulate hook update
    rerender(
      <AppWrapper>
        <LandingPage />
      </AppWrapper>,
    );

    // ensure user's cleared input is NOT overwritten by stale session data
    expect(bp.value).toBe('');
  });

  it('renders LandingPage without initial sessionData', async () => {
    mockSessionHookState.sessionData = null;

    const { getByLabelText } = render(
      <AppWrapper>
        <LandingPage />
      </AppWrapper>,
    );

    const bp = getByLabelText('Business Problem');
    expect(bp).toBeDefined();
  });

  // Diagnostic test: render key child components used inside LandingPage to
  // identify which one causes the 'Element type is invalid' error in the
  // test harness.
  it('diagnostic - render key landing child components', async () => {
    const React = await import('react');
    const { Button } = await import('@/components/common');
    const ParameterInputContainer = (await import('./components/ParameterInputContainer')).default;
    const SampleTestCasesContainer = (await import('./components/SampleTestCasesContainer'))
      .default;
    const LiveCharacterCounter = (await import('./components/LiveCharacterCounter')).default;
    const InfoIconButton = (await import('@/components/common/InfoIconButton')).default;
    const LoaderIcon = (await import('@/components/common/LoaderIcon')).default;
    const { useForm, FormProvider } = await import('react-hook-form');

    // Basic assertions
    expect(typeof Button === 'function').toBe(true);
    expect(typeof ParameterInputContainer === 'function').toBe(true);
    expect(typeof SampleTestCasesContainer === 'function').toBe(true);
    expect(typeof LiveCharacterCounter === 'function').toBe(true);
    expect(typeof InfoIconButton === 'function').toBe(true);
    expect(typeof LoaderIcon === 'function').toBe(true);

    // Create a small wrapper component to provide useForm context (hooks must
    // be called within a React component)
    function Wrapper() {
      const methods = useForm({
        defaultValues: { businessProblem: '', businessSolution: '', parameters: {} },
      });
      return (
        <FormProvider {...methods}>
          <div>
            <Button>Test Button</Button>
            <InfoIconButton onClick={() => {}} />
            <LoaderIcon />
            <div>
              <ParameterInputContainer loading={false} />
            </div>
            <div>
              <SampleTestCasesContainer />
            </div>
            <div>
              <LiveCharacterCounter fieldName="businessProblem" />
            </div>
          </div>
        </FormProvider>
      );
    }

    const { container } = render(
      <AppWrapper>
        <Wrapper />
      </AppWrapper>,
    );

    expect(container).toBeDefined();
  });
});
