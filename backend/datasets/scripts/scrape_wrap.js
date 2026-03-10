/* global process */

/**
 * scrape_wrap.js - WRAP Resources and Case Studies (IMPROVED EXTRACTION)
 *
 * Scrapes WRAP resources (case studies, guides, reports) from paginated listing pages.
 * Extracts problem/solution/impact directly from HTML content.
 *
 * Improvements:
 *   • Robust fallback extraction that finds sections by heading text.
 *   • Filters out garbage rows using heuristics.
 *   • Logs skipped rows with reason.
 *
 * Features:
 *   • Three independent scrapes in one file: case studies, guides, reports
 *   • Run all categories by default or use flags for specific ones
 *   • Per-resource extraction using category-specific selectors
 *   • Backup every 3 pages with recovery mode
 *   • Detailed logging to dataset-specific log file
 *
 * Usage:
 *   node scrape_wrap.js                    # all categories
 *   node scrape_wrap.js --case-studies     # only case studies
 *   node scrape_wrap.js --guides           # only guides
 *   node scrape_wrap.js --reports          # only reports
 *   node scrape_wrap.js --use-backup       # rebuild from backup
 *   node scrape_wrap.js --show             # show browser
 *   node scrape_wrap.js --clear-logs       # clear log file
 *   node scrape_wrap.js --append-processed # append to CSV
 *   node scrape_wrap.js --append-backup    # append to backup
 *
 * Output:
 *   • Processed CSV in datasets/processed/
 *   • Downloaded PDFs in datasets/raw/wrap_resources/
 *   • Backup in datasets/archives/scrape_backup/wrap_scrape_backup/
 */

import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import fs from 'fs';
import path from 'path';
import {
  formatId,
  cleanText,
  getBrowserLaunchOptions,
  getViewportOptions,
  getUserAgentOptions,
  getExtraHttpHeaders,
  writeCsv,
  hasAppendProcessedFlag,
  hasAppendBackupFlag,
  createBackupHelper,
  isBackupRecoveryMode,
  readBackupCsv,
  appendLogs,
  clearLogs,
  getDatasetScrapeLogsPath,
  DATASET_LOOKUP,
  ensureDir,
  getDatasetRawDir,
  DATASET_KEYS,
  verifyPathsExist,
  DATASETS_PROCESSED_DIR,
} from '#utils/datasetsUtils.js';

puppeteerExtra.use(StealthPlugin());

// ===== CONFIGURATION =====
const DATASET_KEY = DATASET_KEYS.wrap;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const rawDir = getDatasetRawDir(DATASET_KEY);
verifyPathsExist(rawDir);

const BACKUP_INTERVAL = 3;
const BASE_URL = dataset.source_url;
const REPORTS_DIR = await ensureDir(path.join(rawDir, dataset.raw_folder_contents.reports_folder));
const GUIDES_DIR = await ensureDir(path.join(rawDir, dataset.raw_folder_contents.guides_folder));

// Category definitions
const ALL_CATEGORIES = [
  {
    name: 'case-studies',
    listUrl: dataset.urls.case_studies,
    START_PAGE: 0,
    END_PAGE: 20,
    MAX_PAGES_TO_FETCH: 21,
    outputDir: null,
  },
  {
    name: 'guides',
    listUrl: dataset.urls.guides,
    START_PAGE: 0,
    END_PAGE: 20,
    MAX_PAGES_TO_FETCH: 21,
    outputDir: GUIDES_DIR,
  },
  {
    name: 'reports',
    listUrl: dataset.urls.reports,
    START_PAGE: 0,
    END_PAGE: 28,
    MAX_PAGES_TO_FETCH: 29,
    outputDir: REPORTS_DIR,
  },
];

// Determine which categories to run
const runFlags = {
  caseStudies: process.argv.includes('--case-studies'),
  guides: process.argv.includes('--guides'),
  reports: process.argv.includes('--reports'),
};
const hasAnyFlag = runFlags.caseStudies || runFlags.guides || runFlags.reports;

