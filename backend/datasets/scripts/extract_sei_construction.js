
/**
 * extract_sei_construction.js - Circular economy case studies and best practices extraction
 *
 * Extracts from Stockholm Environment Institute (SEI) construction industry reports and guidelines.
 * Processes PDF documents to extract structured case studies, building material innovations, and
 * circular construction strategy implementations.
 *
 * Features:
 *   • PDF text extraction using pdfjs-dist with proper worker configuration
 *   • Multi-document processing with metadata preservation
 *   • Case study identification and section-level parsing
 *   • Construction-specific vocabulary and classification
 *   • Building material and waste stream categorization
 *   • Smart problem/solution generation for construction sector
 *   • Automatic ID generation with dataset key prefix
 *   • Centralized CSV writing with directory creation and file locking
 *   • Page-level content extraction with character buffering
 *
 * Usage:
 *   node extract_sei_construction.js
 *
 * Input: PDF reports and case studies on circular construction
 * Output: CSV file with ID, problem, solution, materials, circular_strategy, category, impact, source_url, metadata_json
 * Scope: Covers circular design, material reuse, waste management in construction sector
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

const require = createRequire(import.meta.url);

// Correctly point to the worker file
const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

const DATASET_KEY = DATASET_KEYS.sei;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const RAW_DIR = getDatasetRawDir(DATASET_KEY);
verifyPathsExist(RAW_DIR);

const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

// ----------------------------------------------------------------------
// Helper: extract and clean text from a PDF using Uint8Array
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

    // Clean boilerplate: remove page numbers, footers, common patterns
    pageText = pageText.replace(/\bPage \d+ of \d+\b/gi, '');
    pageText = pageText.replace(/\b\d+\s*\|/g, '');
    pageText = pageText.replace(/\|\s*\d+/g, '');
    pageText = pageText.replace(/©\s*\d{4}.*?(?=\n|$)/gi, '');
    pageText = pageText.replace(/www\.\S+/gi, '');
    pageText = pageText.replace(/\b(?:WBCSD|World Business Council).{0,30}(?=\n|$)/gi, '');
    pageText = pageText.replace(/\b(?:Confidential|Draft|Preliminary)\b/gi, '');
    pageText = pageText.replace(/\n{3,}/g, '\n\n');
    pageText = pageText.replace(/\s+/g, ' ');

    fullText += pageText + '\n';
  }

  return fullText;
}

// ----------------------------------------------------------------------
// Helper to extract a section between two headings (case‑insensitive, flexible)
// ----------------------------------------------------------------------
function extractSection(text, startHeading, endHeading = null) {
  const startIdx = text.search(new RegExp(startHeading, 'i'));
  if (startIdx === -1) return '';
  const contentStart =
    startIdx + text.slice(startIdx).match(new RegExp(startHeading, 'i'))[0].length;
  let endIdx = text.length;
  if (endHeading) {
    const endMatch = text.slice(contentStart).search(new RegExp(endHeading, 'i'));
    if (endMatch !== -1) endIdx = contentStart + endMatch;
  }
  return text.slice(contentStart, endIdx).trim();
}

// ----------------------------------------------------------------------
// Helper to extract metadata fields from the top block (YEAR, LOCATION, etc.)
// ----------------------------------------------------------------------
function extractMetadata(text) {
  const metadata = {};
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l);
  let inMetadata = true;
  for (const line of lines) {
    if (!inMetadata) break;
    if (line.match(/^SUMMARY|SUSTAINABILITY GOALS|CIRCULAR ECONOMY STRATEGIES/i)) {
      inMetadata = false;
      break;
    }
    const match = line.match(/^([A-Z\s]+)\s+(.+)$/);
    if (match) {
      const key = match[1].trim().toLowerCase().replace(/\s+/g, '_');
      const value = match[2].trim();
      metadata[key] = value;
    }
  }
  return metadata;
}

// ----------------------------------------------------------------------
// Classifier for the SEI case study PDFs (based on filename pattern)
// ----------------------------------------------------------------------
function isSEICaseStudy(fileName) {
  return fileName.includes('SEI-CE-WG-Circular-Economy-Case-Studies');
}

// ----------------------------------------------------------------------
// Extraction for SEI Circular Economy Case Studies
// ----------------------------------------------------------------------
function extractSEICaseStudy(text, fileName) {
  const rows = [];

  // Extract metadata (year, location, use, etc.)
  const metadata = extractMetadata(text);

  // Improved Regex for the 'Findings' section
  const findingsRegex =
    'KEY FINDINGS(?:[\\s,]+(?:RECOMMENDATIONS(?:,\\s*AND)?\\s*LESSONS\\s*LEARNT))?';

  const summary = extractSection(
    text,
    'SUMMARY',
    'SUSTAINABILITY GOALS|CIRCULAR ECONOMY STRATEGIES|KEY FINDINGS|AVAILABLE QUANTITATIVE DATA|FURTHER INFORMATION',
  );

  const goals = extractSection(
    text,
    'SUSTAINABILITY GOALS',
    'CIRCULAR ECONOMY STRATEGIES|KEY FINDINGS|AVAILABLE QUANTITATIVE DATA|FURTHER INFORMATION',
  );

  const strategies = extractSection(
    text,
    'CIRCULAR ECONOMY STRATEGIES',
    'KEY FINDINGS|AVAILABLE QUANTITATIVE DATA|FURTHER INFORMATION',
  );

  const findings = extractSection(
    text,
    findingsRegex, // Used the optimized variable here
    'AVAILABLE QUANTITATIVE DATA|FURTHER INFORMATION',
  );

  const quantitative = extractSection(
    text,
    'AVAILABLE QUANTITATIVE DATA',
    'FURTHER INFORMATION|ABOUT THE DATABASE',
  );

  // Build problem statement: use goals or summary, focusing on challenges
  let problem = '';
  if (goals && goals.length > 20) {
    problem = goals;
  } else if (summary) {
    problem = summary;
  } else {
    problem = 'Need to implement circular economy principles in construction.';
  }

  // Solution: use the strategies section
  let solution =
    strategies ||
    'Apply circular economy strategies such as design for disassembly and material reuse.';

  // Materials: extract from strategies or quantitative data
  let materials = 'mixed';
  const materialKeywords = [
    'wood',
    'steel',
    'concrete',
    'asphalt',
    'brick',
    'glass',
    'plastic',
    'timber',
    'aggregate',
  ];
  const combinedText = (strategies + ' ' + quantitative).toLowerCase();
  const foundMaterials = materialKeywords.filter((m) => combinedText.includes(m));
  if (foundMaterials.length > 0) {
    materials = foundMaterials.join(', ');
  }

  // Circular strategy: from the case, we can detect if it's DfD, reuse, etc.
  let circular_strategy = 'Circular Construction';
  if (strategies.toLowerCase().includes('design for disassembly'))
    circular_strategy = 'Design for Disassembly';
  else if (strategies.toLowerCase().includes('reuse')) circular_strategy = 'Material Reuse';
  else if (strategies.toLowerCase().includes('deconstruction'))
    circular_strategy = 'Deconstruction';

  // Category: use the USE field if available
  let category = metadata.use || 'Construction';

  // Impact: combine quantitative data and key findings
  let impact = '';
  if (quantitative) {
    impact = quantitative;
  } else if (findings) {
    impact = findings;
  } else {
    impact = summary || 'Circular economy implementation in construction.';
  }

  // Build metadata JSON
  const fullMetadata = {
    ...metadata,
    summary: summary.substring(0, 500),
    goals: goals.substring(0, 500),
    strategies: strategies.substring(0, 500),
    findings: findings.substring(0, 500),
    quantitative: quantitative.substring(0, 500),
    fileName,
  };

  rows.push({
    problem: cleanText(problem.substring(0, 1000)),
    solution: cleanText(solution.substring(0, 1000)),
    materials: cleanText(materials),
    circular_strategy: cleanText(circular_strategy),
    category: cleanText(category),
    impact: cleanText(impact.substring(0, 1000)),
    source_url: dataset.source_url,
    metadata_json: JSON.stringify(fullMetadata),
    _scoreValue: 95, // High quality for case studies
  });

  return rows;
}

// ----------------------------------------------------------------------
// Existing classifiers and extractors (unchanged, but included fully)
// ----------------------------------------------------------------------
function isCTICaseStudy(fileName) {
  const lower = fileName.toLowerCase();
  return (
    lower.includes('cti_case') ||
    lower.includes('cti-case') ||
    lower.includes('whirlpool') ||
    lower.includes('dsm') ||
    lower.includes('sika') ||
    lower.includes('auping') ||
    lower.includes('lanxess') ||
    lower.includes('enovik') ||
    lower.includes('allnex') ||
    lower.includes('lipor') ||
    lower.includes('galp') ||
    lower.includes('feralpi') ||
    lower.includes('cirfood') ||
    lower.includes('hovione') ||
    lower.includes('secil') ||
    lower.includes('efacec') ||
    lower.includes('edp') ||
    lower.includes('sovena') ||
    lower.includes('navigator') ||
    lower.includes('roteks') ||
    lower.includes('aptar') ||
    lower.includes('microsoft')
  );
}

function extractCTICase(text, fileName) {
  const rows = [];

  // Extract company – often after "Organization name:"
  let company = '';
  const orgMatch = text.match(/Organization name:\s*(.+?)(?=\n|$)/i);
  if (orgMatch) company = orgMatch[1].trim();

  // Extract industry
  let industry = '';
  const indMatch = text.match(/Industry:\s*(.+?)(?=\n|$)/i);
  if (indMatch) industry = indMatch[1].trim();

  // Sections (they usually appear in order)
  const whySection = extractSection(text, 'Why are circular metrics interesting', 'Key challenges');
  const challengesSection = extractSection(text, 'Key challenges', 'Solutions');
  const solutionsSection = extractSection(text, 'Solutions', 'Results');
  const resultsSection = extractSection(text, 'Results', null);

  // Quote (often between quotes)
  const quoteMatch = text.match(/“([^”]+)”/);
  const quote = quoteMatch ? quoteMatch[1] : '';

  const problem =
    challengesSection || whySection || 'Need to measure and improve circularity performance.';
  const solution = solutionsSection || 'Apply Circular Transition Indicators to track progress.';
  const impact = resultsSection || 'Circular economy implementation.';
  const strategy = 'Circular Transition Indicators';

  const metadata = {
    company,
    industry,
    quote,
    sections: {
      why: whySection,
      challenges: challengesSection,
      solutions: solutionsSection,
      results: resultsSection,
    },
    fileName,
  };

  // Score: if results contain numbers, it's more valuable
  let score = 90;
  if (resultsSection && /\d+/.test(resultsSection)) score += 10;
  if (resultsSection && resultsSection.length > 100) score += 5;

  rows.push({
    problem: cleanText(problem),
    solution: cleanText(solution),
    materials: cleanText(industry || 'General'),
    circular_strategy: cleanText(strategy),
    category: 'CTI Case Study',
    impact: cleanText(impact.substring(0, 500)),
    source_url: dataset.source_url,
    metadata_json: JSON.stringify(metadata),
    _scoreValue: score,
  });

  return rows;
}

function isForestKPI(fileName) {
  return fileName.toLowerCase().includes('fsg-kpi') || fileName.toLowerCase().includes('forest');
}

function extractForestKPI(text, fileName) {
  const rows = [];
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l);

  // Known KPI sections and their corresponding circular strategy
  const sectionMap = {
    'Working Forests': 'Sustainable Forestry',
    Bioeconomy: 'Circular Bioeconomy',
    Circularity: 'Circular Bioeconomy',
    Climate: 'Climate Action',
    Water: 'Water Stewardship',
    People: 'Social Sustainability',
    Communities: 'Social Sustainability',
    Procurement: 'Responsible Sourcing',
  };

  let currentSection = '';
  let currentStrategy = 'Sustainable Forestry'; // default

  for (const line of lines) {
    // Detect section headers (they appear in bold/uppercase in the PDF)
    const sectionMatch = Object.keys(sectionMap).find((s) => line.includes(s) && line.length < 50);
    if (sectionMatch) {
      currentSection = sectionMatch;
      currentStrategy = sectionMap[sectionMatch];
      continue;
    }

    // Look for lines that look like KPIs (contain numbers, %, million, etc.)
    if (
      line.match(/\d+%/) ||
      line.match(/\d+ million/) ||
      line.match(/\d+ hectares/) ||
      line.match(/\d+ trees/)
    ) {
      // Clean up the line to form a concise impact statement
      const impact = line.substring(0, 200).replace(/\s+/g, ' ').trim();
      const problem = `Forest sector needs measurable progress in ${currentSection || 'sustainability'}.`;
      const solution = 'Track KPIs across the value chain.';

      const metadata = {
        section: currentSection,
        metric: line,
        fileName,
      };

      rows.push({
        problem: cleanText(problem),
        solution: cleanText(solution),
        materials: 'Forest Products',
        circular_strategy: cleanText(currentStrategy),
        category: 'Forest Sector KPI',
        impact: cleanText(impact),
        source_url: dataset.source_url,
        metadata_json: JSON.stringify(metadata),
        _scoreValue: 85,
      });
    }
  }

  // If we found no KPIs, fallback to a single generic row (should not happen with this improved logic)
  if (rows.length === 0) {
    rows.push({
      problem: cleanText('Forest sector needs measurable sustainability progress.'),
      solution: cleanText('Track KPIs across working forests, circularity, and climate.'),
      materials: 'Forest Products',
      circular_strategy: 'Sustainable Forestry',
      category: 'Forest Sector KPI Report',
      impact: cleanText('Key performance indicators for forest products companies.'),
      source_url: dataset.source_url,
      metadata_json: JSON.stringify({ fileName, preview: text.slice(0, 500) }),
      _scoreValue: 70,
    });
  }

  return rows;
}

function isBusinessCases(fileName) {
  return fileName.toLowerCase().includes('8-business-cases');
}

function extractBusinessCases(text, fileName) {
  const rows = [];
  // Split by case headings (Gener8, Innov8, Moder8, Captiv8, Differenti8, Integr8, Acclim8, Insul8)
  const caseBlocks = text.split(
    /(?=Gener8:|Innov8:|Moder8:|Captiv8:|Differenti8:|Integr8:|Acclim8:|Insul8:)/,
  );
  for (const block of caseBlocks) {
    if (block.trim().length < 50) continue;
    const caseNameMatch = block.match(
      /^(Gener8|Innov8|Moder8|Captiv8|Differenti8|Integr8|Acclim8|Insul8):/,
    );
    const caseName = caseNameMatch ? caseNameMatch[1] : 'General';
    // Extract company name if present (often in the first sentence)
    const companyMatch = block.match(
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:is|has|developed|offers)/,
    );
    const company = companyMatch ? companyMatch[1] : 'Various';
    const description = block.substring(0, 300).replace(/\n/g, ' ');

    rows.push({
      problem: cleanText('Companies need justification for circular economy investments.'),
      solution: cleanText(`Use the "${caseName}" business case.`),
      materials: 'General',
      circular_strategy: cleanText(caseName),
      category: 'Business Case Framework',
      impact: cleanText(description),
      source_url: dataset.source_url,
      metadata_json: JSON.stringify({
        caseName,
        company,
        block: block.substring(0, 500),
        fileName,
      }),
      _scoreValue: 95, // high quality because it's a concrete case
    });
  }
  return rows;
}

function isTechnicalFramework(fileName) {
  const lower = fileName.toLowerCase();
  return (
    lower.includes('measuring-circular-buildings') ||
    lower.includes('plastics-protocol') ||
    lower.includes('cdx_scoping')
  );
}

function extractTechnicalFramework(text, fileName) {
  // Extract title (first non-empty line that is not a page number)
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.match(/^\d+$/));
  let title = lines[0] || fileName.replace(/\.pdf$/i, '');

  // Look for executive summary or introduction
  const execSummary =
    extractSection(text, 'Executive summary', 'Introduction') ||
    extractSection(text, 'Summary', '1\\.') ||
    text.substring(0, 1000);

  const problem = 'Knowledge gaps exist in circular economy implementation.';
  const solution = `Apply findings from "${title}" – a technical framework.`;
  const impact = execSummary.substring(0, 400);

  const metadata = {
    title,
    fileName,
    type: 'Technical Framework',
    execSummary: execSummary.substring(0, 1000),
  };

  return [
    {
      problem: cleanText(problem),
      solution: cleanText(solution),
      materials: 'General',
      circular_strategy: 'Knowledge Sharing',
      category: 'Technical Framework',
      impact: cleanText(impact),
      source_url: dataset.source_url,
      metadata_json: JSON.stringify(metadata),
      _scoreValue: 75,
    },
  ];
}

function isStrategicGuide(fileName) {
  const lower = fileName.toLowerCase();
  return lower.includes('ceo_guide') || lower.includes('factor10');
}

function extractStrategicGuide(text, fileName) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l);
  const title = lines[0] || fileName.replace(/\.pdf$/i, '');
  const summary = lines.slice(1, 6).join(' ').substring(0, 400);

  return [
    {
      problem: cleanText('Business leaders need a roadmap to circular economy.'),
      solution: cleanText(`Follow the guidance in "${title}".`),
      materials: 'General',
      circular_strategy: 'Circular Leadership',
      category: 'Strategic Guide',
      impact: cleanText(summary),
      source_url: dataset.source_url,
      metadata_json: JSON.stringify({ title, fileName, preview: text.slice(0, 1000) }),
      _scoreValue: 80,
    },
  ];
}

function extractGeneral(text, fileName) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l);
  const title = lines[0] || fileName.replace(/\.pdf$/i, '');
  const summary = lines.slice(1, 5).join(' ').substring(0, 400);

  return [
    {
      problem: cleanText('Knowledge gaps exist in circular economy implementation.'),
      solution: cleanText(`Apply findings from "${title}".`),
      materials: 'General',
      circular_strategy: 'Knowledge Sharing',
      category: 'White Paper',
      impact: cleanText(summary),
      source_url: dataset.source_url,
      metadata_json: JSON.stringify({ title, fileName, preview: text.slice(0, 1000) }),
      _scoreValue: 70,
    },
  ];
}

// ----------------------------------------------------------------------
// Main processing
// ----------------------------------------------------------------------
async function main() {
  logger.info(`🔍 Scanning ${RAW_DIR} for PDF files...`);

  if (!fs.existsSync(RAW_DIR)) {
    logger.error(`✕ Raw directory not found: ${RAW_DIR}`);
    process.exit(1);
  }

  const files = await fs.promises.readdir(RAW_DIR);
  const pdfFiles = files.filter((f) => f.toLowerCase().endsWith('.pdf'));

  if (pdfFiles.length === 0) {
    logger.info('✕ No PDF files found.');
    return;
  }

  let allRows = [];

  for (const file of pdfFiles) {
    const filePath = path.join(RAW_DIR, file);
    logger.info(`📄 Processing ${file}...`);

    try {
      const text = await extractTextFromPDF(filePath);

      // Classify and extract – SEI case studies first
      let rows = [];
      if (isSEICaseStudy(file)) {
        rows = extractSEICaseStudy(text, file);
      } else if (isCTICaseStudy(file)) {
        rows = extractCTICase(text, file);
      } else if (isForestKPI(file)) {
        rows = extractForestKPI(text, file);
      } else if (isBusinessCases(file)) {
        rows = extractBusinessCases(text, file);
      } else if (isTechnicalFramework(file)) {
        rows = extractTechnicalFramework(text, file);
      } else if (isStrategicGuide(file)) {
        rows = extractStrategicGuide(text, file);
      } else {
        rows = extractGeneral(text, file);
      }

      allRows.push(...rows);
      logger.info(`   ✓ Extracted ${rows.length} record(s).`);
    } catch (err) {
      logger.error(`   ✕ Error processing ${file}:`, err.message);
    }
  }

  if (allRows.length === 0) {
    logger.info('✕ No data extracted.');
    return;
  }

  // Score rows (optional)
  const scored = allRows.map((r) => ({
    ...r,
    score: r._scoreValue + (r.impact ? r.impact.length / 100 : 0),
  }));
  scored.sort((a, b) => b.score - a.score);

  logger.info(`\n🎯 Total extracted rows: ${scored.length}`);

  // Remove temporary fields
  const final = scored.map(({ _scoreValue, score, ...rest }) => rest);

  const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, final);
  logger.info(
    `✓ Success! Wrote ${writeResult.writtenCount} records to ${OUTPUT_PATH} (duplicate rows removed: ${writeResult.duplicateCount})`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    logger.error('\n✕ Fatal error:', err.message);
    process.exit(1);
  });
}
