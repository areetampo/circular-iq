// Chunking utilities for dataset processing pipelines
// Responsible for splitting combined inputs into smaller units for embedding

export function createChunks(rows, chunkSize = 500) {
  const chunks = [];
  let current = [];
  for (const row of rows) {
    current.push(row);
    if (current.length >= chunkSize) {
      chunks.push(current);
      current = [];
    }
  }
  if (current.length) chunks.push(current);
  return chunks;
}