const ACTIVE_CATEGORIES = hasAnyFlag
  ? ALL_CATEGORIES.filter(
      (cat) =>
        (cat.name === 'case-studies' && runFlags.caseStudies) ||
        (cat.name === 'guides' && runFlags.guides) ||
        (cat.name === 'reports' && runFlags.reports),
    )
  : ALL_CATEGORIES;

const OUTPUT_PATH = path.join(DATASETS_PROCESSED_DIR, dataset.processed_csv_scraped);

const APPEND_PROCESSED = hasAppendProcessedFlag();
const APPEND_BACKUP = hasAppendBackupFlag();

const TOTAL_MAX_PAGES = ACTIVE_CATEGORIES.reduce((sum, cat) => sum + cat.MAX_PAGES_TO_FETCH, 0);
const backup = createBackupHelper(DATASET_KEY, BACKUP_INTERVAL, !APPEND_BACKUP, TOTAL_MAX_PAGES);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------- Garbage detection for case studies ----------
const GARBAGE_PATTERNS = [
  /download case study/i,
  /contents/i,
  />>/,
  /the challenge >>/i,
  /the results >>/i,
  /introduction >>/i,
  /find out more/i,
  /tags/i,
  /initiatives/i,
  /sectors/i,
  /related pages/i,
  /explore more/i,
  /download files/i,
  /^[A-Z][a-z]+ [A-Z][a-z]+(?: [A-Z][a-z]+)*$/, // Single line of proper nouns (company names)
];

function isValidCaseStudy(problem, solution) {
  // Must have meaningful length
  if (!problem || problem.length < 20) return false;
  if (!solution || solution.length < 20) return false;

  // Check for garbage patterns in problem (if it's short and matches a pattern, reject)
  const isGarbageProblem =
    GARBAGE_PATTERNS.some((pattern) => pattern.test(problem)) && problem.length < 100;
  if (isGarbageProblem) return false;

  // Similar for solution (optional, but helps)
  const isGarbageSolution =
    GARBAGE_PATTERNS.some((pattern) => pattern.test(solution)) && solution.length < 100;
  if (isGarbageSolution) return false;

  // Reject if problem contains excessive quotes (multiple quoted sections) – indicates testimonials
  const quoteMatches = (problem.match(/['"](.*?)['"]/g) || []).length;
  if (quoteMatches > 6 && problem.length < 300) return false; // relaxed threshold

  // Reject if problem contains ">>" or "Download" or "CONTENTS" near the beginning
  const first100 = problem.substring(0, 100).toLowerCase();
  if (first100.includes('>>') || first100.includes('download') || first100.includes('contents')) {
    return false;
  }

  // Reject if problem looks like a list of company names (multiple capitalized words followed by quotes)
  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+['"][^'"]+['"]/.test(problem)) return false;

  // Reject if solution contains "DOWNLOAD FILES" or "TAGS" (common in non-case-study pages)
  const solutionLower = solution.toLowerCase();
  if (
    solutionLower.includes('download files') ||
    solutionLower.includes('tags') ||
    solutionLower.includes('initiatives')
  ) {
    return false;
  }

  return true;
}

// ---------- Download helper ----------
async function downloadFile(url, destPath, retries = 5) {
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(destPath));
      console.log(`-- Successfully downloaded: ${destPath}`);
      return;
    } catch (err) {
      clearTimeout(timeout);
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      console.warn(`Download attempt ${i + 1} failed for ${url}: ${err.message}`);
      if (i === retries - 1)
        throw new Error(`Failed to download after ${retries} attempts: ${err.message}`);
      const delay = 2000 * Math.pow(2, i) + Math.random() * 1000;
      await sleep(delay);
    }
  }
}

// ========== EXTRACTION HELPERS ==========

