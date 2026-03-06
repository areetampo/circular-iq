/* global process */

/**
 * scrape_wrap.js - WRAP Resources and Case Studies
 *
 * Scrapes WRAP resources (case studies, guides, reports) from paginated listing pages.
 * Extracts problem/solution/impact directly from HTML content.
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
import { finished } from 'stream/promises';
import fs from 'fs';
import path from 'path';
import {
  formatId,
  cleanText,
  getDatasetProcessedCsvPath,
  getBrowserLaunchOptions,
  getViewportOptions,
  getUserAgentOptions,
  getExtraHttpHeaders,
  writeCsv,
  hasAppendFlag,
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
} from '#utils/datasetsUtils.js';

puppeteerExtra.use(StealthPlugin());

// ===== CONFIGURATION =====
const DATASET_KEY = DATASET_KEYS.wrap;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const rawDir = getDatasetRawDir(DATASET_KEY);
const BACKUP_INTERVAL = 3;
const CLEAR_BACKUP_ON_START = true;
const BASE_URL = dataset.source_url;
const REPORTS_DIR = await ensureDir(path.join(rawDir, dataset.raw_folder_contents.reports_folder));
const GUIDES_DIR = await ensureDir(path.join(rawDir, dataset.raw_folder_contents.guides_folder));

// Category definitions: each has its own START_PAGE, END_PAGE and MAX_PAGES_TO_FETCH
const ALL_CATEGORIES = [
  {
    name: 'case-studies',
    listUrl: `${dataset.urls.case_studies}` + '&page=',
    // 20 pages total (0..19)
    START_PAGE: 0,
    END_PAGE: 19,
    MAX_PAGES_TO_FETCH: 20,
    outputDir: null, // no PDFs for case studies
  },
  {
    name: 'guides',
    listUrl: `${dataset.urls.guides}` + '&page=',
    // 21 pages total (0..20)
    START_PAGE: 0,
    END_PAGE: 20,
    MAX_PAGES_TO_FETCH: 1,
    outputDir: GUIDES_DIR,
  },
  {
    name: 'reports',
    listUrl: `${dataset.urls.reports}` + '&page=',
    // 29 pages total (0..28)
    START_PAGE: 0,
    END_PAGE: 28,
    MAX_PAGES_TO_FETCH: 29,
    outputDir: REPORTS_DIR,
  },
];

// Determine which categories to run based on command‑line flags
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

const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

const APPEND_PROCESSED = hasAppendProcessedFlag();
const APPEND_BACKUP = hasAppendBackupFlag();

const TOTAL_MAX_PAGES = ACTIVE_CATEGORIES.reduce((sum, cat) => sum + cat.MAX_PAGES_TO_FETCH, 0);
const backup = createBackupHelper(
  DATASET_KEY,
  BACKUP_INTERVAL,
  CLEAR_BACKUP_ON_START && !APPEND_BACKUP,
  TOTAL_MAX_PAGES,
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------- Download helper ----------
async function downloadFile(url, destPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  const body = Readable.fromWeb(response.body);
  const dest = fs.createWriteStream(destPath);
  await finished(body.pipe(dest));
}

// ========== EXTRACTION HELPERS ==========

// ---------- Case study extraction ----------
async function extractCaseStudy(page) {
  await page.waitForSelector('.case-study-summary-wrapper', { timeout: 10000 }).catch(() => {});

  let problem = await page
    .$eval('.case-study-summary-problem p', (el) => el.textContent.trim())
    .catch(() => '');
  if (!problem) {
    problem = await page
      .$eval('.case-study-summary-problem', (el) => el.textContent.trim())
      .catch(() => '');
  }

  let solution = await page
    .$eval('.case-study-summary-solution p', (el) => el.textContent.trim())
    .catch(() => '');
  if (!solution) {
    solution = await page
      .$eval('.case-study-summary-solution', (el) => el.textContent.trim())
      .catch(() => '');
  }

  let impact = '';
  const impactItems = await page
    .$$eval('.case-study-summary-impact li', (items) => items.map((i) => i.textContent.trim()))
    .catch(() => []);
  if (impactItems.length) {
    impact = impactItems.join('; ');
  } else {
    impact = await page
      .$eval('.case-study-summary-impact', (el) => el.textContent.trim())
      .catch(() => '');
  }

  const sectors = await page
    .$$eval('.tag:last-child .tag--details a', (els) => els.map((a) => a.textContent.trim()))
    .catch(() => []);
  const category = sectors.length ? sectors[0] : 'Cross-sector';

  return {
    problem: problem || '',
    solution: solution || '',
    impact: impact || '',
    category,
    materials: '',
    circular_strategy: 'Circular economy initiative',
  };
}

// ---------- Report/Guide: download PDF ----------
async function downloadReportOrGuide(page, url, outputDir) {
  // Wait for the download section to appear (in case it's lazy-loaded)
  try {
    await page.waitForSelector('section#download-file', { timeout: 5000 });
  } catch (e) {
    console.log(`      No download section found for ${url}`);
    return null;
  }

  // Find PDF download link inside that section
  const pdfLinkElem = await page.$('section#download-file li.download.primary.file.pdf a');
  if (!pdfLinkElem) {
    console.log(`      No PDF link found for ${url}`);
    return null;
  }

  let pdfUrl = await page.evaluate((el) => el.href, pdfLinkElem);
  if (pdfUrl.startsWith('/')) pdfUrl = BASE_URL + pdfUrl;

  // Generate filename
  const urlParts = pdfUrl.split('/');
  let filename = urlParts[urlParts.length - 1];
  if (!filename || !filename.endsWith('.pdf')) {
    // Fallback: use page title
    const title = await page.$eval('h1', (el) => el.textContent.trim()).catch(() => 'untitled');
    filename = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.pdf';
  }

  const destPath = path.join(outputDir, filename);
  let success = false;
  if (fs.existsSync(destPath)) {
    console.log(`      PDF already exists: ${filename}`);
    success = true;
  } else {
    console.log(`      Downloading PDF: ${filename}`);
    try {
      await downloadFile(pdfUrl, destPath);
      success = true;
    } catch (err) {
      console.error(`      Failed to download PDF: ${err.message}`);
      return null;
    }
  }

  if (success) {
    appendLogs(
      DATASET_KEY,
      `Downloaded PDF: ${filename} from ${pdfUrl} (category: ${
        outputDir.includes('reports') ? 'report' : 'guide'
      }, source page: ${url})`,
    );
  }
  return { pdfUrl, localPath: destPath };
}

// ---------- Resource dispatcher ----------
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
    } catch (e) {
      /* ignore */
    }

    if (category.name === 'case-studies') {
      const row = await extractCaseStudy(page);
      return { type: 'row', data: row };
    } else {
      // reports/guides: download PDF
      const result = await downloadReportOrGuide(page, url, category.outputDir);
      appendLogs(
        DATASET_KEY,
        result
          ? `Successfully processed resource: ${url}`
          : `Failed to process resource (no PDF found or download failed): ${url}`,
      );
      return { type: 'pdf', data: result };
    }
  } finally {
    await page.close();
  }
}

