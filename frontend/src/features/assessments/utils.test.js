/* global describe, it, expect */

import {
  getAverageScore,
  reconstructScoringResult,
  sortByAverageScoreAsc,
  sortByAverageScoreDesc,
} from './utils';

describe('assessment utils sorting', () => {
  const data = [
    { industry: 'a', averageScore: 75 },
    { industry: 'b', average_score: 55 },
    { industry: 'c', averageScore: 85 },
  ];

  it('computes average scores consistently', () => {
    expect(getAverageScore(data[0])).toBe(75);
    expect(getAverageScore(data[1])).toBe(55);
    expect(getAverageScore({})).toBe(0);
  });

  it('sorts descending by average score', () => {
    const sorted = data.slice().sort(sortByAverageScoreDesc);
    expect(sorted.map((d) => d.industry)).toEqual(['c', 'a', 'b']);
  });

  it('sorts ascending by average score', () => {
    const sorted = data.slice().sort(sortByAverageScoreAsc);
    expect(sorted.map((d) => d.industry)).toEqual(['b', 'a', 'c']);
  });
});

describe('reconstructScoringResult', () => {
  it('returns null for null input', () => {
    expect(reconstructScoringResult(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(reconstructScoringResult(undefined)).toBeNull();
  });

  it('returns result_json directly when present', () => {
    const assessment = {
      result_json: { overall_score: 75, confidence_level: 80 },
    };
    const result = reconstructScoringResult(assessment);
    expect(result).toBe(assessment.result_json);
  });

  it('fallback: reconstructs overall_score from column', () => {
    const assessment = {
      result_json: null,
      overall_score: 65,
      confidence_level: 70,
    };
    const result = reconstructScoringResult(assessment);
    expect(result.overall_score).toBe(65);
  });

  it('fallback: reconstructs derived_metrics from promoted columns', () => {
    const assessment = {
      result_json: null,
      overall_score: 60,
      confidence_level: 70,
      technical_feasibility: 70,
      economic_viability: 80,
      circularity_potential: 75,
      risk_level: 'low',
    };
    const result = reconstructScoringResult(assessment);
    expect(result.derived_metrics.technical_feasibility).toBe(70);
    expect(result.derived_metrics.economic_viability).toBe(80);
    expect(result.derived_metrics.circularity_potential).toBe(75);
    expect(result.derived_metrics.risk_level).toBe('low');
  });

  it('fallback: metadata prefers individual columns over metadata blob', () => {
    const assessment = {
      result_json: null,
      industry: 'textiles',
      metadata: { scale: 'large' },
      overall_score: 60,
      confidence_level: 70,
    };
    const result = reconstructScoringResult(assessment);
    expect(result.metadata.industry).toBe('textiles');
    expect(result.metadata.scale).toBe('large');
  });

  it('fallback: new enrichment fields are mapped from columns', () => {
    const assessment = {
      result_json: null,
      overall_score: 60,
      confidence_level: 70,
      weighted_score_card: { total: 75 },
      circular_economy_tier: { tier: 'Leader' },
      parameter_consistency: { score: 90 },
      r_strategy_alignment: { alignment_score: 80 },
    };
    const result = reconstructScoringResult(assessment);
    expect(result.weighted_score_card.total).toBe(75);
    expect(result.circular_economy_tier.tier).toBe('Leader');
    expect(result.parameter_consistency.score).toBe(90);
    expect(result.r_strategy_alignment.alignment_score).toBe(80);
  });

  it('fallback: new enrichment fields fall back to result_json blob if columns are null', () => {
    const assessment = {
      result_json: {
        weighted_score_card: { total: 70 },
      },
      weighted_score_card: null,
      overall_score: 60,
      confidence_level: 70,
    };
    const result = reconstructScoringResult(assessment);
    expect(result.weighted_score_card.total).toBe(70);
  });

  it('fallback: context is mapped correctly', () => {
    const assessment = {
      result_json: null,
      context: { business_model_type: 'recycling' },
      overall_score: 60,
      confidence_level: 70,
    };
    const result = reconstructScoringResult(assessment);
    expect(result.context.business_model_type).toBe('recycling');
  });

  it('fallback: processing_info is an empty object (not stored)', () => {
    const assessment = {
      result_json: null,
      overall_score: 60,
      confidence_level: 70,
    };
    const result = reconstructScoringResult(assessment);
    expect(result.processing_info).toBeDefined();
    expect(typeof result.processing_info).toBe('object');
  });
});
