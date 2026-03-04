import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import fetch from 'node-fetch';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  formatId,
  cleanText,
  DATASET_LOOKUP,
  DATASET_KEYS,
  getDatasetRawDir,
  getDatasetProcessedCsvPath,
  writeCsv,
  writeJson,
} from '#utils/datasetsUtils.js';

const require = createRequire(import.meta.url);

// Configure pdfjs worker
const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

// Dataset configuration
const DATASET_KEY = DATASET_KEYS.wbp;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const RAW_DIR = getDatasetRawDir(DATASET_KEY);
const REPORTS_DIR = path.join(RAW_DIR, 'reports');
const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

// File paths for fetched JSON
const BASIC_JSON = path.join(RAW_DIR, dataset.raw_folder_contents.basic_json);
const DETAILED_JSON = path.join(RAW_DIR, dataset.raw_folder_contents.detailed_json);
const TAXONOMY_PDF = path.join(RAW_DIR, dataset.raw_folder_contents.taxonomy_pdf);

// API endpoints
const BASIC_URL = dataset.urls.basic;
const DETAILED_URL = dataset.urls.detailed;

// Maximum number of output rows (adjustable)
const MAX_OUTPUT_ROWS = 400;

// ----------------------------------------------------------------------
// Helper: fetch JSON and save to file
// ----------------------------------------------------------------------
async function fetchAndSave(url, filePath, description) {
  console.log(`📡 Fetching ${description}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${description}: ${response.statusText}`);
  }
  const data = await response.json();

  // write JSON using centralized helper (handles prepareWrite + lock)
  await writeJson(filePath, data);
  console.log(`💾 Saved to ${filePath}`);
  return data;
}

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
// Improved parseTaxonomyPDF – handles multi‑column table
// ----------------------------------------------------------------------
async function parseTaxonomyPDF(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn('⚠️️️  Taxonomy PDF not found, sector mapping will be empty.');
    return new Map();
  }

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
    console.warn('⚠️️️  Could not find the sector table in PDF, using fallback mapping.');
    return getFallbackSectorMap();
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
    console.warn('⚠️️️  PDF parsing returned 0 codes, using fallback mapping.');
    return getFallbackSectorMap();
  }

  console.log(`📚 Sector taxonomy loaded from PDF: ${sectorMap.size} codes.`);
  return sectorMap;
}

