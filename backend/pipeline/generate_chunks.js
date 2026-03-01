/**
 * Semantic Chunking Script for Circular Economy datasets
 *
 * Splits CSV rows into semantic chunks while preserving:
 * - Business problem + solution pairs
 * - Metadata for traceability
 * - Context for RAG retrieval
 *
 * INPUT: combined_input.csv (merged from all datasets/processed/*.csv files)
 * - Creates semantic chunks from problem/solution pairs
 * - Handles various CSV formats and column naming variations
 *
 * OUTPUT: Writes chunks.json to backend/datasets/out/
 * NEXT STEP: Run generate_embeddings.js to generate embeddings, then store_embeddings.js to store in Supabase
 *
 * NOTE: This script only processes CSV files locally.
 *       Embedding generation happens in generate_embeddings.js
 *       Supabase storage happens in store_embeddings.js using SUPABASE_SERVICE_ROLE_KEY
 *       (Service role is required because RLS policies protect the documents table)
 */

import '#server/bootstrap.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import {
  COMBINED_INPUT_CSV,
  CHUNKS_JSON,
  ARCHIVES_COMBINED_INPUT_CSV,
  ARCHIVES_CHUNKS_JSON,
} from '#utils/datasetsUtils.js';

const CHUNK_SIZE_TOKENS = 350; // Target ~300-500 tokens per chunk

// allow writing to archives folder instead of normal output
const useArchive = process.argv.includes('--archives') || process.argv.includes('--archive');

const TOKENS_PER_WORD = 1.3; // Rough estimate for token counting
const WORDS_PER_CHUNK = Math.floor(CHUNK_SIZE_TOKENS / TOKENS_PER_WORD);

/**
 * Load and parse a generic CSV dataset
 * @param {string} csvFilePath - Path to an input CSV file (e.g. datasets/combined_input.csv)
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
    const MIN_PROBLEM_LENGTH = 20; // default lower for small samples
    const MIN_SOLUTION_LENGTH = 20;

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

    // Extract metadata for classification
    const metadata = extractMetadata(problemText, solutionText, materials, category);

    // Create primary chunk: Problem + Solution (always together)
    const primaryContent = `Problem: ${problemText}\n\nSolution: ${solutionText}`;
    // Build fields object and include any additional CSV columns so adapters can provide extra params
    const fieldsObj = {
      problem: problemText,
      solution: solutionText,
      materials: materials,
      circular_strategy: circularStrategy,
      impact: impact,
    };

    // Copy any extra columns from the original record into fieldsObj (avoid overwriting existing keys)
    for (const [k, v] of Object.entries(record)) {
      const key = String(k).trim();
      if (!key) continue;
      if (
        [
          'problem',
          'Problem',
          'Business Problem',
          'solution',
          'Solution',
          'Business Solution',
          'materials',
          'Materials',
          'Material',
          'circular_strategy',
          'Circular Strategy',
          'circularity',
          'Circularity',
          'category',
          'Category',
          'type',
          'Type',
          'impact',
          'Impact',
          'outcomes',
          'Outcomes',
          'ID',
        ].includes(key)
      ) {
        // skip known columns as we've already normalized them
        continue;
      }
      try {
        const normalized = sanitizeText(record[k]);
        if (normalized && !(key in fieldsObj)) {
          fieldsObj[key] = normalized;
        }
      } catch (e) {
        // ignore
      }
    }

    const primaryChunk = {
      id: `chunk_${chunkIndex++}`,
      source_row: i,
      chunk_index: 0,
      content: primaryContent,
      metadata: {
        category: category,
        source:
          record['source'] ||
          record['Source'] ||
          record['source_url'] ||
          record['Source URL'] ||
          null,
        chunk_type: 'primary',
        source_id: record['ID'] || `row_${i}`,
        industry: metadata.industry,
        scale: metadata.scale,
        r_strategy: metadata.r_strategy,
        primary_material: metadata.primary_material,
        geographic_focus: metadata.geographic_focus,
        fields: fieldsObj,
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
              industry: metadata.industry,
              scale: metadata.scale,
              r_strategy: metadata.r_strategy,
              primary_material: metadata.primary_material,
              geographic_focus: metadata.geographic_focus,
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
            industry: metadata.industry,
            scale: metadata.scale,
            r_strategy: metadata.r_strategy,
            primary_material: metadata.primary_material,
            geographic_focus: metadata.geographic_focus,
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
 * Extract metadata from problem/solution text
 * Classifies industry, scale, strategy, and material focus
 * @private
 */