// Primary extraction using specific CSS classes
async function extractCaseStudyWithSelectors(page) {
  let problem = await page
    .$eval('.case-study-summary-problem p', (el) => el.textContent.trim())
    .catch(() => '');
  if (!problem)
    problem = await page
      .$eval('.case-study-summary-problem', (el) => el.textContent.trim())
      .catch(() => '');

  let solution = await page
    .$eval('.case-study-summary-solution p', (el) => el.textContent.trim())
    .catch(() => '');
  if (!solution)
    solution = await page
      .$eval('.case-study-summary-solution', (el) => el.textContent.trim())
      .catch(() => '');

  let impact = '';
  const impactItems = await page
    .$$eval('.case-study-summary-impact li', (items) => items.map((i) => i.textContent.trim()))
    .catch(() => []);
  if (impactItems.length) impact = impactItems.join('; ');
  else
    impact = await page
      .$eval('.case-study-summary-impact', (el) => el.textContent.trim())
      .catch(() => '');

  const sectors = await page
    .$$eval('.tag:last-child .tag--details a', (els) => els.map((a) => a.textContent.trim()))
    .catch(() => []);
  const category = sectors.length ? sectors[0] : 'Cross-sector';

  return { problem, solution, impact, category };
}

// Improved fallback extraction: find headings and collect following content
async function extractCaseStudyFallback(page) {
  const result = { problem: '', solution: '', impact: '' };

  // Define heading texts to look for
  const problemHeadings = ['Problem', 'Challenge', 'The problem', 'The challenge'];
  const solutionHeadings = ['Solution', 'Approach', 'Action', 'The solution', 'Our approach'];
  const impactHeadings = ['Impact', 'Results', 'Outcome', 'The results'];

  // Helper to collect text after a heading until the next heading of similar level
  const collectTextAfterHeading = async (headingElement) => {
    let text = '';
    let current = await headingElement.evaluateHandle((el) => el.nextElementSibling);
    while (current) {
      const tagName = await current.evaluate((el) => el.tagName).catch(() => null);
      // Stop if we hit another heading (h1-h6)
      if (tagName && /^H[1-6]$/.test(tagName)) break;
      const content = await current.evaluate((el) => el.innerText).catch(() => '');
      if (content) text += (text ? ' ' : '') + content.trim();
      current = await current.evaluateHandle((el) => el.nextElementSibling).catch(() => null);
    }
    return text;
  };

  // Find all headings
  const headings = await page.$$('h1, h2, h3, h4, h5, h6');

  for (const heading of headings) {
    const headingText = await heading.evaluate((el) => el.textContent.trim()).catch(() => '');

    // Check if heading matches any problem indicator
    if (
      !result.problem &&
      problemHeadings.some((ph) => headingText.toLowerCase().includes(ph.toLowerCase()))
    ) {
      result.problem = await collectTextAfterHeading(heading);
    }
    // Check if heading matches any solution indicator
    else if (
      !result.solution &&
      solutionHeadings.some((sh) => headingText.toLowerCase().includes(sh.toLowerCase()))
    ) {
      result.solution = await collectTextAfterHeading(heading);
    }
    // Check if heading matches any impact indicator
    else if (
      !result.impact &&
      impactHeadings.some((ih) => headingText.toLowerCase().includes(ih.toLowerCase()))
    ) {
      result.impact = await collectTextAfterHeading(heading);
    }

    // Stop if we have all three
    if (result.problem && result.solution && result.impact) break;
  }

  // Also try to get category from tags
  let category = 'Cross-sector';
  const sectors = await page
    .$$eval('.tag:last-child .tag--details a', (els) => els.map((a) => a.textContent.trim()))
    .catch(() => []);
  if (sectors.length) category = sectors[0];

  return {
    problem: result.problem || '',
    solution: result.solution || '',
    impact: result.impact || '',
    category,
  };
}

