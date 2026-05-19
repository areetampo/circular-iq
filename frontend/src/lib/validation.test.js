/**
 * @module validation.test
 * @description Unit tests for Zod schemas and validators.
 */

import { describe, expect, it } from 'vitest';

import { getCharacterCount, validateInput } from '@/lib/validation';

describe('validation utilities', () => {
  describe('getCharacterCount', () => {
    it('counts characters excluding whitespace', () => {
      expect(getCharacterCount('Hello World')).toBe(10);
      expect(getCharacterCount('  Hello   World  ')).toBe(10);
      expect(getCharacterCount('Hello\nWorld')).toBe(10);
      expect(getCharacterCount('Hello\tWorld')).toBe(10);
    });

    it('handles empty strings', () => {
      expect(getCharacterCount('')).toBe(0);
      expect(getCharacterCount('   ')).toBe(0);
      expect(getCharacterCount('\n\t ')).toBe(0);
    });

    it('handles null/undefined', () => {
      expect(getCharacterCount(null)).toBe(0);
      expect(getCharacterCount(undefined)).toBe(0);
    });

    it('preserves non-whitespace characters', () => {
      expect(getCharacterCount('Hello! World?')).toBe(12);
      expect(getCharacterCount('123 456')).toBe(6);
    });
  });

  describe('validateInput', () => {
    it('validates correct input', () => {
      const result = validateInput(
        'This is a problem description that is definitely long enough for validation testing purposes',
        'This is a solution description that is also definitely long enough for validation testing purposes',
      );

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects missing problem', () => {
      const result = validateInput('', 'Valid solution description that is long enough');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Both problem and solution are required');
    });

    it('rejects missing solution', () => {
      const result = validateInput('Valid problem description that is long enough', '');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Both problem and solution are required');
    });

    it('rejects null inputs', () => {
      const result = validateInput(null, 'Valid solution description that is long enough');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Both problem and solution are required');
    });

    it('rejects short problem', () => {
      const result = validateInput(
        'Short',
        'Valid solution description that is long enough for validation',
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Problem must be at least 50 characters (currently 5)');
    });

    it('rejects short solution', () => {
      const result = validateInput(
        'Valid problem description that is long enough for validation',
        'Short solution',
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Solution must be at least 50 characters (currently 13)');
    });

    it('accepts custom minimum length', () => {
      const result = validateInput('Medium length problem text', 'Medium length solution text', 20);

      expect(result.valid).toBe(true);
    });

    it('rejects with custom minimum length', () => {
      const result = validateInput('Short', 'Short', 10);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Problem must be at least 10 characters (currently 5)');
    });

    it('handles whitespace-only strings', () => {
      const result = validateInput('   \n\t   ', 'Valid solution description that is long enough');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Problem must be at least 50 characters (currently 0)');
    });
  });
});
