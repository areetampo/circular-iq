/**
 * Chunking Service
 *
 * Splits dataset rows into fixed-size batches for embedding and ingestion.
 * Used by pipeline scripts to process large CSV files in manageable chunks.
 *
 * @module chunking.service
 */

/**
 * Split an array of rows into fixed-size chunks
 *
 * @param {Array} rows - Array of row objects to chunk
 * @param {number} [chunkSize=500] - Number of rows per chunk
 * @returns {Array<Array>} Array of chunks, each containing up to chunkSize rows
 *
 * @example
 * const rows = [...]; // 1500 row objects
 * const chunks = createChunks(rows, 500);
 * logger.info(chunks.length); // 3
 * logger.info(chunks[0].length); // 500
 * logger.info(chunks[2].length); // 500
 */
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
