import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calculateParameterConsistency,
  calculateRStrategyAlignment,
  classifyCircularEconomyTier,
  generateWeightedScoreCard,
} from '../../services/scoring.logic.js';

const weights = {
  public_participation: 0.15,
  infrastructure: 0.15,
  market_price: 0.2,
  maintenance: 0.1,
  uniqueness: 0.1,
  size_efficiency: 0.1,
  chemical_safety: 0.1,
  tech_readiness: 0.1,
};

const allFifty = {
  public_participation: 50,
  infrastructure: 50,
  market_price: 50,
  maintenance: 50,
  uniqueness: 50,
  size_efficiency: 50,
  chemical_safety: 50,
  tech_readiness: 50,
};

const recycleProfile = {
  public_participation: 70,
  infrastructure: 90,
  market_price: 90,
  maintenance: 50,
  uniqueness: 30,
  size_efficiency: 60,
  chemical_safety: 80,
  tech_readiness: 70,
};

describe('generateWeightedScoreCard', () => {
  it('returns a factors object with all 8 keys', () => {
    const result = generateWeightedScoreCard(allFifty, weights);
    assert.strictEqual(Object.keys(result.factors).length, 8);
    const expectedKeys = [
      'public_participation',
      'infrastructure',
      'market_price',
      'maintenance',
      'uniqueness',
      'size_efficiency',
      'chemical_safety',
      'tech_readiness',
    ];
    expectedKeys.forEach((key) => {
      assert.ok(key in result.factors, `Expected factor ${key} to be present`);
    });
  });

  it('total equals sum of contributions', () => {
    const result = generateWeightedScoreCard(allFifty, weights);
    const sumOfContributions = Object.values(result.factors).reduce(
      (sum, factor) => sum + factor.contribution,
      0,
    );
    assert.ok(
      Math.abs(result.total - sumOfContributions) <= 1,
      'Total should equal sum of contributions',
    );
  });

  it('top_contributor is the factor with highest contribution', () => {
    const params = { ...allFifty, market_price: 90 };
    const result = generateWeightedScoreCard(params, weights);
    assert.strictEqual(result.top_contributor, 'market_price');
  });

  it('bottom_contributor is the factor with lowest contribution', () => {
    const params = { ...allFifty, public_participation: 10 };
    params.public_participation = 10;
    const result = generateWeightedScoreCard(params, weights);
    assert.strictEqual(result.bottom_contributor, 'public_participation');
  });

  it('classifies scores correctly', () => {
    const params = {
      public_participation: 80,
      infrastructure: 60,
      market_price: 30,
      maintenance: 10,
      uniqueness: 50,
      size_efficiency: 50,
      chemical_safety: 50,
      tech_readiness: 50,
    };
    const result = generateWeightedScoreCard(params, weights);
    assert.strictEqual(result.factors.public_participation.classification, 'Strong');
    assert.strictEqual(result.factors.infrastructure.classification, 'Moderate');
    assert.strictEqual(result.factors.market_price.classification, 'Weak');
    assert.strictEqual(result.factors.maintenance.classification, 'Critical');
  });

  it('rank 1 is the highest contributing factor', () => {
    const result = generateWeightedScoreCard(allFifty, weights);
    assert.strictEqual(result.factors[result.top_contributor].rank, 1);
  });

  it('handles all-zero params without throwing', () => {
    const zeroParams = {
      public_participation: 0,
      infrastructure: 0,
      market_price: 0,
      maintenance: 0,
      uniqueness: 0,
      size_efficiency: 0,
      chemical_safety: 0,
      tech_readiness: 0,
    };
    const result = generateWeightedScoreCard(zeroParams, weights);
    assert.strictEqual(result.total, 0);
    assert.ok(result);
  });
});

