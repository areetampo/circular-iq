import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  clearSession,
  getMostRecentSession,
  getSession,
  hasUnsavedResults,
  saveSession,
} from './session';

describe('session utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('saveSession', () => {
    it('saves session data to localStorage', () => {
      const testData = {
        inputs: { businessProblem: 'Test Problem', businessSolution: 'Test Solution' },
        results: { score: 85 },
        timestamp: '2023-01-01T00:00:00.000Z',
      };

      saveSession(testData);

      const stored = localStorage.getItem('session_evaluation_state');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored);
      expect(parsed.inputs.businessProblem).toBe(testData.inputs.businessProblem);
      expect(parsed.inputs.businessSolution).toBe(testData.inputs.businessSolution);
      expect(parsed.results.score).toBe(testData.results.score);
      expect(parsed.timestamp).toEqual(testData.timestamp);
    });

    it('uses default timestamp when not provided', () => {
      const testData = {
        inputs: { businessProblem: 'Test Problem' },
      };

      saveSession(testData);

      const stored = localStorage.getItem('session_evaluation_state');
      const parsed = JSON.parse(stored);

      expect(parsed.timestamp).toBeTruthy();
      expect(new Date(parsed.timestamp)).toBeInstanceOf(Date);
    });

    it('handles minimal data gracefully', () => {
      saveSession({});

      const stored = localStorage.getItem('session_evaluation_state');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored);
      expect(parsed.inputs.businessProblem).toBe('');
      expect(parsed.inputs.businessSolution).toBe('');
    });
  });

  describe('getSession', () => {
    it('retrieves session data from localStorage', () => {
      const testData = {
        inputs: { businessProblem: 'Test Problem', businessSolution: 'Test Solution' },
        results: { score: 85 },
      };

      saveSession(testData);
      const retrieved = getSession();

      expect(retrieved).toEqual(
        expect.objectContaining({
          inputs: expect.objectContaining({
            businessProblem: testData.inputs.businessProblem,
            businessSolution: testData.inputs.businessSolution,
          }),
          results: expect.objectContaining({
            score: testData.results.score,
          }),
        }),
      );
    });

    it('returns null when no session exists', () => {
      const retrieved = getSession();
      expect(retrieved).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('removes session data from localStorage', () => {
      saveSession({ inputs: { businessProblem: 'test data' } });
      expect(localStorage.getItem('session_evaluation_state')).toBeTruthy();

      clearSession();
      expect(localStorage.getItem('session_evaluation_state')).toBeNull();
    });
  });

  describe('hasUnsavedResults', () => {
    it('returns true when session has results', () => {
      saveSession({ results: { score: 85 } });

      expect(hasUnsavedResults()).toBe(true);
    });

    it('returns false when session has no results', () => {
      saveSession({ inputs: { businessProblem: 'Test' } });

      expect(hasUnsavedResults()).toBe(false);
    });

    it('returns false when no session exists', () => {
      expect(hasUnsavedResults()).toBe(false);
    });
  });

  describe('getMostRecentSession', () => {
    it('returns the same as getSession for compatibility', () => {
      const testData = { results: { score: 90 } };
      saveSession(testData);

      const session = getSession();
      const recent = getMostRecentSession();

      expect(recent).toEqual(session);
    });
  });
});