// Main extraction function – tries selectors first, then fallback
async function extractCaseStudy(page) {
  // Try primary selectors
  let extracted = await extractCaseStudyWithSelectors(page);
  let problem = extracted.problem;
  let solution = extracted.solution;
  let impact = extracted.impact;
  let category = extracted.category;

  // If primary selectors failed (problem or solution empty), use fallback
  if (!problem || !solution) {
    console.log('      ⚠️ Primary selectors failed, attempting fallback extraction...');
    const fallback = await extractCaseStudyFallback(page);
    if (fallback.problem) problem = fallback.problem;
    if (fallback.solution) solution = fallback.solution;
    if (fallback.impact && !impact) impact = fallback.impact;
    if (fallback.category) category = fallback.category;
  }

  // Clean common prefixes
  const cleanPrefix = (text, prefixes) => {
    if (!text) return text;
    for (const prefix of prefixes) {
      const regex = new RegExp(`^${prefix}[:\\s-]*`, 'i');
      text = text.replace(regex, '');
    }
    return text.trim();
  };
  problem = cleanPrefix(problem, ['Problem', 'Challenge', 'Issue', 'The problem', 'The challenge']);
  solution = cleanPrefix(solution, [
    'Solution',
    'Approach',
    'Action',
    'The solution',
    'Our approach',
  ]);
  impact = cleanPrefix(impact, ['Impact', 'Results', 'Outcome', 'The results']);

  return {
    problem: problem || '',
    solution: solution || '',
    impact: impact || '',
    category: category || 'Cross-sector',
    materials: '',
    circular_strategy: 'Circular economy initiative',
  };
}

async function downloadReportOrGuide(page, url, outputDir) {
  try {
    await page.waitForSelector('section#download-file', { timeout: 5000 });
  } catch {
    return null;
  }

  const pdfLinkElem = await page.$('section#download-file li.download.primary.file.pdf a');
  if (!pdfLinkElem) return null;

  let pdfUrl = await page.evaluate((el) => el.href, pdfLinkElem);
  if (pdfUrl.startsWith('/')) pdfUrl = BASE_URL + pdfUrl;

  const urlParts = pdfUrl.split('/');
  let filename = urlParts[urlParts.length - 1];
  if (!filename || !filename.endsWith('.pdf')) {
    const title = await page.$eval('h1', (el) => el.textContent.trim()).catch(() => 'untitled');
    filename = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.pdf';
  }

  const destPath = path.join(outputDir, filename);
  if (fs.existsSync(destPath)) {
    console.log(`      PDF already exists: ${filename}`);
    return { pdfUrl, localPath: destPath };
  }

  console.log(`   -- Downloading PDF: ${filename}`);
  try {
    await downloadFile(pdfUrl, destPath);
    await appendLogs(
      DATASET_KEY,
      `Downloaded PDF: ${filename} from ${pdfUrl} (category: ${outputDir.includes('reports') ? 'report' : 'guide'}, source page: ${url})`,
    );
    return { pdfUrl, localPath: destPath };
  } catch (err) {
    console.error(`      Failed to download PDF: ${err.message}`);
    return null;
  }
}

async function processResource(browser, url, category) {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Cookie banner
    try {
      const cookieBanner = await page.$('#cookie-consent-banner, .wt-cck--banner');
      if (cookieBanner) {
        const acceptButton = await page.$('a.wt-cck--actions-button:first-child');
        if (acceptButton) {
          await Promise.race([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {}),
            acceptButton.click(),
          ]);
          await sleep(2000);
        }
      }
    } catch {}

    if (category.name === 'case-studies') {
      const row = await extractCaseStudy(page);

      // Validate: must be a meaningful case study
      if (!isValidCaseStudy(row.problem, row.solution)) {
        console.log(`      ⚠️ Skipping case study (invalid content): ${url}`);
        await appendLogs(
          DATASET_KEY,
          `Skipped case study (invalid): ${url} — problem: "${row.problem.substring(0, 50)}..."`,
        );
        return { type: 'row', data: null, skip: true };
      }

      return { type: 'row', data: row };
    } else {
      const result = await downloadReportOrGuide(page, url, category.outputDir);
      await appendLogs(
        DATASET_KEY,
        result
          ? `Successfully processed resource: ${url}`
          : `Failed to process resource (no PDF found): ${url}`,
      );
      return { type: 'pdf', data: result };
    }
  } finally {
    await page.close();
  }
}

