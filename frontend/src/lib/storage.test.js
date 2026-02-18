import { saveEvaluationState, loadEvaluationState, clearEvaluationState } from './storage';

afterEach(() => {
  localStorage.clear();
});

test('saveEvaluationState persists empty strings when clearing inputs', () => {
  // Start with an existing non-empty value
  const initial = {
    inputs: { businessProblem: 'original', businessSolution: 'sol', parameters: {} },
    results: null,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem('session_evaluation_state', JSON.stringify(initial));

  // Persist a cleared businessProblem (empty string) — should overwrite the old value
  saveEvaluationState({ inputs: { businessProblem: '' } });

  const loaded = loadEvaluationState();
  expect(loaded).toBeTruthy();
  expect(loaded.inputs.businessProblem).toBe('');
  // Unspecified fields should be preserved
  expect(loaded.inputs.businessSolution).toBe('sol');
});

test('saveEvaluationState preserves unspecified fields and accepts empty parameters object', () => {
  const initial = {
    inputs: { businessProblem: 'x', businessSolution: 'y', parameters: { a: 1 } },
    results: null,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem('session_evaluation_state', JSON.stringify(initial));

  // Update only parameters to an empty object
  saveEvaluationState({ inputs: { parameters: {} } });
  const loaded = loadEvaluationState();
  expect(loaded.inputs.parameters).toEqual({});
  // Other fields remain
  expect(loaded.inputs.businessProblem).toBe('x');
});

test('clearEvaluationState removes stored session', () => {
  saveEvaluationState({ inputs: { businessProblem: 'hi' } });
  expect(loadEvaluationState()).toBeTruthy();
  clearEvaluationState();
  expect(loadEvaluationState()).toBeNull();
});
