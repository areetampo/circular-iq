/**
 * Data Chunking Script for GreenTechGuardians Dataset
 *
 * Splits CSV rows into semantic chunks while preserving:
 * - Business problem + solution pairs
 * - Metadata for traceability
 * - Context for RAG retrieval
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHUNK_SIZE_TOKENS = 350; // Target ~300-500 tokens per chunk
const TOKENS_PER_WORD = 1.3; // Rough estimate for token counting
const WORDS_PER_CHUNK = Math.floor(CHUNK_SIZE_TOKENS / TOKENS_PER_WORD);

/**
 * Load and parse the GreenTechGuardians CSV dataset
 * @param {string} csvFilePath - Path to AI_EarthHack_Dataset.csv
 * @returns {Array} Array of parsed records
 */
export function loadDataset(csvFilePath) {
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`Dataset not found at ${csvFilePath}`);
  }

  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    delimiter: ',',
    quote: '"',
    relax_column_count: true,
  });

  console.log(`✓ Loaded ${records.length} records from dataset`);
  return records;
}

/**
 * Process dataset into semantic chunks
 * Preserves problem/solution pairs as foundational units
 * @param {Array} records - Parsed CSV records
 * @returns {Array} Array of chunk objects with metadata
 */
export function createChunks(records) {
  const chunks = [];
  let chunkIndex = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    // Extract key fields - adjust column names based on actual CSV structure
    const problemText = sanitizeText(
      record['problem'] || record['Problem'] || record['Business Problem'] || '',
    );
    const solutionText = sanitizeText(
      record['solution'] || record['Solution'] || record['Business Solution'] || '',
    );
    const materials = sanitizeText(
      record['materials'] || record['Materials'] || record['Material'] || '',
    );
    const circularStrategy = sanitizeText(
      record['circular_strategy'] ||
        record['Circular Strategy'] ||
        record['circularity'] ||
        record['Circularity'] ||
        '',
    );
    const category = sanitizeText(
      record['category'] || record['Category'] || record['type'] || record['Type'] || 'General',
    );
    const impact = sanitizeText(
      record['impact'] || record['Impact'] || record['outcomes'] || record['Outcomes'] || '',
    );

    // Validate minimum content - be strict about quality
    if (!problemText || !solutionText) {
      console.warn(`Skipping record ${i}: Missing problem or solution`);
      continue;
    }

    // Enforce minimum length to filter out truncated/malformed records
    const MIN_PROBLEM_LENGTH = 100; // At least 100 chars for meaningful problem
    const MIN_SOLUTION_LENGTH = 100; // At least 100 chars for meaningful solution

    if (problemText.length < MIN_PROBLEM_LENGTH) {
      console.warn(
        `Skipping record ${i}: Problem too short (${problemText.length} chars, need ${MIN_PROBLEM_LENGTH})`,
      );
      continue;
    }

    if (solutionText.length < MIN_SOLUTION_LENGTH) {
      console.warn(
        `Skipping record ${i}: Solution too short (${solutionText.length} chars, need ${MIN_SOLUTION_LENGTH})`,
      );
      continue;
    }

    // Check for low-quality content (all caps, repetitive, etc)
    const allCaps = (problemText.match(/[A-Z]/g) || []).length;
    if (allCaps / problemText.length > 0.8) {
      console.warn(`Skipping record ${i}: Problem appears to be mostly uppercase`);
      continue;
    }

    // Create primary chunk: Problem + Solution (always together)
    const primaryContent = `Problem: ${problemText}\n\nSolution: ${solutionText}`;
    const primaryChunk = {
      id: `chunk_${chunkIndex++}`,
      source_row: i,
      chunk_index: 0,
      content: primaryContent,
      metadata: {
        category: category,
        chunk_type: 'primary',
        source_id: record['ID'] || `row_${i}`,
        fields: {
          problem: problemText,
          solution: solutionText,
          materials: materials,
          circular_strategy: circularStrategy,
          impact: impact,
        },
      },
      word_count: countWords(primaryContent),
    };
    chunks.push(primaryChunk);

    // Create secondary chunks if additional context exists and is substantial
    const secondaryParts = [];
    if (materials) secondaryParts.push(`Materials: ${materials}`);
    if (circularStrategy) secondaryParts.push(`Circular Strategy: ${circularStrategy}`);
    if (impact) secondaryParts.push(`Impact: ${impact}`);

    if (secondaryParts.length > 0) {
      // Include full problem+solution pair + supplementary context for complete understanding
      const secondaryContent = `Problem: ${problemText}\n\nSolution: ${solutionText}\n\n${secondaryParts.join('\n\n')}`;
      const wordCount = countWords(secondaryContent);

      // Split secondary content if it's too long
      if (wordCount > WORDS_PER_CHUNK * 1.5) {
        const subChunks = splitLongText(secondaryContent, WORDS_PER_CHUNK);
        subChunks.forEach((subContent, subIdx) => {
          chunks.push({
            id: `chunk_${chunkIndex++}`,
            source_row: i,
            chunk_index: subIdx + 1,
            content: subContent,
            metadata: {
              category: category,
              chunk_type: 'secondary',
              source_id: record['ID'] || `row_${i}`,
              parent_chunk: primaryChunk.id,
              fields: {
                problem: problemText,
                solution: solutionText,
                materials: materials,
                circular_strategy: circularStrategy,
                impact: impact,
              },
            },
            word_count: countWords(subContent),
          });
        });
      } else {
        chunks.push({
          id: `chunk_${chunkIndex++}`,
          source_row: i,
          chunk_index: 1,
          content: secondaryContent,
          metadata: {
            category: category,
            chunk_type: 'secondary',
            source_id: record['ID'] || `row_${i}`,
            parent_chunk: primaryChunk.id,
            fields: {
              problem: problemText,
              solution: solutionText,
              materials: materials,
              circular_strategy: circularStrategy,
              impact: impact,
            },
          },
          word_count: countWords(secondaryContent),
        });
      }
    }
  }

  console.log(`✓ Created ${chunks.length} semantic chunks from ${records.length} records`);
  return chunks;
}