// ========== BACKUP RECOVERY ==========

async function rebuildFromBackup() {
  console.log(`♻️ BACKUP RECOVERY MODE: Rebuilding case studies from backup...`);
  await appendLogs(DATASET_KEY, `♻️ RECOVERY MODE: Rebuilding case studies from backup.`);

  const backupRows = await readBackupCsv(DATASET_KEY);
  if (backupRows.length === 0) {
    console.warn('⚠️ No backup content found. Cannot rebuild output.');
    await appendLogs(DATASET_KEY, `⚠️ No backup content found. Cannot rebuild output.`);
    await appendLogs(DATASET_KEY, `\n--- End of recovery run (no data) ---\n`);
    return;
  }

  console.log(`📖 Processing ${backupRows.length} backup rows...`);
  await appendLogs(DATASET_KEY, `Read ${backupRows.length} backup rows from case studies.`);

  // Apply same validation during recovery
  const validRows = backupRows.filter((row) =>
    isValidCaseStudy(row.problem || '', row.solution || ''),
  );
  const skippedCount = backupRows.length - validRows.length;

  if (skippedCount > 0) {
    console.log(`   Filtered out ${skippedCount} invalid rows during recovery.`);
    await appendLogs(DATASET_KEY, `Filtered out ${skippedCount} invalid rows during recovery.`);
  }

  const finalRows = validRows.map((row, idx) => ({
    ID: formatId(DATASET_KEY, idx + 1),
    problem: cleanText(row.problem || ''),
    solution: cleanText(row.solution || ''),
    materials: cleanText(row.materials || ''),
    circular_strategy: cleanText(row.circular_strategy || ''),
    category: cleanText(row.category || ''),
    impact: cleanText(row.impact || ''),
    source_url: row.source_url || '',
    metadata_json: row.metadata_json || '{}',
  }));

  await writeCsv(OUTPUT_PATH, finalRows, APPEND_PROCESSED);
  console.log(`\n✨ Successfully rebuilt ${finalRows.length} case study rows from backup`);
  console.log(`📁 Saved to: ${OUTPUT_PATH}`);
  await appendLogs(
    DATASET_KEY,
    `✅ Case studies recovered. Wrote ${finalRows.length} rows to ${OUTPUT_PATH}`,
  );

  console.log(`\n📝 NOTE: For PDF extraction from guides and reports, run: node extract_wrap.js`);
  await appendLogs(
    DATASET_KEY,
    `📝 For PDF extraction from guides/reports, run: node extract_wrap.js`,
  );
  await appendLogs(DATASET_KEY, `\n--- End of recovery run ---\n`);
}

// ========== CATEGORY SCRAPING ==========

