/* global process */

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
  writeJson,
  assertFileExists,
  ensureDir,
} from '#utils/datasetsUtils.js';

// ===== Constants =====
const CHUNK_SIZE_TOKENS = 350; // Target ~300-500 tokens per chunk
const MAX_METADATA_FIELD_LENGTH = 500; // Truncate long strings to avoid bloating chunks

// allow writing to archives folder instead of normal output
const useArchive = process.argv.includes('--archives') || process.argv.includes('--archive');

const TOKENS_PER_WORD = 1.3; // Rough estimate for token counting
const WORDS_PER_CHUNK = Math.floor(CHUNK_SIZE_TOKENS / TOKENS_PER_WORD);

// ===== Dataset‑specific metadata extractors =====
// Each dataset key (prefix from ID) maps to an array of field names (or paths) to extract.
// For nested objects, use dot notation. If the value is an array, it will be joined.
const DATASET_METADATA_FIELDS = {
  c2c: ['company', 'certifications', 'description', 'materials', 'score', 'certCount'],
  cgr: ['extracted_stats', 'original_snippet'],
  circle: ['type', 'location', 'has_problem', 'has_solution', 'has_outcome'],
  dataeu: ['Ville', 'Structure', 'Partenaires', "Domaine d'action", 'Localisation action'],
  ecesp: ['organisation', 'country', 'keyArea', 'sectors', 'results'],
  eippcb: ['source', 'bat_index', 'type'],
  emf: ['title', 'orgLine', 'locationLine', 'strategyLine', 'ai_extracted'],
  env: [
    'Location',
    'Primary energy supply Fossil fuels (% of total) 2012',
    'Carbon dioxide emissions per capita (tonnes) 2011',
  ],
  epa: [
    'facility',
    'state',
    'naics',
    'total_release_lbs',
    'recycled_lbs',
    'energy_recovery_lbs',
    'treated_lbs',
    'disposed_lbs',
    'combined_score',
  ],
  eulac: [
    'company',
    'economic_activity',
    'circular_strategy',
    'materials_detected',
    'metrics_detected',
    'source_type',
  ],
  eurostat: ['country', 'year', 'value', 'unit', 'dataset', 'source'],
  fashion: [], // no metadata in sample
  ghg: ['country', 'sector', 'gas', 'year', 'emissions_Gg', 'unit', 'source_file', 'citation'],
  gewm: [
    'country',
    'region',
    'ewaste_generated_million_kg',
    'ewaste_kg_per_capita',
    'collected_million_kg',
    'legislation',
    'epr',
    'collection_target',
    'recycling_target',
  ],
  gtg: ['id', 'product', 'summary', 'embedded_value', 'categories'],
  ifixit: [
    'oem',
    'device',
    'release_date',
    'repairability_score',
    'category',
    'source_file',
    'bullet_type',
    'original_bullet',
  ],
  kaggle: [
    'Product name (and functional unit)',
    'Company',
    "Product's carbon footprint (PCF, kg CO2e)",
    'Year of reporting',
  ],
  kalundborg: ['paragraphs', 'extracted_at'], // full_content is too long, skip
  mnd: ['challenge_code', 'geometric_mean'],
  metabolic: ['original_filename', 'chunk_preview', 'score'],
  oecd: ['REF_AREA', 'MEASURE', 'MATERIAL', 'TIME_PERIOD', 'OBS_VALUE'],
  obf: ['brands', 'categories', 'packaging_materials_tags', 'labels', 'product_name'],
  off: ['brands', 'categories', 'packaging_materials_tags', 'labels', 'product_name'],
  opf: ['categories', 'code', 'labels', 'packaging', 'product_name'],
  refed: ['original.attributes.name', 'original.attributes.definition', 'original.attributes.data'],
  rema: ['title', 'description', 'industry', 'score'],
  sei: ['summary', 'goals', 'strategies', 'findings', 'quantitative', 'fileName'],
  unep: ['Country', 'Category', 'Flow name', '2024'], // last year value
  wbcsd: [
    'company',
    'industry',
    'quote',
    'sections.why',
    'sections.challenges',
    'sections.solutions',
    'sections.results',
  ],
  wbp: ['id', 'country', 'region', 'lending_instrument', 'approval_date', 'status'],
  wrap: ['source_file', 'score', 'full_paragraph', 'category'],
};

// ===== Helper functions =====

/**
 * Safely get a nested value from an object using dot notation.
 * @param {Object} obj - The object to traverse.
 * @param {string} path - Dot‑separated path.
 * @returns {any} The value, or undefined if not found.
 */
function getNestedValue(obj, path) {
  return path
    .split('.')
    .reduce(
      (current, key) => (current && current[key] !== undefined ? current[key] : undefined),
      obj,
    );
}

