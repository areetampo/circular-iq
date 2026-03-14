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
 *
 * --archives flag -> takes input from archives/combined_input.csv and writes output to archives/chunks.json folder instead of normal out/ folder
 *
 * --final flag -> takes combined_input_final.csv as input instead of combined_input.csv
 *
 * NOTE: combined_input_final.csv only present in out/ and if --archives flag is there it simply takes combined_input.csv from archives/ hence, no both flags cannot be used together
 *
 * --enrich-scores flag -> calls OpenAI to enrich each record with estimated scores for the 8 factors (this will be slow and consume tokens, use with caution)
 */

import '#server/bootstrap.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import {
  ARCHIVES_COMBINED_INPUT_CSV,
  ARCHIVES_CHUNKS_JSON,
  OUT_COMBINED_INPUT_CSV,
  OUT_COMBINED_INPUT_FINAL_CSV,
  OUT_CHUNKS_JSON,
  ARCHIVES_TEST_COMBINED_INPUT_CSV,
  OUT_TEST_COMBINED_INPUT_CSV,
  OUT_TEST_COMBINED_INPUT_FINAL_CSV,
  ARCHIVES_TEST_COMBINED_INPUT_FINAL_CSV,
  ARCHIVES_COMBINED_INPUT_FINAL_CSV,
  ARCHIVES_TEST_CHUNKS_JSON,
  OUT_TEST_CHUNKS_JSON,
  writeJson,
  assertFileExists,
  ensureDir,
} from '#utils/datasetsUtils.js';
import OpenAI from 'openai';
import { BACKEND_CONFIG } from '#config/backend.config.js';

const ENRICH_SCORES = process.argv.includes('--enrich-scores');
const useArchive = process.argv.includes('--archives');
const final = process.argv.includes('--final');
const test = process.argv.includes('--test');

const datasetPath = useArchive
  ? test
    ? final
      ? ARCHIVES_TEST_COMBINED_INPUT_FINAL_CSV
      : ARCHIVES_TEST_COMBINED_INPUT_CSV
    : final
      ? ARCHIVES_COMBINED_INPUT_FINAL_CSV
      : ARCHIVES_COMBINED_INPUT_CSV
  : test
    ? final
      ? OUT_TEST_COMBINED_INPUT_FINAL_CSV
      : OUT_TEST_COMBINED_INPUT_CSV
    : final
      ? OUT_COMBINED_INPUT_FINAL_CSV
      : OUT_COMBINED_INPUT_CSV;
assertFileExists(
  datasetPath,
  `${
    test
      ? final
        ? 'combined_input_final_test.csv'
        : 'combined_input_test.csv'
      : final
        ? 'combined_input_final.csv'
        : 'combined_input.csv'
  }`,
);
const outputPath = useArchive
  ? test
    ? ARCHIVES_TEST_CHUNKS_JSON
    : ARCHIVES_CHUNKS_JSON
  : test
    ? OUT_TEST_CHUNKS_JSON
    : OUT_CHUNKS_JSON;

// ensure output folder is ready (writeJson will also handle this later)
const outDir = path.dirname(outputPath);
await ensureDir(outDir);

const openai = new OpenAI({ apiKey: BACKEND_CONFIG.openai.apiKey });

// ===== Constants =====
const CHUNK_SIZE_TOKENS = 350; // Target ~300-500 tokens per chunk
const MAX_METADATA_FIELD_LENGTH = 500; // Truncate long strings to avoid bloating chunks
const TOKENS_PER_WORD = 1.3; // Rough estimate for token counting
const WORDS_PER_CHUNK = Math.floor(CHUNK_SIZE_TOKENS / TOKENS_PER_WORD);

// Max concurrent OpenAI calls when --enrich-scores is active.
// Fires this many gpt-4o-mini requests in parallel — stays well within RPM limits.
const ENRICH_CONCURRENCY = 5;

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
 * Extract concise, dataset‑specific highlights from metadata_json.
 * @param {string} metadataJson - The JSON string from the CSV.
 * @param {string} datasetKey - Dataset prefix (e.g., 'c2c', 'cgr').
 * @returns {string} A short summary string (empty if none).
 */