async function scrapeCategory(browser, category) {
  const { name, listUrl, START_PAGE, END_PAGE, MAX_PAGES_TO_FETCH, outputDir } = category;
  const FINAL_FETCH_PAGE = Math.min(END_PAGE, START_PAGE + MAX_PAGES_TO_FETCH - 1);
  console.log(`\n=== Scraping category: ${name}, PAGES: ${START_PAGE}-${FINAL_FETCH_PAGE} ===`);
  await appendLogs(
    DATASET_KEY,
    `Starting category: ${name}, PAGES: ${START_PAGE}-${FINAL_FETCH_PAGE}`,
  );

  const allRows = [];
  let pdfCount = 0;

  for (let pageNum = START_PAGE; pageNum <= FINAL_FETCH_PAGE; pageNum++) {
    const pageUrl = listUrl + pageNum;
    console.log(`  Page ${pageNum}/${FINAL_FETCH_PAGE}: ${pageUrl}`);
    await appendLogs(DATASET_KEY, `Page ${pageNum}: ${pageUrl}`);

    let retries = 3;
    let success = false;
    let links = [];

    while (retries > 0 && !success) {
      const listPage = await browser.newPage();
      try {
        await listPage.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await listPage.waitForSelector('h2.field-content a', { timeout: 10000 }).catch(() => null);
        links = await listPage.$$eval('h2.field-content a', (anchors) =>
          anchors.map((a) => a.href),
        );
        if (links.length === 0) {
          console.log('    No more resources found. Stopping pagination.');
          await appendLogs(DATASET_KEY, `  No resources found on page ${pageNum}.`);
          break;
        }
        console.log(`    Found ${links.length} resources.`);
        success = true;
      } catch (err) {
        retries--;
        console.warn(`  ⚠️ Page ${pageNum} error (retries left: ${retries}): ${err.message}`);
        await appendLogs(DATASET_KEY, `Page ${pageNum} error: ${err.message}`);
        if (retries === 0) {
          console.warn(`  ⚠️ Skipping page ${pageNum} after 3 failed attempts.`);
          await appendLogs(DATASET_KEY, `Skipping page ${pageNum} after 3 failed attempts.`);
        } else {
          await sleep(5000 * (3 - retries));
        }
      } finally {
        await listPage.close();
      }
    }

    if (links.length === 0) break;

    const pageRows = [];

    for (const link of links) {
      console.log(`    Fetching: ${link}`);
      let resourceRetries = 2;
      let resourceSuccess = false;

      while (resourceRetries > 0 && !resourceSuccess) {
        try {
          const result = await processResource(browser, link, category);
          if (result.type === 'row') {
            if (result.skip) {
              resourceSuccess = true;
              continue;
            }
            const fullRow = {
              problem: result.data.problem,
              solution: result.data.solution,
              materials: result.data.materials,
              circular_strategy: result.data.circular_strategy,
              category: result.data.category,
              impact: result.data.impact,
              source_url: link,
              metadata_json: JSON.stringify({
                category: name,
                scraped_at: new Date().toISOString(),
              }),
            };
            pageRows.push(fullRow);
            allRows.push(fullRow);
          } else {
            if (result.data) pdfCount++;
          }
          resourceSuccess = true;
        } catch (err) {
          resourceRetries--;
          console.warn(
            `      ⚠️ Resource error (retries left: ${resourceRetries}): ${err.message}`,
          );
          await appendLogs(DATASET_KEY, `Resource error ${link}: ${err.message}`);
          if (resourceRetries === 0) {
            console.warn(`      ⚠️ Skipping resource after 2 failed attempts.`);
            await appendLogs(DATASET_KEY, `Skipping resource ${link} after 2 failed attempts.`);
          } else {
            await sleep(3000);
          }
        }
      }
      await sleep(1000 + Math.floor(Math.random() * 1000));
    }

    if (name === 'case-studies' && pageRows.length > 0) {
      try {
        await backup.add(pageRows);
        await appendLogs(
          DATASET_KEY,
          `Page ${pageNum}: backed up ${pageRows.length} case study rows.`,
        );
      } catch (e) {
        console.warn(`  ⚠️ Backup add failed: ${e.message}`);
        await appendLogs(DATASET_KEY, `  ⚠️ Backup add failed: ${e.message}`);
      }
    } else if (name !== 'case-studies') {
      await appendLogs(DATASET_KEY, `Page ${pageNum}: downloaded ${pdfCount} PDFs to ${outputDir}`);
    }

    await sleep(2000 + Math.floor(Math.random() * 3000));
  }

  if (name === 'case-studies') {
    console.log(`  → Collected ${allRows.length} rows from ${name}`);
  } else {
    console.log(`  → Downloaded ${pdfCount} PDFs to ${outputDir}`);
  }
  return { rows: allRows, pdfCount };
}

// ========== MAIN ==========

