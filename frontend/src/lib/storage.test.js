/* global afterEach, test, expect */

import {
  clearCompareFormState,
  clearEvaluationState,
  clearShareFormState,
  loadCompareFormState,
  loadEvaluationState,
  loadShareFormState,
  saveCompareFormState,
  saveEvaluationState,
  saveShareFormState,
} from './storage';

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
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
  expect(loaded.results.evaluationParameters).toEqual({ a: 1 });
  expect(loaded.results.overall_score).toBe(55);
});

test('saveEvaluationState does NOT overwrite existing results when only inputs change', () => {
  const initial = {
    inputs: {
      businessProblem: 'Original BP',
      businessSolution: 'Original BS',
      evaluationParameters: { x: 9 },
    },
    results: {
      overall_score: 88,
      businessProblem: 'Snapshot BP',
      businessSolution: 'Snapshot BS',
      evaluationParameters: { x: 9 },
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

test('saveShareFormState and loadShareFormState persist and retrieve assessment ID', () => {
  const testId = '12345678-1234-1234-1234-123456789012';

  saveShareFormState(testId);
  const loaded = loadShareFormState();

  expect(loaded).toBeTruthy();
  expect(loaded.publicId).toBe(testId);
  expect(loaded.timestamp).toBeTruthy();
  expect(loaded.expiresAt).toBeTruthy();
});

test('loadShareFormState returns null for expired state', () => {
  const testId = '12345678-1234-1234-1234-123456789012';

  // Create an expired state
  const expiredState = {
    publicId: testId,
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() - 1000).toISOString(), // 1 second ago
  };

  sessionStorage.setItem('share_form_state', JSON.stringify(expiredState));
  const loaded = loadShareFormState();

  expect(loaded).toBeNull();
  expect(sessionStorage.getItem('share_form_state')).toBeNull();
});

test('clearShareFormState removes share form state', () => {
  saveShareFormState('test-id');
  expect(loadShareFormState()).toBeTruthy();

  clearShareFormState();
  expect(loadShareFormState()).toBeNull();
});

test('saveCompareFormState and loadCompareFormState persist and retrieve assessment IDs', () => {
  const testId1 = '12345678-1234-1234-1234-123456789012';
  const testId2 = '87654321-4321-4321-4321-210987654321';

  saveCompareFormState(testId1, testId2);
  const loaded = loadCompareFormState();

  expect(loaded).toBeTruthy();
  expect(loaded.publicId1).toBe(testId1);
  expect(loaded.publicId2).toBe(testId2);
  expect(loaded.timestamp).toBeTruthy();
  expect(loaded.expiresAt).toBeTruthy();
});

test('loadCompareFormState returns null for expired state', () => {
  const testId1 = '12345678-1234-1234-1234-123456789012';
  const testId2 = '87654321-4321-4321-4321-210987654321';

  // Create an expired state
  const expiredState = {
    publicId1: testId1,
    publicId2: testId2,
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() - 1000).toISOString(), // 1 second ago
  };

  sessionStorage.setItem('compare_form_state', JSON.stringify(expiredState));
  const loaded = loadCompareFormState();

  expect(loaded).toBeNull();
  expect(sessionStorage.getItem('compare_form_state')).toBeNull();
});

test('clearCompareFormState removes compare form state', () => {
  saveCompareFormState('test-id-1', 'test-id-2');
  expect(loadCompareFormState()).toBeTruthy();

  clearCompareFormState();
  expect(loadCompareFormState()).toBeNull();
});

test('form persistence handles empty strings correctly', () => {
  saveShareFormState('');
  const loaded = loadShareFormState();
  expect(loaded.publicId).toBe('');

  saveCompareFormState('', '');
  const loadedCompare = loadCompareFormState();
  expect(loadedCompare.publicId1).toBe('');
  expect(loadedCompare.publicId2).toBe('');
});
