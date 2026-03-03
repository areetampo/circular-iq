/**
 * extract_wbcsd.js
 *
 * Extracts circular economy case studies and business case data from World Business
 * Council for Sustainable Development (WBCSD) reports and guidelines. Processes PDF
 * documents with structured extraction of company initiatives, sustainability commitments,
 * and circular economy strategy implementations.
 *
 * Features:
 *   - PDF text extraction using pdfjs-dist with proper worker configuration
 *   - Multi-document processing with metadata preservation per source
 *   - Business case identification and impact assessment extraction
 *   - Company commitment and circular strategy categorization
 *   - Sustainability metric and ROI calculation extraction
 *   - Smart problem/solution generation from business case narratives
 *   - Automatic ID generation with dataset key prefix
 *   - Centralized CSV writing with directory creation and file locking
 *   - Page-level content extraction with efficient buffering
 *
 * Usage:
 *   node extract_wbcsd.js
 *
 * Input: WBCSD PDF reports with business case studies and sustainability commitments
 * Output: CSV file with ID, problem, solution, materials, circular_strategy, category, impact, source_url, metadata_json
 * Scope: Corporate circular economy strategies, supply chain improvements, business models
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { createRequire } from 'module';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  formatId,
  cleanText,
  DATASET_LOOKUP,
  DATASET_KEYS,
  getDatasetRawDir,
  getDatasetOutputPath,
  writeCsv,
} from '#utils/datasetsUtils.js';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);

// Correctly point to the worker file
const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

const DATASET_KEY = DATASET_KEYS.wbcsd;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const RAW_DIR = getDatasetRawDir(DATASET_KEY);
const OUTPUT_PATH = getDatasetOutputPath(DATASET_KEY);

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
    pageText = pageText.replace(/\b\d+\s*\|/g, ''); // "123 |"
    pageText = pageText.replace(/\|\s*\d+/g, ''); // "| 123"
    pageText = pageText.replace(/©\s*\d{4}.*?(?=\n|$)/gi, ''); // copyright lines
    pageText = pageText.replace(/www\.\S+/gi, ''); // URLs
    pageText = pageText.replace(/\b(?:WBCSD|World Business Council).{0,30}(?=\n|$)/gi, ''); // org name
    pageText = pageText.replace(/\b(?:Confidential|Draft|Preliminary)\b/gi, '');
    pageText = pageText.replace(/\n{3,}/g, '\n\n'); // collapse multiple newlines
    pageText = pageText.replace(/\s+/g, ' '); // normalize spaces

    fullText += pageText + '\n';
  }

  return fullText;
}

// ----------------------------------------------------------------------
// Classification helpers based on filename
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

function isForestKPI(fileName) {
  return fileName.toLowerCase().includes('fsg-kpi') || fileName.toLowerCase().includes('forest');
}

function isBusinessCases(fileName) {
  return fileName.toLowerCase().includes('8-business-cases');
}

function isTechnicalFramework(fileName) {
  const lower = fileName.toLowerCase();
  return (
    lower.includes('measuring-circular-buildings') ||
    lower.includes('plastics-protocol') ||
    lower.includes('cdx_scoping')
  );
}

function isStrategicGuide(fileName) {
  const lower = fileName.toLowerCase();
  return lower.includes('ceo_guide') || lower.includes('factor10');
}

// ----------------------------------------------------------------------
// Extraction for CTI Case Studies (one-page format like Whirlpool)
// ----------------------------------------------------------------------
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
    source_url: dataset.source_url || '',
    metadata_json: JSON.stringify(metadata),
    _scoreValue: score,
  });

  return rows;
}

// ----------------------------------------------------------------------
// Extraction for Forest KPI Results (FSG-KPI-Results_2025.pdf)
// Improved to capture every KPI line by scanning all lines
// ----------------------------------------------------------------------
function extractForestKPI(text, fileName) {
  const rows = [];
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l);

  // Section mapping to circular strategies
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

  let currentSection = 'General';
  let currentStrategy = 'Sustainable Forestry';

  for (const line of lines) {
    // Detect section headers (short lines that are section titles)
    if (line.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/) && line.length < 30) {
      const possibleSection = line.trim();
      if (sectionMap[possibleSection]) {
        currentSection = possibleSection;
        currentStrategy = sectionMap[possibleSection];
        continue;
      }
    }

    // Check for lines containing KPI data (numbers, %, million, etc.)
    const hasNumber = /\d+/.test(line);
    const hasPercent = line.includes('%');
    const hasMillion = line.includes('million') || line.includes('billion');
    const hasHectares = line.includes('hectare');
    const hasTrees = line.includes('trees') || line.includes('seedlings');
    const hasKPIKeyword =
      hasPercent ||
      hasMillion ||
      hasHectares ||
      hasTrees ||
      line.includes('certified') ||
      line.includes('smallholder') ||
      line.includes('conservation') ||
      line.includes('restoration') ||
      line.includes('reused') ||
      line.includes('recycled') ||
      line.includes('GHG') ||
      line.includes('emission') ||
      line.includes('water') ||
      line.includes('COD') ||
      line.includes('employee') ||
      line.includes('training') ||
      line.includes('incident') ||
      line.includes('community') ||
      line.includes('supplier');

    if (hasNumber && hasKPIKeyword) {
      const impact = line.substring(0, 300).replace(/\s+/g, ' ').trim();
      const problem = `Forest sector needs measurable progress in ${currentSection}.`;
      const solution = 'Track KPIs across the value chain.';

      const metadata = {
        section: currentSection,
        metric: line,
        fileName,
      };

      let score = 80;
      if (hasPercent) score += 5;
      if (hasMillion || hasHectares) score += 5;
      if (currentSection === 'Climate' || currentSection === 'Circularity') score += 5;

      rows.push({
        problem: cleanText(problem),
        solution: cleanText(solution),
        materials: 'Forest Products',
        circular_strategy: cleanText(currentStrategy),
        category: 'Forest Sector KPI',
        impact: cleanText(impact),
        source_url: dataset.source_url || '',
        metadata_json: JSON.stringify(metadata),
        _scoreValue: score,
      });
    }
  }

  // If we found no KPIs, fallback to a single generic row
  if (rows.length === 0) {
    rows.push({
      problem: cleanText('Forest sector needs measurable sustainability progress.'),
      solution: cleanText('Track KPIs across working forests, circularity, and climate.'),
      materials: 'Forest Products',
      circular_strategy: 'Sustainable Forestry',
      category: 'Forest Sector KPI Report',
      impact: cleanText('Key performance indicators for forest products companies.'),
      source_url: dataset.source_url || '',
      metadata_json: JSON.stringify({ fileName, preview: text.slice(0, 500) }),
      _scoreValue: 70,
    });
  }

  return rows;
}

// ----------------------------------------------------------------------
// Extraction for 8 Business Cases (multi-case document)
// ----------------------------------------------------------------------
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
      source_url: dataset.source_url || '',
      metadata_json: JSON.stringify({
        caseName,
        company,
        block: block.substring(0, 500),
        fileName,
      }),
      _scoreValue: 95,
    });
  }
  return rows;
}

// ----------------------------------------------------------------------
// Extraction for Technical Frameworks (e.g., Circular Buildings, Plastics Protocol, CDX)
// Now split into sections based on headings (e.g., "1. Introduction", "2. Circular principles")
// ----------------------------------------------------------------------
function extractTechnicalFramework(text, fileName) {
  const rows = [];

  // Try to split by numbered sections (e.g., "1. Introduction", "2. Circular principles")
  const sectionRegex = /(\d+\.\s+[A-Z][^\n]+)/g;
  let match;
  const sections = [];

  while ((match = sectionRegex.exec(text)) !== null) {
    const title = match[1].trim();
    const start = match.index + match[0].length;
    // Find next section or end
    const nextMatch = sectionRegex.exec(text);
    sectionRegex.lastIndex = match.index + match[0].length; // reset to continue
    const end = nextMatch ? nextMatch.index : text.length;
    const content = text.substring(start, end).trim();
    sections.push({ title, content });
  }

  // If no numbered sections found, fallback to paragraph chunks
  if (sections.length === 0) {
    // Split by double newlines into paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 100);
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i].trim();
      const title = `Section ${i + 1}`;
      const problem = 'Knowledge gaps exist in circular economy implementation.';
      const solution = `Apply findings from "${fileName.replace(/\.pdf$/i, '')}" – ${title}.`;
      const impact = para.substring(0, 400);

      const metadata = {
        fileName,
        section: title,
        preview: para.substring(0, 500),
      };

      rows.push({
        problem: cleanText(problem),
        solution: cleanText(solution),
        materials: 'General',
        circular_strategy: 'Knowledge Sharing',
        category: 'Technical Framework',
        impact: cleanText(impact),
        source_url: dataset.source_url || '',
        metadata_json: JSON.stringify(metadata),
        _scoreValue: 70,
      });
    }
  } else {
    // Create a row per section
    for (const sec of sections) {
      const problem = 'Knowledge gaps exist in circular economy implementation.';
      const solution = `Apply findings from "${sec.title}".`;
      const impact = sec.content.substring(0, 400);

      const metadata = {
        fileName,
        section: sec.title,
        content: sec.content.substring(0, 1000),
      };

      rows.push({
        problem: cleanText(problem),
        solution: cleanText(solution),
        materials: 'General',
        circular_strategy: 'Knowledge Sharing',
        category: 'Technical Framework',
        impact: cleanText(impact),
        source_url: dataset.source_url || '',
        metadata_json: JSON.stringify(metadata),
        _scoreValue: 75,
      });
    }
  }

  return rows;
}

// ----------------------------------------------------------------------
// Extraction for Strategic Guides (CEO Guide, Factor10)
// Split into sections if possible, otherwise treat as single
// ----------------------------------------------------------------------
function extractStrategicGuide(text, fileName) {
  const rows = [];

  // Try to split by headings (e.g., "FOREWORD", "WHAT IS THE CIRCULAR ECONOMY?")
  const headingRegex = /^([A-Z][A-Z\s]+)$/gm;
  let match;
  const sections = [];

  while ((match = headingRegex.exec(text)) !== null) {
    const title = match[1].trim();
    const start = match.index + match[0].length;
    // Find next heading or end
    headingRegex.lastIndex = start;
    const nextMatch = headingRegex.exec(text);
    const end = nextMatch ? nextMatch.index : text.length;
    const content = text.substring(start, end).trim();
    sections.push({ title, content });
  }

  if (sections.length === 0) {
    // Fallback: single row
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l);
    const title = lines[0] || fileName.replace(/\.pdf$/i, '');
    const summary = lines.slice(1, 6).join(' ').substring(0, 400);

    rows.push({
      problem: cleanText('Business leaders need a roadmap to circular economy.'),
      solution: cleanText(`Follow the guidance in "${title}".`),
      materials: 'General',
      circular_strategy: 'Circular Leadership',
      category: 'Strategic Guide',
      impact: cleanText(summary),
      source_url: dataset.source_url || '',
      metadata_json: JSON.stringify({ title, fileName, preview: text.slice(0, 1000) }),
      _scoreValue: 80,
    });
  } else {
    for (const sec of sections) {
      const problem = `Business leaders need guidance on ${sec.title}.`;
      const solution = `Follow the advice in this section.`;
      const impact = sec.content.substring(0, 400);

      const metadata = {
        fileName,
        section: sec.title,
        content: sec.content.substring(0, 1000),
      };

      rows.push({
        problem: cleanText(problem),
        solution: cleanText(solution),
        materials: 'General',
        circular_strategy: 'Circular Leadership',
        category: 'Strategic Guide',
        impact: cleanText(impact),
        source_url: dataset.source_url || '',
        metadata_json: JSON.stringify(metadata),
        _scoreValue: 80,
      });
    }
  }

  return rows;
}

// ----------------------------------------------------------------------
// Fallback for any other PDF (treat as white paper, split into paragraphs)
// ----------------------------------------------------------------------
function extractGeneral(text, fileName) {
  const rows = [];

  // Split by double newlines into paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 100);
  for (let i = 0; i < paragraphs.length && i < 20; i++) {
    // limit to 20 to avoid explosion
    const para = paragraphs[i].trim();
    const title = `Paragraph ${i + 1}`;
    const problem = 'Knowledge gaps exist in circular economy implementation.';
    const solution = `Apply findings from "${fileName.replace(/\.pdf$/i, '')}" – ${title}.`;
    const impact = para.substring(0, 400);

    const metadata = {
      fileName,
      section: title,
      preview: para.substring(0, 500),
    };

    rows.push({
      problem: cleanText(problem),
      solution: cleanText(solution),
      materials: 'General',
      circular_strategy: 'Knowledge Sharing',
      category: 'White Paper',
      impact: cleanText(impact),
      source_url: dataset.source_url || '',
      metadata_json: JSON.stringify(metadata),
      _scoreValue: 70,
    });
  }

  // If no paragraphs, fallback to single row
  if (rows.length === 0) {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l);
    const title = lines[0] || fileName.replace(/\.pdf$/i, '');
    const summary = lines.slice(1, 5).join(' ').substring(0, 400);

    rows.push({
      problem: cleanText('Knowledge gaps exist in circular economy implementation.'),
      solution: cleanText(`Apply findings from "${title}".`),
      materials: 'General',
      circular_strategy: 'Knowledge Sharing',
      category: 'White Paper',
      impact: cleanText(summary),
      source_url: dataset.source_url || '',
      metadata_json: JSON.stringify({ title, fileName, preview: text.slice(0, 1000) }),
      _scoreValue: 70,
    });
  }

  return rows;
}

// ----------------------------------------------------------------------
// Helper to extract text between two headings
// ----------------------------------------------------------------------
function extractSection(text, startHeading, endHeading) {
  const startIdx = text.indexOf(startHeading);
  if (startIdx === -1) return '';
  const contentStart = startIdx + startHeading.length;
  let endIdx = endHeading ? text.indexOf(endHeading, contentStart) : text.length;
  if (endIdx === -1) endIdx = text.length;
  return text.substring(contentStart, endIdx).trim();
}

// ----------------------------------------------------------------------
// Main processing
// ----------------------------------------------------------------------
async function main() {
  console.log(`🔍 Scanning ${RAW_DIR} for PDF files...`);

  if (!fs.existsSync(RAW_DIR)) {
    console.error(`❌ Raw directory not found: ${RAW_DIR}`);
    process.exit(1);
  }

  const files = await fs.promises.readdir(RAW_DIR);
  const pdfFiles = files.filter((f) => f.toLowerCase().endsWith('.pdf'));

  if (pdfFiles.length === 0) {
    console.log('❌ No PDF files found.');
    return;
  }

  let allRows = [];

  for (const file of pdfFiles) {
    const filePath = path.join(RAW_DIR, file);
    console.log(`📄 Processing ${file}...`);

    try {
      const text = await extractTextFromPDF(filePath);

      // Classify and extract
      let rows = [];
      if (isCTICaseStudy(file)) {
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
      console.log(`   ✅ Extracted ${rows.length} record(s).`);
    } catch (err) {
      console.error(`   ❌ Error processing ${file}:`, err.message);
    }
  }

  if (allRows.length === 0) {
    console.log('❌ No data extracted.');
    return;
  }

  // Score and keep ALL rows
  const scored = allRows.map((r) => ({
    ...r,
    score: r._scoreValue + (r.impact ? r.impact.length / 100 : 0),
  }));

  // Sort by score descending (optional)
  scored.sort((a, b) => b.score - a.score);

  console.log(`\n🎯 Total extracted rows: ${scored.length}`);

  // Remove temporary fields and add ID
  const final = scored.map(({ _scoreValue, score, ...rest }, idx) => ({
    ID: formatId(`${DATASET_KEY}_`, idx + 1),
    ...rest,
  }));

  await writeCsv(OUTPUT_PATH, final);
  console.log(`✅ Success! Wrote ${final.length} records to ${OUTPUT_PATH}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  });
}
