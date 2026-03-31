/**
 * Tests for formHelpers utility functions
 */

import {
  inputsEqual,
  nonLetterDensity,
  normalizeContext,
  shallowEqual,
  uniqueWordRatio,
} from '@/utils/formHelpers';

describe('formHelpers', () => {
  describe('normalizeContext', () => {
    it('should return empty object for null/undefined', () => {
      expect(normalizeContext(null)).toEqual({});
      expect(normalizeContext(undefined)).toEqual({});
    });

    it('should remove undefined values', () => {
      const ctx = {
        industry: 'technology',
        scale: 'medium',
        undefined: undefined,
        null: null,
        empty: '',
      };
      expect(normalizeContext(ctx)).toEqual({
        industry: 'technology',
        scale: 'medium',
        null: null,
        empty: '',
      });
    });

    it('should preserve defined values', () => {
      const ctx = {
        industry: 'technology',
        scale: 'medium',
        geo: 'europe',
      };
      expect(normalizeContext(ctx)).toEqual(ctx);
    });
  });

  describe('inputsEqual', () => {
    it('should return true for identical inputs', () => {
      const input1 = {
        businessProblem: 'Test problem',
        businessSolution: 'Test solution',
        evaluationParameters: { tech_feasibility: 80 },
        businessContext: { industry: 'tech' },
      };
      const input2 = { ...input1 };
      expect(inputsEqual(input1, input2)).toBe(true);
    });

    it('should return false for different business problems', () => {
      const input1 = {
        businessProblem: 'Problem 1',
        businessSolution: 'Solution',
        evaluationParameters: {},
        businessContext: {},
      };
      const input2 = {
        businessProblem: 'Problem 2',
        businessSolution: 'Solution',
        evaluationParameters: {},
        businessContext: {},
      };
      expect(inputsEqual(input1, input2)).toBe(false);
    });

    it('should handle undefined values gracefully', () => {
      const input1 = {
        businessProblem: 'Test',
        businessSolution: 'Test',
        evaluationParameters: { tech: 80 },
        businessContext: { industry: 'tech' },
      };
      const input2 = {
        businessProblem: 'Test',
        businessSolution: 'Test',
        evaluationParameters: undefined,
        businessContext: undefined,
      };
      expect(inputsEqual(input1, input2)).toBe(false);
    });

    it('should handle empty objects', () => {
      expect(inputsEqual({}, {})).toBe(true);
      expect(inputsEqual({}, { businessProblem: 'test' })).toBe(false);
    });
  });

  describe('shallowEqual', () => {
    it('should return true for identical objects', () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { a: 1, b: 2, c: 3 };
      expect(shallowEqual(obj1, obj2)).toBe(true);
    });

    it('should return false for objects with different values', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };
      expect(shallowEqual(obj1, obj2)).toBe(false);
    });

    it('should return false for objects with different keys', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, c: 2 };
      expect(shallowEqual(obj1, obj2)).toBe(false);
    });

    it('should handle empty objects', () => {
      expect(shallowEqual({}, {})).toBe(true);
      expect(shallowEqual({}, { a: 1 })).toBe(false);
    });
  });

  describe('uniqueWordRatio', () => {
    it('should return 0 for empty string', () => {
      expect(uniqueWordRatio('')).toBe(0);
      expect(uniqueWordRatio(null)).toBe(0);
      expect(uniqueWordRatio(undefined)).toBe(0);
    });

    it('should return 1 for all unique words', () => {
      const text = 'unique words here';
      expect(uniqueWordRatio(text)).toBe(1);
    });

    it('should return correct ratio for repeated words', () => {
      const text = 'test test test words';
      expect(uniqueWordRatio(text)).toBe(0.5); // 2 unique out of 4 total
    });

    it('should handle punctuation and special characters', () => {
      const text = 'Hello, world! Hello again.';
      const words = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
      const unique = new Set(words);
      const expected = unique.size / words.length;
      expect(uniqueWordRatio(text)).toBe(expected);
    });
  });

  describe('nonLetterDensity', () => {
    it('should return 0 for letters only', () => {
      expect(nonLetterDensity('hello world')).toBe(0);
    });

    it('should calculate correct density for mixed content', () => {
      const text = 'hello@world!';
      const total = text.length;
      const matches = text.match(/[^a-z0-9\s.,_-]/gi) || [];
      const expected = matches.length / total;
      expect(nonLetterDensity(text)).toBe(expected);
    });

    it('should handle empty string', () => {
      expect(nonLetterDensity('')).toBe(0);
    });

    it('should allow common punctuation but detect special characters', () => {
      const text = 'Hello, world. This is a test!';
      // , . are allowed, but ! is considered special character
      const expected = 1 / text.length; // 1 exclamation mark
      expect(nonLetterDensity(text)).toBe(expected);
    });

    it('should detect special characters', () => {
      const text = 'Hello@#$%World';
      expect(nonLetterDensity(text)).toBeGreaterThan(0);
    });
  });
});
