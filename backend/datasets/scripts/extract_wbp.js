
/**
 * Reads local JSON files (basic and detailed project lists), optionally parses sector taxonomy from a PDF, and extracts text from PDF reports to create a curated CSV of circular‑economy‑relevant projects. Improvements:
 */

import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

import {
    cleanText,
    DATASET_KEYS,
    DATASET_LOOKUP,
    getDatasetProcessedCsvPath,
    getDatasetRawDir,
    verifyPathsExist,
    writeCsv,
} from '#utils/datasetsUtils.js';
import { logger } from '#utils/logger.js';

const require = createRequire(import.meta.url);

// Configure pdfjs worker
const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

// Dataset configuration
const DATASET_KEY = DATASET_KEYS.wbp;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const RAW_DIR = getDatasetRawDir(DATASET_KEY);
verifyPathsExist(RAW_DIR);

const REPORTS_DIR = path.join(RAW_DIR, 'reports');
const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

// File paths for local JSON files
const BASIC_JSON = path.join(RAW_DIR, dataset.raw_folder_contents.basic_json);
const DETAILED_JSON = path.join(RAW_DIR, dataset.raw_folder_contents.detailed_json);
const TAXONOMY_PDF = path.join(RAW_DIR, dataset.raw_folder_contents.taxonomy_pdf);

// Verify required files exist
verifyPathsExist([REPORTS_DIR, BASIC_JSON, DETAILED_JSON, TAXONOMY_PDF]);

// Maximum number of output rows (adjustable)
const MAX_OUTPUT_ROWS = 400;

// ----------------------------------------------------------------------
// Hard‑coded fallback sector mapping (from World Bank taxonomy)
// (unchanged – omitted here for brevity, but keep the full map)
// ----------------------------------------------------------------------
const FALLBACK_SECTOR_MAP = new Map([
  /* ... full map ... */
]);

// ----------------------------------------------------------------------
// Mapping from World Bank theme codes to circular economy strategies
// (unchanged)
// ----------------------------------------------------------------------
const THEME_TO_CIRCULAR_STRATEGY = {
  2: 'Climate Resilience',
  3: 'Resource Efficiency',
  4: 'Climate Resilience',
  5: 'Resource Efficiency',
  6: 'Renewable Energy',
  7: 'Sustainable Development',
  8: 'Sustainable Development',
  9: 'Renewable Energy',
  10: 'Circular Economy',
  11: 'Sustainable Development',
};

// ----------------------------------------------------------------------
// Helper: extract text from a PDF using Uint8Array
// ----------------------------------------------------------------------
async function extractTextFromPDF(filePath) {
  const dataBuffer = await fs.promises.readFile(filePath);
  const uint8Array = new Uint8Array(dataBuffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array, useSystemFonts: true });
  const pdfDocument = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    let pageText = strings.join(' ');
    pageText = pageText.replace(/\s+/g, ' ').trim();
    fullText += pageText + '\n';
  }
  return fullText;
}