describe('classifyCircularEconomyTier', () => {
  it('returns Leader for score 76-100', () => {
    [76, 85, 100].forEach((score) => {
      const result = classifyCircularEconomyTier(score);
      assert.strictEqual(result.tier, 'Leader');
      assert.strictEqual(result.badge_color, 'green');
    });
  });

  it('returns Established for score 61-75', () => {
    [61, 68, 75].forEach((score) => {
      const result = classifyCircularEconomyTier(score);
      assert.strictEqual(result.tier, 'Established');
      assert.strictEqual(result.badge_color, 'blue');
    });
  });

  it('returns Developing for score 41-60', () => {
    [41, 50, 60].forEach((score) => {
      const result = classifyCircularEconomyTier(score);
      assert.strictEqual(result.tier, 'Developing');
      assert.strictEqual(result.badge_color, 'amber');
    });
  });

  it('returns Emerging for score 0-40', () => {
    [0, 20, 40].forEach((score) => {
      const result = classifyCircularEconomyTier(score);
      assert.strictEqual(result.tier, 'Emerging');
      assert.strictEqual(result.badge_color, 'red');
    });
  });

  it('result always has required fields', () => {
    [0, 50, 100].forEach((score) => {
      const result = classifyCircularEconomyTier(score);
      assert.ok(result.tier && typeof result.tier === 'string');
      assert.ok(result.range && typeof result.range === 'string');
      assert.ok(result.badge_color && typeof result.badge_color === 'string');
      assert.ok(result.description && typeof result.description === 'string');
      assert.ok(result.next_milestone && typeof result.next_milestone === 'string');
      assert.ok(result.percentile_estimate && typeof result.percentile_estimate === 'string');
    });
  });

  it('boundary: score 76 is Leader not Established', () => {
    const result = classifyCircularEconomyTier(76);
    assert.strictEqual(result.tier, 'Leader');
  });

  it('boundary: score 75 is Established not Leader', () => {
    const result = classifyCircularEconomyTier(75);
    assert.strictEqual(result.tier, 'Established');
  });

  it('boundary: score 41 is Developing not Emerging', () => {
    const result = classifyCircularEconomyTier(41);
    assert.strictEqual(result.tier, 'Developing');
  });

  it('boundary: score 40 is Emerging not Developing', () => {
    const result = classifyCircularEconomyTier(40);
    assert.strictEqual(result.tier, 'Emerging');
  });
});

describe('calculateParameterConsistency', () => {
  it('returns score 100 for internally consistent params', () => {
    const result = calculateParameterConsistency(allFifty);
    assert.strictEqual(result.score, 100);
    assert.strictEqual(result.issues.length, 0);
    assert.strictEqual(result.rating, 'High');
  });

  it('detects high market_price + low tech_readiness', () => {
    const params = { ...allFifty, market_price: 80, tech_readiness: 30 };
    const result = calculateParameterConsistency(params);
    assert.ok(result.issues.length >= 1);
    assert.ok(
      result.issues[0].factors.includes('market_price') &&
        result.issues[0].factors.includes('tech_readiness'),
    );
    assert.ok(result.score < 100);
  });

  it('detects high public_participation + low infrastructure', () => {
    const params = { ...allFifty, public_participation: 80, infrastructure: 30 };
    const result = calculateParameterConsistency(params);
    assert.ok(result.issues.length >= 1);
    assert.ok(result.score < 100);
  });

  it('detects suspiciously uniform high scores', () => {
    const params = {
      public_participation: 80,
      infrastructure: 80,
      market_price: 80,
      maintenance: 80,
      uniqueness: 80,
      size_efficiency: 80,
      chemical_safety: 80,
      tech_readiness: 80,
    };
    const result = calculateParameterConsistency(params);
    assert.ok(result.issues.length >= 1);
    // Check that at least one issue has all 8 factors
    const uniformIssue = result.issues.find((issue) => issue.factors.length === 8);
    assert.ok(uniformIssue, 'Should detect uniform score issue');
  });

  it('score is always 0-100', () => {
    const testCases = [
      allFifty,
      { ...allFifty, market_price: 80, tech_readiness: 30 },
      { ...allFifty, public_participation: 80, infrastructure: 30 },
    ];
    testCases.forEach((params) => {
      const result = calculateParameterConsistency(params);
      assert.ok(result.score >= 0 && result.score <= 100);
    });
  });

  it('rating is one of the four valid values', () => {
    const testCases = [allFifty, { ...allFifty, market_price: 80, tech_readiness: 30 }];
    testCases.forEach((params) => {
      const result = calculateParameterConsistency(params);
      assert.ok(['High', 'Moderate', 'Low', 'Very Low'].includes(result.rating));
    });
  });

  it('penalty reduces score proportionally', () => {
    const params = { ...allFifty, market_price: 80, tech_readiness: 30 };
    const result = calculateParameterConsistency(params);
    assert.strictEqual(result.score, 100 - result.penalty_total);
  });

  it('multiple violations accumulate penalties', () => {
    const params = {
      ...allFifty,
      market_price: 80,
      tech_readiness: 30,
      public_participation: 80,
      infrastructure: 30,
    };
    const result = calculateParameterConsistency(params);
    assert.ok(result.penalty_total > 20);
  });
});