async function scrape_wrap() {
  await clearLogs(DATASET_KEY);

  if (isBackupRecoveryMode()) {
    await rebuildFromBackup();
    return;
  }

  const logFilePath = getDatasetScrapeLogsPath(DATASET_KEY);
  console.log(`Scraping WRAP resources. Detailed logs: ${logFilePath}`);
  await appendLogs(
    DATASET_KEY,
    `🚀 Scrape started. Categories: ${ACTIVE_CATEGORIES.map((c) => c.name).join(', ')}`,
  );

  let browser;
  try {
    browser = await puppeteerExtra.launch(getBrowserLaunchOptions());
    const page = await browser.newPage();
    await page.setViewport(getViewportOptions());
    await page.setUserAgent(getUserAgentOptions());
    await page.setExtraHTTPHeaders(getExtraHttpHeaders());

    let allRows = [];
    let totalPdfs = 0;

    for (const category of ACTIVE_CATEGORIES) {
      const { rows, pdfCount } = await scrapeCategory(browser, category);
      allRows = allRows.concat(rows);
      totalPdfs += pdfCount || 0;
    }

    await backup.flush();

    if (allRows.length > 0) {
      // Apply final validation (redundant but safe)
      const validRows = allRows.filter((row) => isValidCaseStudy(row.problem, row.solution));
      const skipped = allRows.length - validRows.length;
      if (skipped > 0) {
        console.log(`\n⚠️ Filtered out ${skipped} invalid rows during final assembly.`);
        await appendLogs(
          DATASET_KEY,
          `Filtered out ${skipped} invalid rows during final assembly.`,
        );
      }

      const finalRows = validRows.map((row, idx) => ({
        ID: formatId(DATASET_KEY, idx + 1),
        problem: cleanText(row.problem),
        solution: cleanText(row.solution),
        materials: cleanText(row.materials),
        circular_strategy: cleanText(row.circular_strategy),
        category: cleanText(row.category),
        impact: cleanText(row.impact),
        source_url: row.source_url,
        metadata_json: row.metadata_json,
      }));

      await writeCsv(OUTPUT_PATH, finalRows, APPEND_PROCESSED);
      console.log(`\n✅ Scraped ${finalRows.length} valid case study rows.`);
      console.log(`📁 Saved to: ${OUTPUT_PATH}`);

      if (finalRows.length > 0) {
        await appendLogs(
          DATASET_KEY,
          `   First: ${finalRows[0].ID} | ${finalRows[0].problem.substring(0, 50)}...`,
        );
        await appendLogs(
          DATASET_KEY,
          `   Last:  ${finalRows[finalRows.length - 1].ID} | ${finalRows[finalRows.length - 1].problem.substring(0, 50)}...`,
        );
      }
    } else {
      console.log(`\nℹ️ No case study rows scraped.`);
    }

    if (totalPdfs > 0) {
      console.log(`✅ Downloaded ${totalPdfs} PDFs into:`);
      console.log(`   - Reports: ${REPORTS_DIR}`);
      console.log(`   - Guides: ${GUIDES_DIR}`);
    }

    await appendLogs(
      DATASET_KEY,
      `✅ Scrape complete. Valid rows: ${allRows.filter((r) => isValidCaseStudy(r.problem, r.solution)).length}, PDFs: ${totalPdfs}`,
    );
  } catch (err) {
    console.error('❌ Fatal error:', err);
    await appendLogs(DATASET_KEY, `❌ Fatal error: ${err.message}`);
    throw err;
  } finally {
    if (browser) await browser.close();
    console.log('✅ Browser closed.');
  }
}

async function main() {
  if (isBackupRecoveryMode()) {
    await rebuildFromBackup();
  } else {
    await scrape_wrap();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .then(async () => {
      await appendLogs(DATASET_KEY, '✅ Run completed successfully.');
    })
    .catch(async (err) => {
      console.error('❌ Fatal error:', err.message);
      await appendLogs(DATASET_KEY, `❌ Fatal error: ${err.message}`);
      process.exit(1);
    });
}