// ----------------------------------------------------------------------
// Fallback mapping based on the PDF (common sector codes)
// ----------------------------------------------------------------------
function getFallbackSectorMap() {
  const map = new Map();
  const pairs = [
    ['AX', 'AGRICULTURE, FISHING AND FORESTRY'],
    ['AH', 'Crops'],
    ['AL', 'Livestock'],
    ['AI', 'Irrigation and Drainage'],
    ['AB', 'Agricultural Extension, Research, and Other Support Activities'],
    ['AT', 'Forestry'],
    ['AF', 'Fisheries'],
    ['AK', 'Public Administration – Agriculture, Fishing & Forestry'],
    ['AZ', 'Other Agriculture, Fishing and Forestry'],
    ['EX', 'EDUCATION'],
    ['EC', 'Early Childhood Education'],
    ['EP', 'Primary Education'],
    ['ES', 'Secondary Education'],
    ['ET', 'Tertiary Education'],
    ['EW', 'Workforce Development and Vocational Education'],
    ['EL', 'Adult Basic and Continuing Education'],
    ['EF', 'Public Administration – Education'],
    ['EZ', 'Other Education'],
    ['LX', 'ENERGY AND EXTRACTIVES'],
    ['LM', 'Mining'],
    ['LC', 'Oil and Gas'],
    ['LH', 'Renewable Energy Hydro'],
    ['LU', 'Renewable Energy Solar'],
    ['LW', 'Renewable Energy Wind'],
    ['LB', 'Renewable Energy Biomass'],
    ['LI', 'Renewable Energy Geothermal'],
    ['LN', 'Non-Renewable Energy Generation'],
    ['LT', 'Energy Transmission and Distribution'],
    ['LP', 'Public Administration – Energy and Extractives'],
    ['LZ', 'Other Energy and Extractives'],
    ['FX', 'FINANCIAL SECTOR'],
    ['FA', 'Banking Institutions'],
    ['FD', 'Insurance and Pension'],
    ['FK', 'Capital Markets'],
    ['FP', 'Public Administration – Financial Sector'],
    ['FL', 'Other Non-bank Financial Institutions'],
    ['HX', 'HEALTH'],
    ['HG', 'Health'],
    ['HQ', 'Health Facilities and Construction'],
    ['HF', 'Public Administration - Health'],
    ['SX', 'SOCIAL PROTECTION'],
    ['SA', 'Social Protection'],
    ['SG', 'Public Administration – Social Protection'],
    ['YX', 'INDUSTRY, TRADE AND SERVICES'],
    ['YA', 'Agricultural markets, commercialization and agri-business'],
    ['YH', 'Housing Construction'],
    ['YY', 'Trade'],
    ['YS', 'Services'],
    ['YM', 'Manufacturing'],
    ['YT', 'Tourism'],
    ['YF', 'Public Administration - Industry, Trade and Services'],
    ['YZ', 'Other Industry, Trade and Services'],
    ['CX', 'INFORMATION AND COMMUNICATIONS TECHNOLOGIES'],
    ['CI', 'ICT Infrastructure'],
    ['CS', 'ICT Services'],
    ['CF', 'Public Administration - Information and Communications Technologies'],
    ['CZ', 'Other Information and Communications Technologies'],
    ['BX', 'PUBLIC ADMINISTRATION'],
    ['BC', 'Central Government (Central Agencies)'],
    ['BH', 'Sub National Government'],
    ['BG', 'Law and Justice'],
    ['BZ', 'Other Public Administration'],
    ['WX', 'WATER, SANITATION AND WASTE MANAGEMENT'],
    ['WA', 'Sanitation'],
    ['WB', 'Waste Management'],
    ['WC', 'Water Supply'],
    ['WF', 'Public Administration - Water, Sanitation and Waste Management'],
    ['WZ', 'Other Water Supply, Sanitation and Waste Management'],
    ['TX', 'TRANSPORTATION'],
    ['TI', 'Rural and Inter-Urban Roads'],
    ['TW', 'Railways'],
    ['TV', 'Aviation'],
    ['TP', 'Ports/Waterways'],
    ['TC', 'Urban Transport'],
    ['TF', 'Public Administration - Transportation'],
    ['TZ', 'Other Transportation'],
  ];
  for (const [code, name] of pairs) {
    map.set(code, name);
  }
  console.log(`📚 Using fallback sector mapping: ${map.size} codes.`);
  return map;
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
// Load and merge projects from basic + detailed JSON
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
      sectorNames: [],
      sectorCodes: [],
      themeCodes: [],
    };

    if (detailed.sector && Array.isArray(detailed.sector)) {
      for (const s of detailed.sector) {
        if (s.code) project.sectorCodes.push(s.code);
        if (s.Name) project.sectorNames.push(s.Name);
      }
    }
    if (project.sectorNames.length === 0 && basic.sector1?.Name) {
      project.sectorNames.push(basic.sector1.Name);
    }

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
// Main
// ----------------------------------------------------------------------
async function main() {
  console.log('🚀 Starting fetch and extract for World Bank projects...');

  // Ensure raw directory exists
  await fs.promises.mkdir(RAW_DIR, { recursive: true });

  // 1. Fetch project JSONs
  try {
    await fetchAndSave(BASIC_URL, BASIC_JSON, 'basic projects');
    await fetchAndSave(DETAILED_URL, DETAILED_JSON, 'detailed projects');
  } catch (err) {
    console.error('❌ Failed to fetch data from World Bank API:', err);
    process.exit(1);
  }

  // 2. Load the fetched JSON files
  const basicData = JSON.parse(await fs.promises.readFile(BASIC_JSON, 'utf8'));
  const detailedData = JSON.parse(await fs.promises.readFile(DETAILED_JSON, 'utf8'));

  // 3. Parse taxonomy PDF for sector mapping (with fallback)
  const sectorMap = await parseTaxonomyPDF(TAXONOMY_PDF);

  // 4. Load and merge projects
  const allProjects = loadProjects(basicData, detailedData);
  console.log(`📦 Loaded ${allProjects.length} projects.`);

  // 5. Parse report PDFs (if reports folder exists)
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
      console.log(`📄 Parsed report: ${file} (country: ${country})`);
    }
  } else {
    console.log('⚠️️️  Reports folder not found, skipping report extraction.');
  }

  // Build report lookup by country (simple substring match)
  const reportByCountry = {};
  for (const r of reports) {
    const key = r.country;
    if (!reportByCountry[key]) reportByCountry[key] = [];
    reportByCountry[key].push(r);
  }

  // 6. Process each project and create CSV rows
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
    const lessons = report?.sections.lessons || '';
    const outcome = report?.sections.outcome || '';
    const objectives = report?.sections.objectives || '';

    // Problem
    let problem = proj.abstract
      ? proj.abstract.substring(0, 500)
      : objectives || lessons || `Development needs in ${proj.regionname || 'the region'}.`;

    // Solution
    const solution = `${proj.project_name} (${proj.lendinginstr || 'Lending Instrument'})`;

    // Materials: use sector names from mapping
    const sectorNameList = [];
    for (const code of proj.sectorCodes) {
      const name = sectorMap.get(code);
      if (name) sectorNameList.push(name);
    }
    sectorNameList.push(...proj.sectorNames);
    const materials = [...new Set(sectorNameList)].join('; ') || 'General';

    // Category: first sector name
    let category = materials.split(';')[0] || 'General Development';

    // Circular strategy: heuristic
    let circular_strategy = 'Sustainable Development';
    const combinedText = (
      proj.project_name +
      ' ' +
      proj.abstract +
      ' ' +
      lessons +
      ' ' +
      outcome
    ).toLowerCase();
    if (
      combinedText.includes('renewable') ||
      combinedText.includes('solar') ||
      combinedText.includes('wind') ||
      combinedText.includes('hydro')
    ) {
      circular_strategy = 'Renewable Energy';
    } else if (
      combinedText.includes('recycle') ||
      combinedText.includes('waste') ||
      combinedText.includes('circular')
    ) {
      circular_strategy = 'Circular Economy';
    } else if (combinedText.includes('efficiency') || combinedText.includes('energy saving')) {
      circular_strategy = 'Resource Efficiency';
    } else if (
      combinedText.includes('climate') ||
      combinedText.includes('resilience') ||
      combinedText.includes('adaptation')
    ) {
      circular_strategy = 'Climate Resilience';
    }

    // Impact
    const funding = proj.totalamt
      ? `$${parseFloat(proj.totalamt).toLocaleString()}`
      : 'Not specified';
    const impact = [
      proj.abstract ? proj.abstract.substring(0, 300) : '',
      `Funding: ${funding}.`,
      outcome ? `Outcome: ${outcome.substring(0, 200)}` : '',
      lessons ? `Lessons: ${lessons.substring(0, 200)}` : '',
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    const source_url = proj.url || '';

    // Metadata
    const metadata = {
      id: proj.id,
      country: proj.countryname,
      region: proj.regionname,
      lending_instrument: proj.lendinginstr,
      approval_date: proj.boardapprovaldate,
      status: proj.status,
      sector_codes: proj.sectorCodes,
      sector_names: sectorNameList,
      theme_codes: proj.themeCodes,
      theme_names: [],
      report_lessons: lessons,
      report_outcome: outcome,
      report_objectives: objectives,
      report_rating: report?.sections.rating || '',
    };

    // Score
    let score = 70;
    if (proj.abstract) score += 10;
    if (report) score += 20;
    if (outcome) score += 5;
    if (lessons) score += 5;

    rows.push({
      ID: proj.id,
      problem: cleanText(problem),
      solution: cleanText(solution),
      materials: cleanText(materials),
      circular_strategy: cleanText(circular_strategy),
      category: cleanText(category),
      impact: cleanText(impact),
      source_url,
      metadata_json: JSON.stringify(metadata),
      _scoreValue: score,
    });
  }

  // 7. Sort by score and select top MAX_OUTPUT_ROWS
  rows.sort((a, b) => b._scoreValue - a._scoreValue);
  const topRows = rows.slice(0, MAX_OUTPUT_ROWS);
  console.log(`🎯 Selected top ${topRows.length} rows (max ${MAX_OUTPUT_ROWS}) by quality score.`);

  // 8. Remove temporary _scoreValue and assign final IDs
  const finalRows = topRows.map(({ _scoreValue, ...rest }, idx) => ({
    ID: formatId(DATASET_KEY, idx + 1),
    ...rest,
  }));

  // 9. Write CSV
  await writeCsv(OUTPUT_PATH, finalRows);
  console.log(`✅ Success! Wrote ${finalRows.length} records to ${OUTPUT_PATH}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  });
}