describe('calculateRStrategyAlignment', () => {
  it('returns null alignment_score for unknown strategy', () => {
    const result = calculateRStrategyAlignment(allFifty, 'Unknown');
    assert.strictEqual(result.alignment_score, null);
    assert.strictEqual(result.rating, 'Unknown');
  });

  it('returns null alignment_score for null strategy', () => {
    const result = calculateRStrategyAlignment(allFifty, null);
    assert.strictEqual(result.alignment_score, null);
  });

  it('Recycle strategy: high scores on infrastructure+market_price = Strong Alignment', () => {
    const result = calculateRStrategyAlignment(recycleProfile, 'Recycle');
    assert.ok(result.alignment_score >= 65);
    assert.ok(result.rating.includes('Alignment'));
  });

  it('Recycle strategy: low scores on critical factors = weak alignment', () => {
    const params = {
      public_participation: 20,
      infrastructure: 20,
      market_price: 20,
      maintenance: 20,
      uniqueness: 20,
      size_efficiency: 20,
      chemical_safety: 20,
      tech_readiness: 20,
    };
    const result = calculateRStrategyAlignment(params, 'Recycle');
    assert.ok(result.alignment_score < 55);
    assert.ok(result.misaligned_factors.length > 0);
  });

  it('critical_factors are always returned for known strategies', () => {
    const result = calculateRStrategyAlignment(allFifty, 'Reuse');
    assert.ok(Array.isArray(result.critical_factors));
    assert.ok(result.critical_factors.length >= 1);
  });

  it('well_aligned_factors contains only factors scoring >= 70', () => {
    const params = {
      ...allFifty,
      infrastructure: 80,
      maintenance: 80,
      market_price: 30,
    };
    const result = calculateRStrategyAlignment(params, 'Reuse');
    assert.ok(result.well_aligned_factors.includes('infrastructure'));
    assert.ok(result.well_aligned_factors.includes('maintenance'));
    assert.ok(!result.well_aligned_factors.includes('market_price'));
  });

  it('strategy name is case-insensitive', () => {
    const result = calculateRStrategyAlignment(allFifty, 'recycle');
    assert.notStrictEqual(result.alignment_score, null);
  });

  it('alignment_score is always 0-100 for known strategies', () => {
    const strategies = [
      'Refuse',
      'Reduce',
      'Reuse',
      'Repair',
      'Refurbish',
      'Remanufacture',
      'Repurpose',
      'Recycle',
      'Recover',
    ];
    strategies.forEach((strategy) => {
      const result = calculateRStrategyAlignment(allFifty, strategy);
      assert.ok(result.alignment_score >= 0 && result.alignment_score <= 100);
    });
  });

  it('all 9 known strategies are recognised', () => {
    const strategies = [
      'Refuse',
      'Reduce',
      'Reuse',
      'Repair',
      'Refurbish',
      'Remanufacture',
      'Repurpose',
      'Recycle',
      'Recover',
    ];
    strategies.forEach((strategy) => {
      const result = calculateRStrategyAlignment(allFifty, strategy);
      assert.notStrictEqual(result.alignment_score, null);
    });
  });
});