// ----------------------------------------------------------------------
// Parse taxonomy PDF – try to parse, but always fall back to hard‑coded map
// ----------------------------------------------------------------------
async function parseTaxonomyPDF(filePath) {
  if (!fs.existsSync(filePath)) {
    logger.warn('⚠️ Taxonomy PDF not found, using hard‑coded sector mapping.');
    return FALLBACK_SECTOR_MAP;
  }

  try {
    const text = await extractTextFromPDF(filePath);
    const lines = text.split('\n');
    const sectorMap = new Map();

    // Find the line that starts the table (contains "Codes Sectors Pg.")
    let startIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Codes Sectors Pg.')) {
        startIdx = i;
        break;
      }
    }
    if (startIdx === -1) {
      logger.warn('⚠️ Could not find the sector table in PDF, using hard‑coded mapping.');
      return FALLBACK_SECTOR_MAP;
    }

    // Process lines after the header
    for (let i = startIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const tokens = line.split(/\s+/);
      let j = 0;
      while (j < tokens.length) {
        const token = tokens[j];
        if (/^[A-Z]{2}$/.test(token)) {
          const code = token;
          j++;
          let nameParts = [];
          while (j < tokens.length && !/^\d+$/.test(tokens[j]) && !/^[A-Z]{2}$/.test(tokens[j])) {
            nameParts.push(tokens[j]);
            j++;
          }
          const name = nameParts.join(' ').trim();
          if (name) sectorMap.set(code, name);
        } else {
          j++;
        }
      }
    }

    if (sectorMap.size === 0) {
      logger.warn('⚠️ PDF parsing returned 0 codes, using hard‑coded mapping.');
      return FALLBACK_SECTOR_MAP;
    }

    logger.info({ codes: sectorMap.size }, 'Sector taxonomy loaded from PDF');
    return sectorMap;
  } catch (error) {
    logger.warn({ error }, 'Error parsing taxonomy PDF, using hard-coded mapping');
    return FALLBACK_SECTOR_MAP;
  }
}

// ----------------------------------------------------------------------
// Parse a report PDF and extract sections
// ----------------------------------------------------------------------
async function parseReport(filePath) {
  const text = await extractTextFromPDF(filePath);
  const sections = {};

  const patterns = [
    {
      key: 'objectives',
      pattern: /2\.\s*Project Objectives and Components:?\s*([\s\S]+?)(?=3\.|$)/i,
    },
    { key: 'components', pattern: /c\.\s*Components\s*\([^)]*\):\s*([\s\S]+?)(?=d\.|$)/i },
    { key: 'outcome', pattern: /6\.\s*Outcome:?\s*([\s\S]+?)(?=7\.|$)/i },
    { key: 'lessons', pattern: /13\.\s*Lessons:?\s*([\s\S]+?)(?=14\.|$)/i },
    { key: 'rating', pattern: /Outcome Rating:\s*([^\n]+)/i },
  ];

  for (const { key, pattern } of patterns) {
    const match = text.match(pattern);
    if (match) {
      sections[key] = match[1].replace(/\s+/g, ' ').trim();
    }
  }

  return { sections, fullText: text.substring(0, 2000) };
}

// ----------------------------------------------------------------------
// Load and merge projects from basic + detailed JSON (local files)
// ----------------------------------------------------------------------
function loadProjects(basicData, detailedData) {
  const basicProjects = basicData.projects || {};
  const detailedProjects = detailedData.projects || {};

  const allIds = new Set([...Object.keys(basicProjects), ...Object.keys(detailedProjects)]);
  const combined = [];

  for (const id of allIds) {
    const basic = basicProjects[id] || {};
    const detailed = detailedProjects[id] || {};

    const getFirst = (arr) => (Array.isArray(arr) && arr.length > 0 ? arr[0] : arr);

    const project = {
      id,
      countryname: getFirst(detailed.countryname) || getFirst(basic.countryname) || '',
      regionname: detailed.regionname || basic.regionname || '',
      project_name: detailed.project_name || basic.project_name || '',
      lendinginstr: detailed.lendinginstr || basic.lendinginstr || '',
      totalamt: detailed.totalamt || basic.totalamt || '0',
      boardapprovaldate: detailed.boardapprovaldate || basic.boardapprovaldate || '',
      url: detailed.url || basic.url || '',
      status: detailed.projectstatusdisplay || basic.projectstatusdisplay || '',
      abstract: detailed.project_abstract?.['cdata!'] || basic.project_abstract?.['cdata!'] || '',
      // Collect sector names and codes from detailed.sector (preferred)
      sectorNames: [],
      sectorCodes: [],
      themeCodes: [],
    };

    // Extract sector names from detailed.sector array (if present)
    if (detailed.sector && Array.isArray(detailed.sector)) {
      for (const s of detailed.sector) {
        if (s.Name) project.sectorNames.push(s.Name);
        if (s.code) project.sectorCodes.push(s.code);
      }
    }
    // Fallback: use sector1, sector2, etc. from basic
    if (project.sectorNames.length === 0) {
      if (basic.sector1?.Name) project.sectorNames.push(basic.sector1.Name);
      if (basic.sector2?.Name) project.sectorNames.push(basic.sector2.Name);
      if (basic.sector3?.Name) project.sectorNames.push(basic.sector3.Name);
    }

    // Extract theme codes
    if (detailed.mjtheme_namecode && Array.isArray(detailed.mjtheme_namecode)) {
      for (const t of detailed.mjtheme_namecode) {
        if (t.code) project.themeCodes.push(t.code);
      }
    } else if (basic.mjtheme_namecode && Array.isArray(basic.mjtheme_namecode)) {
      for (const t of basic.mjtheme_namecode) {
        if (t.code) project.themeCodes.push(t.code);
      }
    }

    combined.push(project);
  }
  return combined;
}