/**
 * Format a value for inclusion in metadata summary.
 * - Strings are truncated if too long.
 * - Arrays are joined with commas.
 * - Objects are stringified (shallow) if small.
 * @param {any} value - The value to format.
 * @returns {string} Formatted string.
 */
function formatMetadataValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    if (value.length > MAX_METADATA_FIELD_LENGTH) {
      return value.substring(0, MAX_METADATA_FIELD_LENGTH) + '…';
    }
    return value;
  }
  if (Array.isArray(value)) {
    const joined = value
      .map((v) => String(v).trim())
      .filter(Boolean)
      .join(', ');
    if (joined.length > MAX_METADATA_FIELD_LENGTH) {
      return joined.substring(0, MAX_METADATA_FIELD_LENGTH) + '…';
    }
    return joined;
  }
  if (typeof value === 'object') {
    // For simple objects, convert to string, but limit length
    const str = JSON.stringify(value);
    if (str.length > MAX_METADATA_FIELD_LENGTH) {
      return str.substring(0, MAX_METADATA_FIELD_LENGTH) + '…';
    }
    return str;
  }
  return String(value);
}

/**
 * Extract and format useful information from metadata_json, dataset‑aware.
 * @param {string} metadataJson - The JSON string from the CSV.
 * @param {string} datasetKey - Dataset prefix (e.g., 'c2c', 'cgr').
 * @returns {string} Formatted metadata string, or empty if none.
 */
