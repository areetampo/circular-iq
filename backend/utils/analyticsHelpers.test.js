/**
 * Tests for analyticsHelpers utility functions
 */

import {
  buildRecentMonths,
  formatMonthKey,
  roundTo,
  safeNumber,
  safePercentage,
  sanitizeFilter,
} from '#utils/analyticsHelpers';

describe('analyticsHelpers', () => {
  describe('sanitizeFilter', () => {
    it('should return null for null/undefined values', () => {
      expect(sanitizeFilter(null)).toBeNull();
      expect(sanitizeFilter(undefined)).toBeNull();
    });

    it('should return null for arrays and objects', () => {
      expect(sanitizeFilter(['test'])).toBeNull();
      expect(sanitizeFilter({ key: 'value' })).toBeNull();
    });

    it('should return null for empty strings and "all"', () => {
      expect(sanitizeFilter('')).toBeNull();
      expect(sanitizeFilter('   ')).toBeNull();
      expect(sanitizeFilter('all')).toBeNull();
      expect(sanitizeFilter('ALL')).toBeNull();
    });

    it('should return trimmed string for valid values', () => {
      expect(sanitizeFilter('test')).toBe('test');
      expect(sanitizeFilter('  test  ')).toBe('test');
      expect(sanitizeFilter('Technology')).toBe('Technology');
    });

    it('should handle numeric values', () => {
      expect(sanitizeFilter(123)).toBe('123');
      expect(sanitizeFilter(0)).toBe('0');
    });
  });

  describe('safeNumber', () => {
    it('should return valid numbers unchanged', () => {
      expect(safeNumber(123)).toBe(123);
      expect(safeNumber(0)).toBe(0);
      expect(safeNumber(-45.67)).toBe(-45.67);
      expect(safeNumber(1.5)).toBe(1.5);
    });

    it('should return 0 for invalid values', () => {
      expect(safeNumber(NaN)).toBe(0);
      expect(safeNumber(Infinity)).toBe(0);
      expect(safeNumber(-Infinity)).toBe(0);
      expect(safeNumber('not a number')).toBe(0);
      expect(safeNumber({})).toBe(0);
      expect(safeNumber([])).toBe(0);
      expect(safeNumber(null)).toBe(0);
      expect(safeNumber(undefined)).toBe(0);
    });

    it('should handle string numbers', () => {
      expect(safeNumber('123')).toBe(123);
      expect(safeNumber('45.67')).toBe(45.67);
      expect(safeNumber('-10')).toBe(-10);
    });
  });

  describe('formatMonthKey', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-03-15T10:30:00Z');
      expect(formatMonthKey(date)).toBe('2024-03');
    });

    it('should handle single digit months', () => {
      const date = new Date('2024-01-05T10:30:00Z');
      expect(formatMonthKey(date)).toBe('2024-01');
    });

    it('should handle December', () => {
      const date = new Date('2024-12-25T10:30:00Z');
      expect(formatMonthKey(date)).toBe('2024-12');
    });

    it('should use UTC date methods', () => {
      // Create date in local timezone that would be different in UTC
      const date = new Date('2024-01-31T23:30:00-05:00'); // This is Feb 1 in UTC
      expect(formatMonthKey(date)).toBe('2024-02'); // Should use UTC month
    });
  });

  describe('buildRecentMonths', () => {
    it('should build recent months array', () => {
      const mockDate = new Date('2024-03-15T10:30:00Z');
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => mockDate.getTime());

      const result = buildRecentMonths(3);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ key: '2024-01', label: '2024-01' });
      expect(result[1]).toEqual({ key: '2024-02', label: '2024-02' });
      expect(result[2]).toEqual({ key: '2024-03', label: '2024-03' });

      Date.now = originalDateNow;
    });

    it('should use default count of 6', () => {
      const mockDate = new Date('2024-06-15T10:30:00Z');
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => mockDate.getTime());

      const result = buildRecentMonths();
      expect(result).toHaveLength(6);

      Date.now = originalDateNow;
    });

    it('should handle count of 1', () => {
      const mockDate = new Date('2024-03-15T10:30:00Z');
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => mockDate.getTime());

      const result = buildRecentMonths(1);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ key: '2024-03', label: '2024-03' });

      Date.now = originalDateNow;
    });

    it('should handle year boundary', () => {
      const mockDate = new Date('2024-01-15T10:30:00Z');
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => mockDate.getTime());

      const result = buildRecentMonths(3);
      expect(result).toEqual([
        { key: '2023-11', label: '2023-11' },
        { key: '2023-12', label: '2023-12' },
        { key: '2024-01', label: '2024-01' },
      ]);

      Date.now = originalDateNow;
    });
  });

  describe('safePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(safePercentage(25, 100)).toBe(25);
      expect(safePercentage(50, 200)).toBe(25);
      expect(safePercentage(1, 3)).toBe(33);
      expect(safePercentage(2, 3)).toBe(67);
    });

    it('should return 0 for zero total', () => {
      expect(safePercentage(50, 0)).toBe(0);
      expect(safePercentage(0, 0)).toBe(0);
    });

    it('should handle null/undefined total', () => {
      expect(safePercentage(50, null)).toBe(0);
      expect(safePercentage(50, undefined)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(safePercentage(-10, 100)).toBe(-10);
      expect(safePercentage(10, -100)).toBe(-10);
    });

    it('should handle decimal values', () => {
      expect(safePercentage(33.33, 100)).toBe(33);
      expect(safePercentage(66.66, 100)).toBe(67);
    });
  });

  describe('roundTo', () => {
    it('should round to specified decimal places', () => {
      expect(roundTo(3.14159, 2)).toBe(3.14);
      expect(roundTo(3.14159, 3)).toBe(3.142);
      expect(roundTo(3.14159, 0)).toBe(3);
    });

    it('should use default 2 decimal places', () => {
      expect(roundTo(3.14159)).toBe(3.14);
      expect(roundTo(2.5)).toBe(2.5);
    });

    it('should handle negative numbers', () => {
      expect(roundTo(-3.14159, 2)).toBe(-3.14);
      expect(roundTo(-2.5, 0)).toBe(-3);
    });

    it('should handle edge cases', () => {
      expect(roundTo(0, 2)).toBe(0);
      expect(roundTo(1.005, 2)).toBe(1.01); // Handle rounding edge case
      expect(roundTo(1.004, 2)).toBe(1.0);
    });
  });
});