// ----------------------------------------------------------------------
// Extract materials from text (simple keyword search) – unchanged
// ----------------------------------------------------------------------
const MATERIAL_KEYWORDS = [
  /* ... same list ... */
];

function extractMaterials(text) {
  if (!text) return '';
  const lower = text.toLowerCase();
  const found = new Set();
  for (const kw of MATERIAL_KEYWORDS) {
    if (lower.includes(kw)) found.add(kw);
  }
  return Array.from(found).join(', ');
}

// ----------------------------------------------------------------------
// Determine top‑level category from sector name – unchanged
// ----------------------------------------------------------------------
function getTopLevelCategory(sectorName, sectorMap) {
  const broadCategories = [
    /* ... same ... */
  ];
  const lower = sectorName.toLowerCase();
  for (const cat of broadCategories) {
    if (cat.keywords.some((kw) => lower.includes(kw))) {
      return cat.name;
    }
  }
  return 'General Development';
}

// ----------------------------------------------------------------------
// Determine circular strategy from theme codes and text – unchanged
// ----------------------------------------------------------------------
function determineCircularStrategy(themeCodes, combinedText) {
  for (const code of themeCodes) {
    if (THEME_TO_CIRCULAR_STRATEGY[code]) {
      return THEME_TO_CIRCULAR_STRATEGY[code];
    }
  }
  const lower = combinedText.toLowerCase();
  if (
    lower.includes('renewable') ||
    lower.includes('solar') ||
    lower.includes('wind') ||
    lower.includes('hydro') ||
    lower.includes('geothermal')
  ) {
    return 'Renewable Energy';
  } else if (
    lower.includes('recycle') ||
    lower.includes('waste') ||
    lower.includes('circular') ||
    lower.includes('reuse')
  ) {
    return 'Circular Economy';
  } else if (
    lower.includes('efficiency') ||
    lower.includes('energy saving') ||
    lower.includes('conservation') ||
    lower.includes('efficient')
  ) {
    return 'Resource Efficiency';
  } else if (
    lower.includes('climate') ||
    lower.includes('resilience') ||
    lower.includes('adaptation') ||
    lower.includes('mitigation')
  ) {
    return 'Climate Resilience';
  } else {
    return 'Sustainable Development';
  }
}

// ----------------------------------------------------------------------
// Build a concise problem statement (now up to 2000 chars)
// ----------------------------------------------------------------------
function buildProblem(project, reportSections) {
  // Priority 1: Development objective from abstract (often the first sentence)
  if (project.abstract) {
    const sentences = project.abstract.split(/\.\s+/);
    // Look for a sentence containing "development objective" or "objective"
    for (const sentence of sentences) {
      if (
        sentence.toLowerCase().includes('development objective') ||
        sentence.toLowerCase().includes('objective of the')
      ) {
        return sentence.trim() + '.';
      }
    }
    // Otherwise return the first sentence
    return sentences[0].trim() + '.';
  }

  // Priority 2: Report objectives section
  if (reportSections.objectives) {
    const lines = reportSections.objectives.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('objective')) {
        return line.trim();
      }
    }
    // Fallback: first 500 chars of objectives
    return reportSections.objectives.substring(0, 500).trim();
  }

  // Ultimate fallback
  return `${project.project_name} in ${project.countryname}`;
}