// ========== BACKUP RECOVERY ==========

async function rebuildFromBackup() {
  // Recovery only for case studies (since only they have backup)
  console.log(`♻️ BACKUP RECOVERY MODE: Rebuilding case studies from backup...`);
  const backupRows = await readBackupCsv(DATASET_KEY);
  if (backupRows.length === 0) {
    console.warn('No backup found.');
    return;
  }
  const finalRows = backupRows.map((row, idx) => ({
    ID: formatId(DATASET_KEY, idx + 1),
    problem: cleanText(row.problem || ''),
    solution: cleanText(row.solution || ''),
    materials: cleanText(row.materials || ''),
    circular_strategy: cleanText(row.circular_strategy || 'Circular economy initiative'),
    category: cleanText(row.category || 'Cross-sector'),
    impact: cleanText(row.impact || ''),
    source_url: row.source_url || '',
    metadata_json: row.metadata_json || '{}',
  }));
  await writeCsv(OUTPUT_PATH, finalRows, APPEND_PROCESSED);
  console.log(`✅ Rebuilt ${finalRows.length} case study rows.`);
  return;
}

// ========== CATEGORY SCRAPING ==========

async function scrapeCategory(browser, category) {
  const { name, listUrl, START_PAGE, END_PAGE, MAX_PAGES_TO_FETCH, outputDir } = category;
  const FINAL_FETCH_PAGE = Math.min(END_PAGE, START_PAGE + MAX_PAGES_TO_FETCH - 1);
  console.log(
    `\n=== Scraping category: ${name}, PAGES: ${START_PAGE}-${FINAL_FETCH_PAGE} (max ${MAX_PAGES_TO_FETCH} pages) ===`,
  );
  await appendLogs(
    DATASET_KEY,
    `Starting category: ${name}, PAGES: ${START_PAGE}-${FINAL_FETCH_PAGE}, max pages: ${MAX_PAGES_TO_FETCH}`,
  );

  const allRows = [];
  let pdfCount = 0; // for reports/guides

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
          console.log('    No more resources found. Stopping pagination for this category.');
          await appendLogs(DATASET_KEY, `  No resources found on page ${pageNum}.`);
          break;
        }
        console.log(`    Found ${links.length} resources.`);
        success = true;
      } catch (err) {
        retries--;
        const msg = `  ⚠️ Page ${pageNum} error (retries left: ${retries}): ${err.message}`;
        console.warn(msg);
        await appendLogs(DATASET_KEY, msg);
        if (retries === 0) {
          const skipMsg = `  ⚠️ Skipping page ${pageNum} after 3 failed attempts.`;
          console.warn(skipMsg);
          await appendLogs(DATASET_KEY, skipMsg);
        } else {
          await sleep(5000 * (3 - retries));
        }
      } finally {
        await listPage.close();
      }
    }

    if (links.length === 0) break;

    const pageRows = []; // only used for case studies

    for (const link of links) {
      console.log(`    Fetching: ${link}`);
      let resourceRetries = 2;
      let resourceSuccess = false;

      while (resourceRetries > 0 && !resourceSuccess) {
        try {
          const result = await processResource(browser, link, category);
          if (result.type === 'row') {
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
            // PDF downloaded
            if (result.data) pdfCount++;
          }
          resourceSuccess = true;
        } catch (err) {
          resourceRetries--;
          const errMsg = `      ⚠️ Resource error (retries left: ${resourceRetries}): ${err.message}`;
          console.warn(errMsg);
          await appendLogs(DATASET_KEY, errMsg);
          if (resourceRetries === 0) {
            const skipMsg = `      ⚠️ Skipping resource after 2 failed attempts.`;
            console.warn(skipMsg);
            await appendLogs(DATASET_KEY, skipMsg);
          } else {
            await sleep(3000);
          }
        }
      }
      await sleep(1000 + Math.floor(Math.random() * 1000));
    }

    // Backup only for case studies
    if (name === 'case-studies' && pageRows.length > 0) {
      try {
        await backup.add(pageRows);
        await appendLogs(DATASET_KEY, `Page ${pageNum}: added ${pageRows.length} rows to backup.`);
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
    `🚀 Scrape started. Categories: ${ACTIVE_CATEGORIES.map((c) => c.name).join(', ')}, BACKUP_INTERVAL: ${BACKUP_INTERVAL}`,
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

    // Write case study rows if any
    if (allRows.length > 0) {
      const finalRows = allRows.map((row, idx) => ({
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
      console.log(`\n✅ Scraped ${finalRows.length} case study rows.`);
      console.log(`📁 Saved to: ${OUTPUT_PATH}`);

      const firstRow = finalRows[0];
      const lastRow = finalRows[finalRows.length - 1];

      await appendLogs(
        DATASET_KEY,
        `   First: ${firstRow.ID} | ${firstRow.problem.substring(0, 50)}...`,
      );
      await appendLogs(
        DATASET_KEY,
        `   Last:  ${lastRow.ID} | ${lastRow.problem.substring(0, 50)}...`,
      );
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
      `✅ Scrape complete. Rows: ${allRows.length}, PDFs: ${totalPdfs}`,
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

// Main entry point: handles both normal and recovery modes
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
