/** Chunking constants and functions — used by `pipeline/generate_chunks.js`. */

// ===== Constants =====
const CHUNK_SIZE_TOKENS = 350; // Target ~300-500 tokens per chunk
const MAX_METADATA_FIELD_LENGTH = 500; // Truncate long strings to avoid bloating chunks
const TOKENS_PER_WORD = 1.3; // Rough estimate for token counting
const WORDS_PER_CHUNK = Math.floor(CHUNK_SIZE_TOKENS / TOKENS_PER_WORD);

// Max concurrent OpenAI calls when --enrich-scores is active.
// Fires this many gpt-4o-mini requests in parallel — stays well within RPM limits.
const ENRICH_CONCURRENCY = 5;

/**
 * Extract metadata for classification — using reliable columns.
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
 * Extract and format useful information from metadata_json, dataset‑aware.
 * @param {string} metadataJson - The JSON string from CSV.
 * @param {string} datasetKey - Dataset prefix (e.g., 'c2c', 'cgr').
 * @returns {string} Formatted metadata string, or empty if none.
 */
function formatMetadataFromJson(metadataJson, datasetKey) {
  if (!metadataJson) return '';
  try {
    const meta = JSON.parse(metadataJson);
    const parts = [];

    // Use dataset‑specific field list if available
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
    // Silently fail - no logger import here
    return '';
  }
}

/**
 * Extract concise, dataset‑specific highlights from metadata_json.
 * @param {string} metadataJson - The JSON string from CSV.
 * @param {string} datasetKey - Dataset prefix (e.g., 'c2c', 'cgr').
 * @returns {string} A short summary string (empty if none).
 */
function getMetadataHighlights(metadataJson, datasetKey) {
  if (!metadataJson) return '';
  try {
    const meta = JSON.parse(metadataJson);
    const parts = [];

    // Use dataset‑specific fields if available (up to 4)
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
    // Silently fail – no highlights
    return '';
  }
}

/**
 * Sanitize and normalize text
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
 */
function countWords(text) {
  return text.trim().split(/\s+/).length;
}

/**
 * Split long text into chunks of roughly equal word count
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