// ----------------------------------------------------------------------
// Build a comprehensive solution description (now up to 3000 chars)
// ----------------------------------------------------------------------
function buildSolution(project, reportSections) {
  const parts = [];

  // Priority 1: Components section from report – this is the "how"
  if (reportSections.components) {
    // Clean up – remove any stray evaluation phrases
    let componentText = reportSections.components
      .replace(/rating:?\s*\w+/gi, '')
      .replace(/lesson\s*\d+:?.*?(?=\n|$)/gi, '')
      .replace(/outcome:?\s*[^\n]+/gi, '')
      .trim();
    parts.push(componentText);
  }

  // Priority 2: If no components, use the abstract after the first sentence
  if (parts.length === 0 && project.abstract) {
    const sentences = project.abstract.split(/\.\s+/);
    if (sentences.length > 1) {
      parts.push(sentences.slice(1).join('. '));
    } else {
      parts.push(project.abstract);
    }
  }

  // Priority 3: Generate a description from lending instrument and sectors
  if (parts.length === 0) {
    const sectorDesc = project.sectorNames.length
      ? project.sectorNames.join(', ')
      : 'multiple sectors';
    parts.push(
      `Project uses ${project.lendinginstr} to strengthen ${sectorDesc} in ${project.countryname}.`,
    );
  }

  // ⚠️ REMOVE THE SUBSTRING TRUNCATION – we want the full text for chunking
  return parts.join(' ');
}