/**
 * Sanitize and normalize text
 * @private
 */
function sanitizeText(text) {
  if (!text) return '';
  return String(text).trim().replace(/\s+/g, ' ').replace(/"/g, '"').replace(/'/g, "'");
}

/**
 * Estimate word count for a string
 * @private
 */
function countWords(text) {
  return text.trim().split(/\s+/).length;
}

/**
 * Split long text into chunks of roughly equal word count
 * @private
 */
function splitLongText(text, targetWords) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let currentChunk = '';
  let currentWordCount = 0;

  for (const sentence of sentences) {
    const sentenceWords = countWords(sentence);

    if (currentWordCount + sentenceWords > targetWords && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
      currentWordCount = sentenceWords;
    } else {
      currentChunk += ' ' + sentence;
      currentWordCount += sentenceWords;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Save chunks to JSON file
 * @param {Array} chunks - Array of chunk objects
 * @param {string} outputPath - Output file path
 */
export function saveChunksToFile(chunks, outputPath) {
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(chunks, null, 2));
  console.log(`✓ Saved ${chunks.length} chunks to ${outputPath}`);

  // Log statistics
  const stats = {
    total_chunks: chunks.length,
    total_words: chunks.reduce((sum, c) => sum + c.word_count, 0),
    avg_words_per_chunk: Math.round(
      chunks.reduce((sum, c) => sum + c.word_count, 0) / chunks.length,
    ),
    primary_chunks: chunks.filter((c) => c.metadata.chunk_type === 'primary').length,
    secondary_chunks: chunks.filter((c) => c.metadata.chunk_type === 'secondary').length,
    categories: [...new Set(chunks.map((c) => c.metadata.category))],
  };

  console.log('\nChunking Statistics:');
  console.log(`  Total chunks: ${stats.total_chunks}`);
  console.log(`  Total words: ${stats.total_words}`);
  console.log(`  Avg words/chunk: ${stats.avg_words_per_chunk}`);
  console.log(`  Primary chunks: ${stats.primary_chunks}`);
  console.log(`  Secondary chunks: ${stats.secondary_chunks}`);
  console.log(`  Categories: ${stats.categories.join(', ')}`);
}

// Main execution
const isMainModule = process.argv[1].endsWith('chunk.js');
if (isMainModule) {
  const datasetPath =
    process.argv[2] ||
    path.join(__dirname, '../dataset/GreenTechGuardians/AI_EarthHack_Dataset.csv');
  const outputPath = process.argv[3] || path.join(__dirname, '../dataset/chunks.json');

  try {
    const records = loadDataset(datasetPath);
    const chunks = createChunks(records);
    saveChunksToFile(chunks, outputPath);
    console.log('\n✓ Chunking complete!');
  } catch (error) {
    console.error('Error during chunking:', error.message);
    process.exit(1);
  }
}
