/**
 * Tests for chartHelpers utility functions
 */

import {
  RISK_COLORS,
  SCALE_COLORS,
  SCORE_COLORS,
  TIER_COLORS,
  transformGeoDistribution,
  transformIndustryDistribution,
  transformMaterialDistribution,
  transformRiskDistribution,
  transformScaleDistribution,
  transformScoreDistribution,
  transformTierDistribution,
  transformWeeklyTrend,
  usableBar,
  usablePie,
} from '@/utils/chartHelpers';

describe('chartHelpers', () => {
  describe('usablePie', () => {
    it('should return false for null/undefined data', () => {
      expect(usablePie(null)).toBe(false);
      expect(usablePie(undefined)).toBe(false);
    });

    it('should return false for single data point', () => {
      const data = [{ name: 'test', value: 10 }];
      expect(usablePie(data)).toBe(false);
    });

    it('should return false for data with total < 2', () => {
      const data = [
        { name: 'test1', value: 1 },
        { name: 'test2', value: 0 },
      ];
      expect(usablePie(data)).toBe(false);
    });

    it('should return true for valid pie data', () => {
      const data = [
        { name: 'test1', value: 5 },
        { name: 'test2', value: 3 },
      ];
      expect(usablePie(data)).toBe(true);
    });
  });

  describe('usableBar', () => {
    it('should return false for null/undefined data', () => {
      expect(usableBar(null)).toBe(false);
      expect(usableBar(undefined)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(usableBar([])).toBe(false);
    });

    it('should return false when all values are 0', () => {
      const data = [
        { name: 'test1', count: 0 },
        { name: 'test2', count: 0 },
      ];
      expect(usableBar(data)).toBe(false);
    });

    it('should return true when at least one value > 0', () => {
      const data = [
        { name: 'test1', count: 0 },
        { name: 'test2', count: 5 },
      ];
      expect(usableBar(data)).toBe(true);
    });

    it('should use custom key', () => {
      const data = [
        { name: 'test1', value: 0 },
        { name: 'test2', value: 5 },
      ];
      expect(usableBar(data, 'value')).toBe(true);
    });
  });

  describe('transformScoreDistribution', () => {
    it('should transform score distribution correctly', () => {
      const input = {
        '0-20': 5,
        '21-40': 10,
        '41-60': 15,
        '61-80': 8,
        '81-100': 3,
      };
      const expected = [
        { name: '0-20', value: 5 },
        { name: '21-40', value: 10 },
        { name: '41-60', value: 15 },
        { name: '61-80', value: 8 },
        { name: '81-100', value: 3 },
      ];
      expect(transformScoreDistribution(input)).toEqual(expected);
    });

    it('should filter out zero values', () => {
      const input = {
        '0-20': 0,
        '21-40': 10,
        '41-60': 0,
      };
      const expected = [{ name: '21-40', value: 10 }];
      expect(transformScoreDistribution(input)).toEqual(expected);
    });
  });

  describe('transformTierDistribution', () => {
    it('should transform tier distribution correctly', () => {
      const input = {
        Bronze: 15,
        Silver: 25,
        Gold: 10,
        Platinum: 5,
        Unknown: 2,
      };
      const expected = [
        { name: 'Silver', value: 25 },
        { name: 'Bronze', value: 15 },
        { name: 'Gold', value: 10 },
        { name: 'Platinum', value: 5 },
      ];
      expect(transformTierDistribution(input)).toEqual(expected);
    });

    it('should filter out Unknown tier', () => {
      const input = {
        Bronze: 10,
        Unknown: 5,
      };
      const expected = [{ name: 'Bronze', value: 10 }];
      expect(transformTierDistribution(input)).toEqual(expected);
    });

    it('should sort by value descending', () => {
      const input = {
        Bronze: 5,
        Silver: 20,
        Gold: 15,
      };
      const expected = [
        { name: 'Silver', value: 20 },
        { name: 'Gold', value: 15 },
        { name: 'Bronze', value: 5 },
      ];
      expect(transformTierDistribution(input)).toEqual(expected);
    });
  });

  describe('transformRiskDistribution', () => {
    it('should transform risk distribution correctly', () => {
      const input = {
        low: 20,
        medium: 15,
        high: 8,
        unknown: 2,
      };
      const expected = [
        { name: 'Low', value: 20 },
        { name: 'Medium', value: 15 },
        { name: 'High', value: 8 },
      ];
      expect(transformRiskDistribution(input)).toEqual(expected);
    });

    it('should filter out unknown risk', () => {
      const input = {
        low: 10,
        unknown: 5,
      };
      const expected = [{ name: 'Low', value: 10 }];
      expect(transformRiskDistribution(input)).toEqual(expected);
    });

    it('should capitalize first letter', () => {
      const input = {
        low: 10,
        medium: 5,
      };
      const expected = [
        { name: 'Low', value: 10 },
        { name: 'Medium', value: 5 },
      ];
      expect(transformRiskDistribution(input)).toEqual(expected);
    });
  });

  describe('transformWeeklyTrend', () => {
    it('should transform weekly trend correctly', () => {
      const input = [
        { week: '2024-01', count: 10, avg_score: 75.5 },
        { week: '2024-02', count: 15, avg_score: 80.2 },
        { week: '2024-03', count: 12, avg_score: null },
      ];
      const expected = [
        { period: '2024-01', count: 10, averageScore: 75.5 },
        { period: '2024-02', count: 15, averageScore: 80.2 },
        { period: '2024-03', count: 12, averageScore: 0 },
      ];
      expect(transformWeeklyTrend(input)).toEqual(expected);
    });
  });

  describe('transformIndustryDistribution', () => {
    it('should transform industry distribution correctly', () => {
      const input = [
        { industry: 'technology', count: 25 },
        { industry: 'healthcare', count: 15 },
        { industry: 'other', count: 5 },
        { industry: 'general', count: 3 },
        { industry: 'finance', count: 12 },
      ];
      const expected = [
        { name: 'technology', count: 25 },
        { name: 'healthcare', count: 15 },
        { name: 'finance', count: 12 },
      ];
      expect(transformIndustryDistribution(input, 10)).toEqual(expected);
    });

    it('should limit results', () => {
      const input = Array.from({ length: 15 }, (_, i) => ({
        industry: `industry${i}`,
        count: i + 1,
      }));
      const result = transformIndustryDistribution(input, 5);
      expect(result).toHaveLength(5);
    });
  });

  describe('transformMaterialDistribution', () => {
    it('should transform material distribution correctly', () => {
      const input = [
        { material: 'plastic', count: 20 },
        { material: 'metal', count: 15 },
        { material: 'unknown', count: 5 },
        { material: 'paper', count: 10 },
      ];
      const expected = [
        { name: 'plastic', value: 20 },
        { name: 'metal', value: 15 },
        { name: 'paper', value: 10 },
      ];
      expect(transformMaterialDistribution(input, 8)).toEqual(expected);
    });

    it('should handle null/undefined input', () => {
      expect(transformMaterialDistribution(null, 8)).toEqual([]);
      expect(transformMaterialDistribution(undefined, 8)).toEqual([]);
    });

    it('should filter out unknown materials', () => {
      const input = [
        { material: 'plastic', count: 10 },
        { material: 'unknown', count: 5 },
      ];
      const expected = [{ name: 'plastic', value: 10 }];
      expect(transformMaterialDistribution(input, 8)).toEqual(expected);
    });
  });

  describe('transformGeoDistribution', () => {
    it('should transform geographic distribution correctly', () => {
      const input = [
        { geo: 'europe', count: 25 },
        { geo: 'north america', count: 20 },
        { geo: 'unknown', count: 5 },
        { geo: 'asia', count: 15 },
      ];
      const expected = [
        { name: 'europe', value: 25 },
        { name: 'north america', value: 20 },
        { name: 'asia', value: 15 },
      ];
      expect(transformGeoDistribution(input, 8)).toEqual(expected);
    });

    it('should handle null/undefined input', () => {
      expect(transformGeoDistribution(null, 8)).toEqual([]);
      expect(transformGeoDistribution(undefined, 8)).toEqual([]);
    });
  });

  describe('transformScaleDistribution', () => {
    it('should transform scale distribution correctly', () => {
      const input = [
        { scale: 'small', count: 30 },
        { scale: 'medium', count: 25 },
        { scale: 'large', count: 15 },
        { scale: 'unknown', count: 5 },
      ];
      const expected = [
        { name: 'small', value: 30 },
        { name: 'medium', value: 25 },
        { name: 'large', value: 15 },
      ];
      expect(transformScaleDistribution(input, 6)).toEqual(expected);
    });

    it('should handle null/undefined input', () => {
      expect(transformScaleDistribution(null, 6)).toEqual([]);
      expect(transformScaleDistribution(undefined, 6)).toEqual([]);
    });
  });

  describe('Color constants', () => {
    it('should export color arrays', () => {
      expect(TIER_COLORS).toHaveLength(5);
      expect(RISK_COLORS).toHaveLength(4);
      expect(SCORE_COLORS).toHaveLength(4);
      expect(SCALE_COLORS).toHaveLength(6);
    });

    it('should contain CSS color variables', () => {
      expect(TIER_COLORS[0]).toBe('var(--success)');
      expect(RISK_COLORS[0]).toBe('var(--success)');
      expect(SCORE_COLORS[0]).toBe('var(--danger)');
    });
  });
});