function extractMetadata(problemText, solutionText, materials, category) {
  const combinedText = `${problemText} ${solutionText} ${materials}`.toLowerCase();

  // Industry classification
  let industry = 'general';
  const industries = {
    agriculture: ['agriculture', 'farming', 'crop', 'pesticide', 'fertilizer', 'harvest', 'soil'],
    textiles: ['textile', 'fabric', 'clothing', 'apparel', 'fashion', 'yarn', 'dye', 'garment'],
    packaging: ['packaging', 'container', 'plastic bag', 'wrap', 'carton', 'box', 'foam'],
    electronics: ['electronics', 'e-waste', 'circuit', 'semiconductor', 'device', 'battery'],
    construction: ['construction', 'building', 'concrete', 'cement', 'demolition', 'brick'],
    energy: ['energy', 'renewable', 'solar', 'wind', 'power', 'grid', 'efficiency'],
    water: ['water', 'wastewater', 'sewage', 'treatment', 'desalination', 'pollution'],
  };

  for (const [ind, keywords] of Object.entries(industries)) {
    if (keywords.some((kw) => combinedText.includes(kw))) {
      industry = ind;
      break;
    }
  }

  // Scale classification
  let scale = 'medium';
  const scaleKeywords = {
    micro: ['micro', 'small', 'startup', 'individual', 'artisan', 'local'],
    small: ['small', 'sme', 'craft', 'shop', 'limited'],
    medium: ['medium', 'mid-size', 'regional'],
    large: ['large', 'enterprise', 'corporate', 'multinational', 'global'],
  };

  for (const [scaleLevel, keywords] of Object.entries(scaleKeywords)) {
    if (keywords.some((kw) => combinedText.includes(kw))) {
      scale = scaleLevel;
      break;
    }
  }

  // Circular strategy classification
  let r_strategy = 'reduction';
  const strategies = {
    reduction: ['reduce', 'minimize', 'less', 'efficient', 'optimize'],
    reuse: ['reuse', 'refurbish', 'recondition', 'second-hand', 'resale'],
    recycling: ['recycle', 'recycling', 'recover', 'material recovery'],
    regeneration: ['regenerate', 'restore', 'regenerative', 'natural'],
  };

  for (const [strat, keywords] of Object.entries(strategies)) {
    if (keywords.some((kw) => combinedText.includes(kw))) {
      r_strategy = strat;
      break;
    }
  }

  // Primary material focus
  let primary_material = 'mixed';
  const materialMap = {
    plastic: ['plastic', 'polymer', 'pvc', 'polyethylene'],
    metal: ['metal', 'aluminum', 'steel', 'copper', 'iron'],
    textile: ['textile', 'fabric', 'cotton', 'polyester', 'wool'],
    organic: ['organic', 'compost', 'biodegradable', 'plant', 'food', 'waste'],
    paper: ['paper', 'cardboard', 'pulp', 'cellulose'],
    glass: ['glass', 'ceramic', 'silica'],
  };

  for (const [material, keywords] of Object.entries(materialMap)) {
    if (keywords.some((kw) => combinedText.includes(kw))) {
      primary_material = material;
      break;
    }
  }

  // Geographic focus
  let geographic_focus = 'global';
  const geoKeywords = {
    asia: ['asia', 'india', 'china', 'southeast asia', 'vietnam', 'philippines'],
    africa: ['africa', 'kenya', 'south africa', 'uganda'],
    europe: ['europe', 'uk', 'germany', 'france', 'eu'],
    americas: ['america', 'usa', 'canada', 'latin america', 'brazil'],
  };

  for (const [geo, keywords] of Object.entries(geoKeywords)) {
    if (keywords.some((kw) => combinedText.includes(kw))) {
      geographic_focus = geo;
      break;
    }
  }

  return {
    industry,
    scale,
    r_strategy,
    primary_material,
    geographic_focus,
  };
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
  // make the chunks file read-only to avoid accidental edits
  try {
    fs.chmodSync(outputPath, 0o444);
  } catch {
    // ignore chmod errors on platforms that don't support it
  }
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

/**
 * Main execution
 * Loads dataset, creates chunks, and saves to file
 */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const datasetPath = useArchive ? ARCHIVES_COMBINED_INPUT_CSV : COMBINED_INPUT_CSV;
  const outputPath = useArchive ? ARCHIVES_CHUNKS_JSON : CHUNKS_JSON;
  if (useArchive) console.log('⚠️  running in archives mode; writing output to archives folder');
  // Ensure output directory exists
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  (async () => {
    try {
      const records = loadDataset(datasetPath);
      const chunks = createChunks(records);
      saveChunksToFile(chunks, outputPath);
      console.log('\n✓ Chunking complete!');
      process.exit(0);
    } catch (error) {
      console.error('\n❌ Fatal error:', error.message);
      process.exit(1);
    }
  })().catch((err) => {
    console.error('Unhandled rejection:', err.message);
    process.exit(1);
  });
}
