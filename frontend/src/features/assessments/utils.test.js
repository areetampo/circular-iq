import { sortByAverageScoreAsc, sortByAverageScoreDesc, getAverageScore } from './utils';

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