function formatMetadataFromJson(metadataJson, datasetKey) {
  if (!metadataJson) return '';
  try {
    const meta = JSON.parse(metadataJson);
    const parts = [];

    // Use dataset‑specific field list if available
    const fieldsToExtract = DATASET_METADATA_FIELDS[datasetKey];
    if (fieldsToExtract && fieldsToExtract.length > 0) {
      for (const field of fieldsToExtract) {
        const value = getNestedValue(meta, field);
        if (value !== undefined && value !== null && value !== '') {
          const formatted = formatMetadataValue(value);
          // Use the last part of the field path as a label (or the whole path)
          const label = field.split('.').pop();
          parts.push(`${label}: ${formatted}`);
        }
      }
    }

    // Fallback: extract common fields (for datasets not explicitly listed)
    if (parts.length === 0) {
      if (meta.company) parts.push(`Company: ${formatMetadataValue(meta.company)}`);
      if (meta.certifications && typeof meta.certifications === 'object') {
        const certs = Object.entries(meta.certifications)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        if (certs) parts.push(`Certifications: ${certs}`);
      }
      if (meta.description) parts.push(`Description: ${formatMetadataValue(meta.description)}`);
      if (meta.materials && meta.materials !== 'Cradle‑to‑Cradle Certified Materials') {
        parts.push(`Materials: ${formatMetadataValue(meta.materials)}`);
      }
      if (meta.score !== undefined) parts.push(`Score: ${meta.score}`);
      if (meta.certCount !== undefined) parts.push(`Number of certifications: ${meta.certCount}`);
    }

    return parts.length ? `Metadata: ${parts.join(' | ')}` : '';
  } catch (e) {
    console.warn(`⚠️ Could not parse metadata_json: ${e.message}`);
    return '';
  }
}

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

    // Extract dataset key from ID (first part before underscore)
    const id = record['ID'] || '';
    const datasetKey = id.split('_')[0] || 'unknown';

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
    const MIN_PROBLEM_LENGTH = 20;
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
    const metadata = extractMetadata(
      problemText,
      solutionText,
      materials,
      category,
      circularStrategy,
    );

    // Parse metadata_json and get a formatted summary
    const metadataJson = record['metadata_json'] || '';
    const metadataSummary = formatMetadataFromJson(metadataJson, datasetKey);

    // Build a complete fields object (same for primary and secondary)
    const fieldsObj = {
      problem: problemText,
      solution: solutionText,
      materials: materials,
      circular_strategy: circularStrategy,
      impact: impact,
      source_url: record['source_url'] || record['Source URL'] || null,
      metadata_json: metadataJson,
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
          'source_url',
          'Source URL',
          'metadata_json',
          'ID',
        ].includes(key)
      ) {
        continue;
      }
      try {
        const normalized = sanitizeText(record[k]);
        if (normalized && !(key in fieldsObj)) {
          fieldsObj[key] = normalized;
        }
      } catch {
        // ignore
      }
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

    // Create secondary chunks if additional context exists
    const secondaryParts = [];
    if (materials) secondaryParts.push(`Materials: ${materials}`);
    if (circularStrategy) secondaryParts.push(`Circular Strategy: ${circularStrategy}`);
    if (impact) secondaryParts.push(`Impact: ${impact}`);
    if (metadataSummary) secondaryParts.push(metadataSummary);

    if (secondaryParts.length > 0) {
      // Include full problem+solution pair + supplementary context
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
              fields: fieldsObj, // Use full fieldsObj
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
            fields: fieldsObj, // Use full fieldsObj
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
 * Extract metadata for classification – using reliable columns.
 * @private
 */
function extractMetadata(problemText, solutionText, materials, category, circularStrategy) {
  // Industry: from category (simple mapping)
  let industry = 'general';
  const catLower = category.toLowerCase();
  if (catLower.includes('textile')) industry = 'textiles';
  else if (catLower.includes('packaging')) industry = 'packaging';
  else if (catLower.includes('construction')) industry = 'construction';
  else if (catLower.includes('electronics')) industry = 'electronics';
  else if (catLower.includes('health')) industry = 'health';
  else if (catLower.includes('automotive')) industry = 'automotive';

  // Primary material – from materials column if specific, else fallback to keywords
  let primary_material = 'mixed';
  if (materials && materials !== 'Cradle‑to‑Cradle Certified Materials') {
    const matLower = materials.toLowerCase();
    const materialMap = {
      plastic: ['plastic', 'polymer', 'pvc', 'polyethylene', 'pp', 'pet'],
      metal: ['metal', 'aluminum', 'steel', 'copper', 'iron', 'brass'],
      textile: ['textile', 'fabric', 'cotton', 'polyester', 'wool', 'nylon'],
      organic: ['organic', 'compost', 'biodegradable', 'plant', 'food', 'waste'],
      paper: ['paper', 'cardboard', 'pulp', 'cellulose'],
      glass: ['glass', 'ceramic', 'silica'],
    };
    for (const [material, keywords] of Object.entries(materialMap)) {
      if (keywords.some((kw) => matLower.includes(kw))) {
        primary_material = material;
        break;
      }
    }
  } else {
    // fallback to keyword detection in combined text
    const combined = `${problemText} ${solutionText}`.toLowerCase();
    const materialMap = {
      plastic: ['plastic', 'polymer', 'pvc', 'polyethylene', 'pp', 'pet'],
      metal: ['metal', 'aluminum', 'steel', 'copper', 'iron', 'brass'],
      textile: ['textile', 'fabric', 'cotton', 'polyester', 'wool', 'nylon'],
      organic: ['organic', 'compost', 'biodegradable', 'plant', 'food', 'waste'],
      paper: ['paper', 'cardboard', 'pulp', 'cellulose'],
      glass: ['glass', 'ceramic', 'silica'],
    };
    for (const [material, keywords] of Object.entries(materialMap)) {
      if (keywords.some((kw) => combined.includes(kw))) {
        primary_material = material;
        break;
      }
    }
  }

  // Circular strategy – use circularStrategy column if present, else keyword
  let r_strategy = 'reduction';
  if (circularStrategy) {
    const stratLower = circularStrategy.toLowerCase();
    if (stratLower.includes('reuse')) r_strategy = 'reuse';
    else if (stratLower.includes('recycl')) r_strategy = 'recycling';
    else if (stratLower.includes('regenerat')) r_strategy = 'regeneration';
    else if (stratLower.includes('reduce')) r_strategy = 'reduction';
  } else {
    const combined = `${problemText} ${solutionText}`.toLowerCase();
    if (combined.includes('reuse')) r_strategy = 'reuse';
    else if (combined.includes('recycl')) r_strategy = 'recycling';
    else if (combined.includes('regenerat')) r_strategy = 'regeneration';
    else if (combined.includes('reduce')) r_strategy = 'reduction';
  }

  // Scale and geographic focus – not reliably extractable; set to null
  const scale = null;
  const geographic_focus = null;

  return { industry, scale, r_strategy, primary_material, geographic_focus };
}

/**
 * Sanitize and normalize text
 * @private
 */
function sanitizeText(text) {
  if (!text) return '';
  return String(text)
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
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
export async function saveChunksToFile(chunks, outputPath) {
  try {
    await writeJson(outputPath, chunks);
  } catch (err) {
    throw new Error(`Failed to write chunks file: ${err.message}`);
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
  // console.log(`  Categories: ${stats.categories.join(', ')}`);
}

/**
 * Main execution
 * Loads dataset, creates chunks, and saves to file
 */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const datasetPath = useArchive ? ARCHIVES_COMBINED_INPUT_CSV : COMBINED_INPUT_CSV;
  assertFileExists(datasetPath, 'combined input csv');
  const outputPath = useArchive ? ARCHIVES_CHUNKS_JSON : CHUNKS_JSON;

  // ensure output folder is ready (writeJson will also handle this later)
  const outDir = path.dirname(outputPath);
  await ensureDir(outDir);

  if (useArchive) console.log('⚠️️️  running in archives mode; writing output to archives folder');

  (async () => {
    try {
      const records = loadDataset(datasetPath);
      const chunks = createChunks(records);
      await saveChunksToFile(chunks, outputPath);
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
