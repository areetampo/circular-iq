export function getAverageScore(item) {
  return (
    (typeof item.averageScore === 'number' && item.averageScore) ||
    (typeof item.average_score === 'number' && item.average_score) ||
    0
  );
}

export function sortByAverageScoreDesc(a, b) {
  return getAverageScore(b) - getAverageScore(a);
}

export function sortByAverageScoreAsc(a, b) {
  return getAverageScore(a) - getAverageScore(b);
}