function getMetadataHighlights(metadataJson, datasetKey) {
  if (!metadataJson) return '';
  try {
    const meta = JSON.parse(metadataJson);
    const parts = [];

    // Use dataset‑specific fields if available (up to 4)
    const fieldsToExtract = DATASET_METADATA_FIELDS[datasetKey];
    if (fieldsToExtract && fieldsToExtract.length > 0) {
      // Pick a few fields that are likely to be informative (first 4)
      const selectedFields = fieldsToExtract.slice(0, 4);
      for (const field of selectedFields) {
        const value = getNestedValue(meta, field);
        if (value !== undefined && value !== null && value !== '') {
          const formatted = formatMetadataValue(value);
          // Use the last part of the field path as a label
          const label = field.split('.').pop();
          parts.push(`${label}: ${formatted}`);
        }
      }
    }

    // Always include key numeric indicators if present
    const numericKeys = [
      'certCount',
      'qualityScore',
      'score',
      'recycled_content',
      'carbon_footprint',
      'repairability_score',
    ];
    for (const key of numericKeys) {
      if (meta[key] !== undefined) {
        parts.push(`${key}: ${meta[key]}`);
      }
    }

    // Include certifications if not already covered and if present
    if (!parts.some((p) => p.includes('certifications') || p.includes('Certifications'))) {
      if (meta.certifications) {
        if (typeof meta.certifications === 'object') {
          const certStr = Object.entries(meta.certifications)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
          // Truncate if too long
          const truncated = certStr.length > 100 ? certStr.substring(0, 100) + '…' : certStr;
          parts.push(`Certifications: ${truncated}`);
        } else if (typeof meta.certifications === 'string') {
          const truncated =
            meta.certifications.length > 100
              ? meta.certifications.substring(0, 100) + '…'
              : meta.certifications;
          parts.push(`Certifications: ${truncated}`);
        }
      }
    }

    return parts.length ? `Metadata: ${parts.join(' | ')}` : '';
  } catch {
    // Silently fail – no highlights
    return '';
  }
}

/**
 * Load and parse a generic CSV dataset
 * @param {string} csvFilePath - Path to an input CSV file (e.g. datasets/combined_input.csv)
 * @returns {Array} Array of parsed records
 */
