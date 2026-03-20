/* global afterEach, test, expect */

import { clearEvaluationState, loadEvaluationState, saveEvaluationState } from './storage';

afterEach(() => {
  localStorage.clear();
});

test('saveEvaluationState persists empty strings when clearing inputs', () => {
  // Start with an existing non-empty value
  const initial = {
    inputs: { businessProblem: 'original', businessSolution: 'sol', evaluationParameters: {} },
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

test('saveEvaluationState preserves unspecified fields and accepts empty evaluationParameters object', () => {
  const initial = {
    inputs: { businessProblem: 'x', businessSolution: 'y', evaluationParameters: { a: 1 } },
    results: null,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem('session_evaluation_state', JSON.stringify(initial));

  // Update only evaluationParameters to an empty object
  saveEvaluationState({ inputs: { evaluationParameters: {} } });
  const loaded = loadEvaluationState();
  expect(loaded.inputs.evaluationParameters).toEqual({});
  // Other fields remain
  expect(loaded.inputs.businessProblem).toBe('x');
});

test('clearEvaluationState removes stored session', () => {
  saveEvaluationState({ inputs: { businessProblem: 'hi' } });
  expect(loadEvaluationState()).toBeTruthy();
  clearEvaluationState();
  expect(loadEvaluationState()).toBeNull();
});

test('saveEvaluationState enriches a newly-saved result with snapshot inputs (if missing)', () => {
  // Start with existing inputs persisted but no explicit business fields on results
  const initial = {
    inputs: {
      businessProblem: 'Stored BP',
      businessSolution: 'Stored BS',
      evaluationParameters: { a: 1 },
    },
    results: null,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem('session_evaluation_state', JSON.stringify(initial));

  // Save a results snapshot that lacks businessProblem/parameters
  saveEvaluationState({ results: { overall_score: 55 } });

  const loaded = loadEvaluationState();
  expect(loaded).toBeTruthy();
  expect(loaded.results).toBeTruthy();
  // Snapshot should have been enriched from persisted inputs
  expect(loaded.results.businessProblem).toBe('Stored BP');
  expect(loaded.results.businessSolution).toBe('Stored BS');
  expect(loaded.results.parameters).toEqual({ a: 1 });
  expect(loaded.results.overall_score).toBe(55);
});

test('saveEvaluationState does NOT overwrite existing results when only inputs change', () => {
  const initial = {
    inputs: {
      businessProblem: 'Original BP',
      businessSolution: 'Original BS',
      parameters: { x: 9 },
    },
    results: {
      overall_score: 88,
      businessProblem: 'Snapshot BP',
      businessSolution: 'Snapshot BS',
      parameters: { x: 9 },
    },
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem('session_evaluation_state', JSON.stringify(initial));

  // Update inputs only
  saveEvaluationState({ inputs: { businessProblem: 'Edited BP' } });

  const loaded = loadEvaluationState();
  expect(loaded).toBeTruthy();
  // Inputs changed
  expect(loaded.inputs.businessProblem).toBe('Edited BP');
  // Results snapshot must remain unchanged
  expect(loaded.results.businessProblem).toBe('Snapshot BP');
  expect(loaded.results.overall_score).toBe(88);
});
