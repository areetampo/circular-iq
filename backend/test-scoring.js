import { calculateScores } from './src/scoring.js';

console.log('Testing Weighted Scoring System\n');
console.log('='.repeat(50));

const testCase1 = {
  public_participation: 80,
  infrastructure: 70,
  market_price: 90,
  maintenance: 60,
  uniqueness: 50,
  size_efficiency: 40,
  chemical_safety: 85,
  tech_readiness: 75,
};

console.log('\nTest Case 1: Mixed values');
console.log('Input:', testCase1);
const result1 = calculateScores(testCase1);
console.log('Result:', result1);

const manualCalc1 = 
  (80 * 0.15) + 
  (70 * 0.15) + 
  (90 * 0.20) + 
  (60 * 0.10) + 
  (50 * 0.10) + 
  (40 * 0.10) + 
  (85 * 0.10) + 
  (75 * 0.10);
console.log('Manual calculation:', manualCalc1);
console.log('Rounded:', Math.round(manualCalc1));
console.log('Match:', result1.overall_score === Math.round(manualCalc1) ? '✓' : '✗');

const testCase2 = {
  public_participation: 100,
  infrastructure: 100,
  market_price: 100,
  maintenance: 100,
  uniqueness: 100,
  size_efficiency: 100,
  chemical_safety: 100,
  tech_readiness: 100,
};

console.log('\n' + '='.repeat(50));
console.log('\nTest Case 2: All 100s');
const result2 = calculateScores(testCase2);
console.log('Overall score:', result2.overall_score);
console.log('Expected: 100');
console.log('Match:', result2.overall_score === 100 ? '✓' : '✗');

const testCase3 = {
  public_participation: 0,
  infrastructure: 0,
  market_price: 0,
  maintenance: 0,
  uniqueness: 0,
  size_efficiency: 0,
  chemical_safety: 0,
  tech_readiness: 0,
};

console.log('\n' + '='.repeat(50));
console.log('\nTest Case 3: All 0s');
const result3 = calculateScores(testCase3);
console.log('Overall score:', result3.overall_score);
console.log('Expected: 0');
console.log('Match:', result3.overall_score === 0 ? '✓' : '✗');

const testCase4 = {
  public_participation: 50,
  infrastructure: 50,
  market_price: 100,
  maintenance: 50,
  uniqueness: 50,
  size_efficiency: 50,
  chemical_safety: 50,
  tech_readiness: 50,
};

console.log('\n' + '='.repeat(50));
console.log('\nTest Case 4: Testing market_price weight (0.20)');
console.log('market_price = 100, all others = 50');
const result4 = calculateScores(testCase4);
console.log('Overall score:', result4.overall_score);
const manualCalc4 = (50 * 0.15) + (50 * 0.15) + (100 * 0.20) + (50 * 0.10) + (50 * 0.10) + (50 * 0.10) + (50 * 0.10) + (50 * 0.10);
console.log('Expected:', Math.round(manualCalc4));
console.log('Match:', result4.overall_score === Math.round(manualCalc4) ? '✓' : '✗');

console.log('\n' + '='.repeat(50));
console.log('\nTest Case 5: Verify all sub_scores returned');
const hasAllSubScores = 
  result1.sub_scores.hasOwnProperty('public_participation') &&
  result1.sub_scores.hasOwnProperty('infrastructure') &&
  result1.sub_scores.hasOwnProperty('market_price') &&
  result1.sub_scores.hasOwnProperty('maintenance') &&
  result1.sub_scores.hasOwnProperty('uniqueness') &&
  result1.sub_scores.hasOwnProperty('size_efficiency') &&
  result1.sub_scores.hasOwnProperty('chemical_safety') &&
  result1.sub_scores.hasOwnProperty('tech_readiness');
console.log('All 8 sub_scores present:', hasAllSubScores ? '✓' : '✗');
console.log('Sub_scores:', result1.sub_scores);

console.log('\n' + '='.repeat(50));
console.log('\n✓ All tests completed successfully!');