export function loadDataset(csvFilePath) {
  // already checked if csvFilePath exists in main function using assertFileExists

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

// Module-level material keyword map (was duplicated inside extractMetadata previously)
const MATERIAL_MAP = {
  plastic: ['plastic', 'polymer', 'pvc', 'polyethylene', 'pp', 'pet'],
  metal: ['metal', 'aluminum', 'steel', 'copper', 'iron', 'brass'],
  textile: ['textile', 'fabric', 'cotton', 'polyester', 'wool', 'nylon'],
  organic: ['organic', 'compost', 'biodegradable', 'plant', 'food', 'waste'],
  paper: ['paper', 'cardboard', 'pulp', 'cellulose'],
  glass: ['glass', 'ceramic', 'silica'],
};

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
  const matSearchText =
    materials && materials !== 'Cradle‑to‑Cradle Certified Materials'
      ? materials.toLowerCase()
      : `${problemText} ${solutionText}`.toLowerCase();
  for (const [material, keywords] of Object.entries(MATERIAL_MAP)) {
    if (keywords.some((kw) => matSearchText.includes(kw))) {
      primary_material = material;
      break;
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
 * Call OpenAI to estimate the 8 factor scores for a given record.
 * @param {string} problemText
 * @param {string} solutionText
 * @param {Object} additionalFields -  Optional fields from the record (materials, category, circular_strategy, impact, etc.)
 * @returns {Promise<Object|null>} Scores object or null on failure
 */
async function enrichScores(problemText, solutionText, additionalFields = {}) {
  // Build context string from any additional fields that exist
  const contextParts = [];
  if (additionalFields.materials) contextParts.push(`Materials: ${additionalFields.materials}`);
  if (additionalFields.category) contextParts.push(`Category: ${additionalFields.category}`);
  if (additionalFields.circular_strategy)
    contextParts.push(`Circular strategy: ${additionalFields.circular_strategy}`);
  if (additionalFields.impact) contextParts.push(`Impact: ${additionalFields.impact}`);
  if (additionalFields.metadataHighlights) contextParts.push(additionalFields.metadataHighlights);
  const context = contextParts.length ? `\nAdditional context:\n${contextParts.join('\n')}` : '';

  const prompt = `
You are a circular economy expert. Based on the following business problem and solution, estimate realistic scores (0‑100) for the eight factors used in our evaluation framework:

- public_participation: How easily can stakeholders engage with the system? (0 = very difficult, 100 = universal access)
- infrastructure: Existing infrastructure availability and geographic reach (0 = none, 100 = excellent)
- market_price: Economic value of recovered materials and market demand (0 = needs subsidy, 100 = strong market)
- maintenance: Ease and cost of upkeep, system durability (0 = high maintenance, 100 = very easy)
- uniqueness: Innovation level and competitive advantage (0 = conventional, 100 = highly innovative)
- size_efficiency: Physical footprint and transportation efficiency (0 = very inefficient, 100 = highly efficient)
- chemical_safety: Environmental hazards and health risks (inverse scale: 0 = significant hazards, 100 = minimal risks)
- tech_readiness: Technology maturity and implementation complexity (0 = emerging, 100 = proven, ready)

Business Problem:
${problemText}

Business Solution:
${solutionText}
${context}

Return ONLY a JSON object with keys exactly as above and values between 0 and 100.
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const scores = JSON.parse(response.choices[0].message.content);
    // Validate that all expected keys exist and are numbers
    const expected = [
      'public_participation',
      'infrastructure',
      'market_price',
      'maintenance',
      'uniqueness',
      'size_efficiency',
      'chemical_safety',
      'tech_readiness',
    ];
    for (const key of expected) {
      if (typeof scores[key] !== 'number' || scores[key] < 0 || scores[key] > 100) {
        throw new Error(`Invalid or missing score for ${key}`);
      }
    }
    return scores;
  } catch (error) {
    console.warn(`⚠️  Failed to enrich scores: ${error.message}`);
    return null;
  }
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
 * Process dataset into semantic chunks
 * Preserves problem/solution pairs as foundational units
 * @param {Array} records - Parsed CSV records
 * @returns {Promise<Array>} Array of chunk objects with metadata
 */
export async function createChunks(records) {
  const chunks = [];
  // Dedup guard: tracks content hashes for secondary chunks to prevent identical
  // chunks (e.g. from near-duplicate CSV rows) from causing unique constraint violations
  const seenSecondaryHashes = new Set();

  // Pre-enrich scores concurrently in batches of ENRICH_CONCURRENCY.
  // In normal mode this is skipped entirely (ENRICH_SCORES=false).
  const precomputedScores = new Array(records.length).fill(null);
  if (ENRICH_SCORES) {
    console.log(
      `  Pre-enriching scores for ${records.length} records with concurrency=${ENRICH_CONCURRENCY}...`,
    );
    for (let b = 0; b < records.length; b += ENRICH_CONCURRENCY) {
      const batchSlice = records.slice(b, Math.min(b + ENRICH_CONCURRENCY, records.length));
      const batchScores = await Promise.all(
        batchSlice.map((rec, off) => {
          const pText = sanitizeText(
            rec['problem'] || rec['Problem'] || rec['Business Problem'] || '',
          );
          const sText = sanitizeText(
            rec['solution'] || rec['Solution'] || rec['Business Solution'] || '',
          );
          const idx = b + off;
          const dKey = (rec['ID'] || '').split('_')[0] || 'unknown';
          const highlights = getMetadataHighlights(rec['metadata_json'] || '', dKey);
          return enrichScores(pText, sText, {
            materials: sanitizeText(rec['materials'] || rec['Materials'] || rec['Material'] || ''),
            category: sanitizeText(
              rec['category'] || rec['Category'] || rec['type'] || rec['Type'] || 'General',
            ),
            circular_strategy: sanitizeText(
              rec['circular_strategy'] || rec['Circular Strategy'] || '',
            ),
            impact: sanitizeText(rec['impact'] || rec['Impact'] || ''),
            metadataHighlights: highlights,
          }).then((s) => {
            precomputedScores[idx] = s;
          });
        }),
      );
      if ((b + ENRICH_CONCURRENCY) % 50 < ENRICH_CONCURRENCY) {
        console.log(
          `  Enriched ${Math.min(b + ENRICH_CONCURRENCY, records.length)}/${records.length} records...`,
        );
      }
    }
    console.log(`  ✓ Score enrichment complete.`);
  }

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

    // Progress for large non-enrich datasets (enrich has its own counter)
    if (!ENRICH_SCORES && records.length > 500 && (i + 1) % 500 === 0) {
      console.log(`  Chunking record ${i + 1}/${records.length}...`);
    }

    // Use pre-enriched scores from the concurrent batch above (null if not enriching)
    const scores = precomputedScores[i];

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
      id: `row_${i}_chunk_0`,
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
        scores: scores, // may be null if enrichment failed
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

      // Skip secondary chunk if identical content already exists from a previous row.
      // This prevents duplicate key violations on idx_unique_chunk_field when near-duplicate
      // CSV rows produce secondary chunks with the same content (same solution/materials/impact).
      if (seenSecondaryHashes.has(secondaryContent)) {
        console.warn(
          `Skipping duplicate secondary chunk for row_${i} (identical content already seen)`,
        );
      } else {
        seenSecondaryHashes.add(secondaryContent);

        // Split secondary content if it's too long
        if (wordCount > WORDS_PER_CHUNK * 1.5) {
          const subChunks = splitLongText(secondaryContent, WORDS_PER_CHUNK);
          subChunks.forEach((subContent, subIdx) => {
            chunks.push({
              id: `row_${i}_chunk_${subIdx + 1}`,
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
                fields: fieldsObj,
                scores: scores, // may be null if enrichment failed
              },
              word_count: countWords(subContent),
            });
          });
        } else {
          chunks.push({
            id: `row_${i}_chunk_1`,
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
              fields: fieldsObj,
              scores: scores, // may be null if enrichment failed
            },
            word_count: countWords(secondaryContent),
          });
        }
      }
    }
  }

  console.log(`✓ Created ${chunks.length} semantic chunks from ${records.length} records`);
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
  console.log('Starting chunk generation with the following options:');
  console.log(`  Enrich scores with OpenAI: ${ENRICH_SCORES}`);
  console.log(`  Use archives folder: ${useArchive}`);
  console.log(`  Use final dataset: ${final}`);
  console.log(`  Use test dataset: ${test}`);
  console.log(`  Input dataset: ${datasetPath}`);
  console.log(`  Output chunks file: ${outputPath}`);

  (async () => {
    try {
      const records = loadDataset(datasetPath);
      const chunks = await createChunks(records);
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