// ----------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------
async function main() {
  logger.info('🚀 Starting extraction for World Bank projects (final version)...');

  // 1. Load the local JSON files
  const basicData = JSON.parse(await fs.promises.readFile(BASIC_JSON, 'utf8'));
  const detailedData = JSON.parse(await fs.promises.readFile(DETAILED_JSON, 'utf8'));

  // 2. Parse taxonomy PDF for sector mapping (only for top‑level category lookup)
  const sectorMap = await parseTaxonomyPDF(TAXONOMY_PDF);

  // 3. Load and merge projects
  const allProjects = loadProjects(basicData, detailedData);
  logger.info({ count: allProjects.length }, 'Loaded projects');

  // 4. Parse report PDFs
  const reports = [];
  if (fs.existsSync(REPORTS_DIR)) {
    const reportFiles = fs
      .readdirSync(REPORTS_DIR)
      .filter((f) => f.startsWith('report_') && f.endsWith('.pdf'));
    for (const file of reportFiles) {
      const filePath = path.join(REPORTS_DIR, file);
      const parsed = await parseReport(filePath);
      const countryMatch = file.match(/report_([a-z_]+)\.pdf/i);
      const country = countryMatch ? countryMatch[1].replace(/_/g, ' ') : '';
      reports.push({ file, country: country.toLowerCase(), ...parsed });
      logger.info({ file, country }, 'Parsed report');
    }
  } else {
    logger.info('Reports folder not found, skipping report extraction');
  }

  // Build report lookup by country
  const reportByCountry = {};
  for (const r of reports) {
    const key = r.country;
    if (!reportByCountry[key]) reportByCountry[key] = [];
    reportByCountry[key].push(r);
  }

  // 5. Process each project and create CSV rows
  const rows = [];

  for (const proj of allProjects) {
    const countryLower = proj.countryname.toLowerCase().trim();

    // Find matching report
    let matchingReports = [];
    for (const [c, reps] of Object.entries(reportByCountry)) {
      if (countryLower.includes(c) || c.includes(countryLower)) {
        matchingReports = reps;
        break;
      }
    }
    const report = matchingReports.length > 0 ? matchingReports[0] : null;
    const reportSections = report?.sections || {};

    const problem = buildProblem(proj, reportSections);
    const solution = buildSolution(proj, reportSections);

    if (!solution.endsWith('.') && !solution.endsWith('"') && solution.length > 0) {
      logger.warn(
        {
          projectId: proj.id,
          projectName: proj.project_name,
          endingChars: solution.slice(-20)
        },
        'Solution may be truncated'
      );
    }

    const combinedText = (
      proj.abstract +
      ' ' +
      reportSections.components +
      ' ' +
      reportSections.outcome +
      ' ' +
      reportSections.lessons
    ).toLowerCase();
    const materials = extractMaterials(combinedText);

    let category = 'General Development';
    if (proj.sectorNames.length > 0) {
      category = getTopLevelCategory(proj.sectorNames[0], sectorMap);
    } else if (proj.regionname) {
      category = `${proj.regionname} Development`;
    }

    const circular_strategy = determineCircularStrategy(proj.themeCodes, combinedText);

    const funding = proj.totalamt
      ? `$${parseFloat(proj.totalamt).toLocaleString()}`
      : 'Not specified';
    const impactParts = [
      `Funding: ${funding}.`,
      reportSections.outcome ? `Outcome: ${reportSections.outcome.substring(0, 200)}` : '',
      reportSections.rating ? `Overall rating: ${reportSections.rating}` : '',
    ];
    const impact = impactParts.filter(Boolean).join(' ').trim();

    const source_url = proj.url || '';

    const metadata = {
      id: proj.id,
      country: proj.countryname,
      region: proj.regionname,
      lending_instrument: proj.lendinginstr,
      approval_date: proj.boardapprovaldate,
      status: proj.status,
      sector_codes: proj.sectorCodes,
      sector_names: proj.sectorNames,
      theme_codes: proj.themeCodes,
      theme_names: [],
      report_lessons: reportSections.lessons || '',
      report_outcome: reportSections.outcome || '',
      report_objectives: reportSections.objectives || '',
      report_components: reportSections.components || '',
      report_rating: reportSections.rating || '',
    };

    let score = 50;
    // Prioritize projects with clear intervention descriptions
    if (solution.includes('component') || solution.includes('sub-component')) score += 15;
    if (solution.split(' ').length > 50) score += 10; // Longer solutions often better
    if (problem.length > 100) score += 10;
    if (solution.length > 100) score += 10;
    if (materials) score += 10;
    if (circular_strategy !== 'Sustainable Development') score += 20;
    if (report) score += 30;
    if (proj.abstract && proj.abstract.length > 200) score += 10;
    if (proj.sectorCodes.length > 0) score += 10;

    rows.push({
      problem: cleanText(problem).substring(0, 2000), // increased
      solution: cleanText(solution).substring(0, 3000), // increased
      materials: cleanText(materials),
      circular_strategy: cleanText(circular_strategy),
      category: cleanText(category),
      impact: cleanText(impact).substring(0, 1000),
      source_url,
      metadata_json: JSON.stringify(metadata),
      _scoreValue: score,
    });
  }

  rows.sort((a, b) => b._scoreValue - a._scoreValue);
  const topRows = rows.slice(0, MAX_OUTPUT_ROWS);
  logger.info({ count: topRows.length, maxRows: MAX_OUTPUT_ROWS }, 'Selected top rows by quality score');

  const finalRows = topRows.map(({ _scoreValue, ...rest }) => rest);

  const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, finalRows);
  logger.info(
    { written: writeResult.writtenCount, outputPath: OUTPUT_PATH, duplicates: writeResult.duplicateCount },
    'Success! Wrote records to output file'
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    logger.error({ error }, '\n✕ Fatal error');
    process.exit(1);
  });
}
