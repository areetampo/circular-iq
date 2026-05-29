/**
 * Text chunking and dataset-aware metadata formatting helpers for the RAG pipeline.
 * These helpers preserve searchable context while keeping generated chunks and metadata
 * summaries short enough for embedding and prompt assembly.
 */

// ===== Constants
/** Target token count per chunk, tuned for roughly 300-500 token retrieval passages. */
const CHUNK_SIZE_TOKENS = 350;
/** Maximum characters retained from any single metadata field in chunk summaries. */
const MAX_METADATA_FIELD_LENGTH = 500;
/** Heuristic conversion used to derive chunk word count when no tokenizer is available. */
const TOKENS_PER_WORD = 1.3;
/** Target word count per generated chunk, derived from `CHUNK_SIZE_TOKENS`. */
const WORDS_PER_CHUNK = Math.floor(CHUNK_SIZE_TOKENS / TOKENS_PER_WORD);

/** Max concurrent OpenAI calls when score enrichment is enabled; tuned to avoid RPM bursts. */
const ENRICH_CONCURRENCY = 5;

/**
 * Infers coarse retrieval metadata when processed rows lack normalized fields.
 * Keyword matches intentionally fall back to conservative `general`, `mixed`, and `reduction`
 * values so downstream filters always receive a complete shape.
 *
 * @param {string} problemText - Business problem text used as fallback keyword evidence.
 * @param {string} solutionText - Proposed circular solution text used as fallback keyword evidence.
 * @param {string} materials - Dataset material field when available.
 * @param {string} category - Dataset category used to infer industry.
 * @param {string} circularStrategy - Dataset circular strategy used to infer R-strategy.
 * @returns {{ industry: string, scale: null, r_strategy: string, primary_material: string, geographic_focus: null }} Complete metadata object used for generated RAG chunks.
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

  // Prefer the materials column when it is specific; otherwise infer from row text.
  let primary_material = 'mixed';
  const matSearchText =
    materials && materials !== 'Cradle‑to‑Cradle Certified Materials'
      ? materials.toLowerCase()
      : `${problemText} ${solutionText}`.toLowerCase();

  // Simple material keyword detection
  if (matSearchText.includes('plastic') || matSearchText.includes('polymer'))
    primary_material = 'plastic';
  else if (
    matSearchText.includes('metal') ||
    matSearchText.includes('aluminum') ||
    matSearchText.includes('steel')
  )
    primary_material = 'metal';
  else if (
    matSearchText.includes('textile') ||
    matSearchText.includes('fabric') ||
    matSearchText.includes('cotton')
  )
    primary_material = 'textile';
  else if (
    matSearchText.includes('organic') ||
    matSearchText.includes('compost') ||
    matSearchText.includes('biodegradable')
  )
    primary_material = 'organic';
  else if (matSearchText.includes('paper') || matSearchText.includes('cardboard'))
    primary_material = 'paper';
  else if (matSearchText.includes('glass') || matSearchText.includes('ceramic'))
    primary_material = 'glass';

  // Prefer the circular strategy column before falling back to keyword inference.
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

  // Scale and geography are not reliably extractable from these rows.
  const scale = null;
  const geographic_focus = null;

  return { industry, scale, r_strategy, primary_material, geographic_focus };
}

/**
 * Resolves nested metadata values using dot notation without throwing on missing segments.
 *
 * @param {Record<string, unknown>} obj - Source object containing nested metadata fields.
 * @param {string} path - Dot-separated metadata path such as `sections.results`.
 * @returns {unknown} Resolved value, or `undefined` when any path segment is missing.
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
 * Formats arbitrary metadata into a compact single-field summary fragment.
 * Strings, joined arrays, and JSON-stringified objects are truncated to the metadata cap.
 *
 * @param {unknown} value - Metadata value from a CSV row or parsed JSON field.
 * @returns {string} Display-safe metadata fragment capped at `MAX_METADATA_FIELD_LENGTH`.
 */
function formatMetadataValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    if (value.length > 500) {
      return value.substring(0, 500) + '…';
    }
    return value;
  }
  if (Array.isArray(value)) {
    const joined = value
      .map((v) => String(v).trim())
      .filter(Boolean)
      .join(', ');
    if (joined.length > 500) {
      return joined.substring(0, 500) + '…';
    }
    return joined;
  }
  if (typeof value === 'object') {
    // For simple objects, convert to string, but limit length
    const str = JSON.stringify(value);
    if (str.length > 500) {
      return str.substring(0, 500) + '…';
    }
    return str;
  }
  return String(value);
}

/**
 * Extracts dataset-specific metadata fields into a long retrieval summary.
 * Known dataset keys select curated fields; unknown or empty mappings fall back to common
 * company/certification/material/score fields when present.
 *
 * @param {string} metadataJson - JSON-encoded metadata from a processed dataset row.
 * @param {string} datasetKey - Dataset prefix (e.g., `c2c`, `cgr`).
 * @returns {string} `Metadata: ...` summary assembled from dataset-specific fields, or empty when parsing fails or no useful fields exist.
 */
function formatMetadataFromJson(metadataJson, datasetKey) {
  if (!metadataJson) return '';
  try {
    const meta = JSON.parse(metadataJson);
    const parts = [];

    // Dataset-specific field lists keep retrieval metadata focused and predictable.
    const fieldsToExtract = {
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
      refed: [
        'original.attributes.name',
        'original.attributes.definition',
        'original.attributes.data',
      ],
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
    }[datasetKey];

    if (fieldsToExtract && fieldsToExtract.length > 0) {
      for (const field of fieldsToExtract) {
        const value = getNestedValue(meta, field);
        if (value !== undefined && value !== null && value !== '') {
          const formatted = formatMetadataValue(value);
          // Use the last part of the field path as a label (or whole path)
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
  } catch {
    // Malformed metadata should not block chunk generation.
    return '';
  }
}

/**
 * Extracts a short metadata summary for chunk text where only the most useful fields fit.
 * This uses at most the first four curated fields, then appends important numeric indicators
 * and certifications when available.
 *
 * @param {string} metadataJson - JSON-encoded metadata from a processed dataset row.
 * @param {string} datasetKey - Dataset prefix (e.g., `c2c`, `cgr`).
 * @returns {string} Compact `Metadata: ...` highlight string, or empty when parsing fails or nothing useful is present.
 */
function getMetadataHighlights(metadataJson, datasetKey) {
  if (!metadataJson) return '';
  try {
    const meta = JSON.parse(metadataJson);
    const parts = [];

    // Use at most four dataset-specific fields so highlights stay compact.
    const fieldsToExtract = {
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
      refed: [
        'original.attributes.name',
        'original.attributes.definition',
        'original.attributes.data',
      ],
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
    }[datasetKey];

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
    // Malformed metadata should not block chunk generation.
    return '';
  }
}

/**
 * Sanitizes and normalizes text by trimming whitespace, collapsing multiple spaces,
 * and converting curly quotes to straight quotes.
 *
 * @param {string} text - Raw dataset text that may contain irregular whitespace or curly quotes.
 * @returns {string} Normalized single-line text for chunk output.
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
 * Estimates the word count of a string by splitting on whitespace.
 *
 * @param {string} text - Sanitized or raw content to measure before chunking.
 * @returns {number} Whitespace-delimited word count.
 */
function countWords(text) {
  return text.trim().split(/\s+/).length;
}

/**
 * Splits long text into chunks of roughly equal word count by breaking at sentence boundaries.
 * Attempts to keep chunks close to the target word count while preserving sentence integrity.
 *
 * @param {string} text - Long content field from a processed dataset row.
 * @param {number} targetWords - Target word count per chunk.
 * @returns {Array<string>} Sentence-preserving chunks near the target word count.
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

export {
  countWords,
  ENRICH_CONCURRENCY,
  extractMetadata,
  formatMetadataFromJson,
  getMetadataHighlights,
  sanitizeText,
  splitLongText,
  WORDS_PER_CHUNK,
};
