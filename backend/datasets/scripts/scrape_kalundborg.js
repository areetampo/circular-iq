
/**
 * scrape_kalundborg.js - Case studies scraping from Kalundborg Symbiosis
 *
 * URL: https://www.symbiosis.dk/en/category/case/
 *
 * Features:
 *   • Scrapes all cases from the listing page (no pagination needed)
 *   • Visits each detail page to extract full content
 *   • Quality scoring based on impact quantification and material richness
 *   • Backup every 3 cases (BACKUP_INTERVAL)
 *   • Recovery mode with `--use-backup`
 *   • Clear logs with `--clear-logs`
 *   • Show browser with `--show`
 *
 * Usage:
 *   node scrape_kalundborg.js                 # normal run
 *   node scrape_kalundborg.js --use-backup    # rebuild from backup
 *   node scrape_kalundborg.js --clear-logs    # clear log file
 *   node scrape_kalundborg.js --show          # open browser window
 *   node scrape_kalundborg.js --append-processed  # append to processed CSV instead of overwriting
 *   node scrape_kalundborg.js --append-backup     # append to backup instead of clearing on start
 */

import { fileURLToPath } from 'url';

import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import {
  appendLogs,
  cleanText,
  clearLogs,
  createBackupHelper,
  getBrowserLaunchOptions,
  getDatasetProcessedCsvPath,
  getDatasetScrapeLogsPath,
  getExtraHttpHeaders,
  getUserAgentOptions,
  getViewportOptions,
  hasAppendBackupFlag,
  hasAppendProcessedFlag,
  isBackupRecoveryMode,
  readBackupCsv,
  writeCsv,
} from '#utils/datasetsUtils.js';
import { logger } from '#utils/logger.js';

// Add stealth plugin to avoid detection
puppeteerExtra.use(StealthPlugin());

const DATASET_KEY = 'kalundborg';
const BACKUP_INTERVAL = 1;
const LISTING_URL = 'https://www.symbiosis.dk/en/category/case/';
const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

//has 1 page only, no pagination needed, but keeping the structure for consistency with other scrapers and future-proofing if more cases are added
const START_PAGE = 1;
const END_PAGE = 1;
const MAX_PAGES_TO_FETCH = 1;
const MAX_ROWS = 170;

const APPEND_PROCESSED = hasAppendProcessedFlag();
const APPEND_BACKUP = hasAppendBackupFlag();
const backup = createBackupHelper(DATASET_KEY, BACKUP_INTERVAL, !APPEND_BACKUP);

/**
 * Calculate a quality score for a case based on its content.
 * @param {Object} data - The extracted case data (includes impact, materials, etc.)
 * @returns {number} Score from 0 to 100.
 */
function scoreCaseQuality(data) {
  let score = 0;
  if (data.impact) {
    if (/\d+/.test(data.impact)) score += 40;
    else score += 20;
  }
  const materialCount = data.materials ? data.materials.split(',').length : 0;
  score += Math.min(materialCount * 10, 30);
  if (data.problem && data.problem.length > 100) score += 15;
  else if (data.problem && data.problem.length > 50) score += 10;
  if (data.solution && data.solution.length > 200) score += 15;
  else if (data.solution && data.solution.length > 100) score += 10;
  if (data.category && data.category !== 'Industrial' && data.category !== 'General') score += 10;
  return Math.min(score, 100);
}

/**
 * Extract data from a single case detail page
 */
async function extractCaseData(page, url, title) {
  try {
    logger.info({ url }, 'Visiting detail page');
    await appendLogs(DATASET_KEY, `Visiting detail page: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait a bit for any lazy-loaded content
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Try multiple selectors to find the main content container
    const contentSelectors = [
      '.elementor-widget-container',
      '.elementor-widget-theme-post-content',
      '.p-news',
      'article',
      'main',
      '.entry-content',
    ];

    let content = '';
    let containerFound = false;

    for (const selector of contentSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        containerFound = true;
        content = await page.$eval(selector, (el) => el.innerText);
        if (content && content.trim().length > 0) {
          logger.info({ selector }, 'Found content using selector');
          break;
        }
      } catch (err) {
        logger.error({ selector, error: err.message }, 'Error while waiting for selector');
        // selector not found or empty, try next
      }
    }

    // If no content found with specific selectors, fallback to body text
    if (!content || content.trim().length === 0) {
      logger.info('    Falling back to body text');
      content = await page.$eval('body', (el) => el.innerText);
    }

    if (!content || content.trim().length === 0) {
      logger.info('    No content extracted at all');
      return null;
    }

    const paragraphs = content.split('\n').filter((p) => p.trim().length > 0);

    // Find quantified impact
    const impactMatch = content.match(
      /(\d+(?:[.,]\d+)?)\s*(tons?|tonnes?|t\b|kg\b|CO2\b|CO₂\b|%|percent|reduction|saving)\b/i,
    );
    let impact = '';
    if (impactMatch) {
      const sentences = content.split(/[.!?]+/);
      for (const sentence of sentences) {
        if (sentence.includes(impactMatch[0])) {
          impact = sentence.trim();
          break;
        }
      }
    }

    // If no quantified impact, look for result sentences
    if (!impact && content.length > 0) {
      const resultSentences = paragraphs.filter(
        (p) =>
          p.toLowerCase().includes('reduce') ||
          p.toLowerCase().includes('saving') ||
          p.toLowerCase().includes('improve') ||
          p.toLowerCase().includes('recycl') ||
          p.toLowerCase().includes('achieve'),
      );
      impact = resultSentences[0] || '';
    }

    // Detect materials (extended list)
    const materials = [];
    const materialKeywords = [
      'plastic',
      'pet',
      'nmp',
      'solvent',
      'water',
      'gypsum',
      'steam',
      'heat',
      'energy',
      'biomass',
      'fertilizer',
      'sulfur',
      'calcium sulfate',
      'fly ash',
      'sludge',
      'waste',
      'by-product',
      'organic acids',
      'amines',
      'salts',
      'protein',
      'ethanol',
      'CO2',
      'carbon dioxide',
      'hydrochloric acid',
      'sodium hydroxide',
      'nitrogen',
      'acetic acid',
    ];
    for (const keyword of materialKeywords) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        materials.push(keyword);
      }
    }

    // Determine strategy
    let strategy = 'Industrial Symbiosis';
    if (content.toLowerCase().includes('recycl')) {
      strategy = 'Recycling, Industrial Symbiosis';
    } else if (content.toLowerCase().includes('reuse')) {
      strategy = 'Reuse, Industrial Symbiosis';
    } else if (content.toLowerCase().includes('energy') || content.toLowerCase().includes('heat')) {
      strategy = 'Energy Recovery, Industrial Symbiosis';
    }

    // Determine category
    let category = 'Industrial';
    if (
      content.toLowerCase().includes('pharma') ||
      content.toLowerCase().includes('novo') ||
      content.toLowerCase().includes('boehringer')
    ) {
      category = 'Pharmaceutical';
    } else if (
      content.toLowerCase().includes('energy') ||
      content.toLowerCase().includes('power') ||
      content.toLowerCase().includes('østed')
    ) {
      category = 'Energy';
    } else if (
      content.toLowerCase().includes('gyproc') ||
      content.toLowerCase().includes('gypsum')
    ) {
      category = 'Construction';
    } else if (content.toLowerCase().includes('refinery')) {
      category = 'Oil & Gas';
    } else if (
      content.toLowerCase().includes('district') ||
      content.toLowerCase().includes('heating')
    ) {
      category = 'District Energy';
    }

    // Use title as problem base, or first paragraph
    const problem =
      paragraphs[0] || `Waste/excess ${materials.join(', ')} from industrial processes`;
    const solution =
      paragraphs.slice(1, 5).join(' ').substring(0, 800) || content.substring(0, 500);

    const rowData = {
      title,
      url,
      problem: cleanText(problem),
      solution: cleanText(solution),
      materials: materials.length > 0 ? materials.join(', ') : '',
      circular_strategy: strategy,
      category,
      impact: cleanText(impact),
      source_url: url,
      metadata_json: JSON.stringify({
        full_content: content.substring(0, 3000),
        paragraphs: paragraphs.length,
        extracted_at: new Date().toISOString(),
      }),
      _qualityScore: 0,
      _materialCount: materials.length,
      _hasQuantifiedImpact: !!impactMatch,
    };

    rowData._qualityScore = scoreCaseQuality(rowData);

    // Log a preview of what we got
    logger.info(
      {
        contentLength: content.length,
        paragraphsCount: paragraphs.length,
        materialsCount: materials.length
      },
      'Extracted content with materials'
    );
    await appendLogs(
      DATASET_KEY,
      `Extracted: ${content.length} chars, ${paragraphs.length} paragraphs, ${materials.length} materials, impact="${impact.substring(0, 50)}"`,
    );

    return rowData;
  } catch (error) {
    logger.error({ url, error: error.message }, 'Error extracting');
    await appendLogs(DATASET_KEY, `ERROR: ${url} - ${error.message}`);
    return null;
  }
}

/**
 * Rebuild final CSV from backup (recovery mode)
 */
async function rebuildFromBackup() {
  logger.info('Recovery mode: rebuilding from backup...');
  await appendLogs(DATASET_KEY, `♻️ RECOVERY MODE: Rebuilding from backup started.`);

  const backupRows = await readBackupCsv(DATASET_KEY);
  if (!backupRows || backupRows.length === 0) {
    logger.warn('No backup found or backup is empty.');
    await appendLogs(DATASET_KEY, `‼ No backup content found. Cannot rebuild output.`);
    return;
  }

  logger.info({ count: backupRows.length }, 'Found rows in backup');
  await appendLogs(DATASET_KEY, `Read ${backupRows.length} backup rows.`);

  // Parse metadata and restore quality scores
  const cases = backupRows
    .map((row) => {
      try {
        // If _qualityScore is stored, use it; otherwise compute
        let qualityScore = row._qualityScore ? parseFloat(row._qualityScore) : 0;
        if (qualityScore === 0) {
          // Recompute from available fields
          qualityScore = scoreCaseQuality(row);
        }
        return {
          ...row,
          qualityScore,
        };
      } catch (e) {
        logger.error({ error: e.message }, 'Error parsing backup row');
        return null;
      }
    })
    .filter((c) => c && c.qualityScore > 0 && c.problem && c.solution);

  // Sort by quality and take top MAX_ROWS
  const topCases = cases.sort((a, b) => b.qualityScore - a.qualityScore).slice(0, MAX_ROWS);

  logger.info({ count: topCases.length }, 'Selected high-quality cases after scoring/filtering');
  await appendLogs(DATASET_KEY, `Selected ${topCases.length} cases after scoring/filtering.`);

  if (topCases.length === 0) {
    logger.warn('No valid cases could be reconstructed from backup.');
    await appendLogs(DATASET_KEY, `‼ No valid cases – output file unchanged.`);
    return;
  }

  // Add IDs and write final CSV (strip temporary fields)
  const finalRows = topCases.map((row, idx) => {
    const { _qualityScore, _materialCount, _hasQuantifiedImpact, ...cleanRow } = row;
    return cleanRow;
  });

  logger.info({ count: finalRows.length }, 'Rebuilt rows from backup');
  const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, finalRows, {
    append: APPEND_PROCESSED,
  });
  await appendLogs(
    DATASET_KEY,
    `✓ Recovery complete. Wrote ${writeResult.writtenCount} rows to ${OUTPUT_PATH} (duplicate rows removed: ${writeResult.duplicateCount})`,
  );
}

/**
 * Main scrape function
 */
async function scrape() {
  await clearLogs(DATASET_KEY);

  await appendLogs(DATASET_KEY, `🚀 Scrape started...`);

  logger.info({ url: LISTING_URL }, 'Scraping Kalundborg Symbiosis cases');
  const logFilePath = getDatasetScrapeLogsPath(DATASET_KEY);
  logger.info({ logFilePath }, 'Logs path');

  const browser = await puppeteerExtra.launch(getBrowserLaunchOptions());
  const page = await browser.newPage();
  await page.setViewport(getViewportOptions());
  await page.setUserAgent(getUserAgentOptions());
  await page.setExtraHTTPHeaders(getExtraHttpHeaders());

  try {
    // Go to listing page
    logger.info('Navigating to listing page...');
    await page.goto(LISTING_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Extract all case links and titles
    const cases = await page.evaluate(() => {
      const articles = document.querySelectorAll('article.post');
      return Array.from(articles)
        .map((article) => {
          const titleEl = article.querySelector('h2.entry-title a');
          return {
            title: titleEl ? titleEl.textContent.trim() : '',
            url: titleEl ? titleEl.href : '',
          };
        })
        .filter((c) => c.url && c.title);
    });

    logger.info({ count: cases.length }, 'Found cases on listing page');
    await appendLogs(DATASET_KEY, `Found ${cases.length} cases`);

    const allRows = [];

    // Process each case
    for (let i = 0; i < cases.length; i++) {
      const caseItem = cases[i];
      logger.info({ current: i + 1, total: cases.length, title: caseItem.title }, 'Processing case');
      await appendLogs(
        DATASET_KEY,
        `Processing [${i + 1}/${cases.length}]: ${caseItem.title} - ${caseItem.url}`,
      );

      const rowData = await extractCaseData(page, caseItem.url, caseItem.title);

      if (rowData) {
        allRows.push(rowData);
        await appendLogs(DATASET_KEY, `  Added: score=${rowData._qualityScore}`);
      } else {
        await appendLogs(DATASET_KEY, `  FAILED: Could not extract data`);
      }

      // Small delay to be polite
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // has only 1 page
    backup.add(allRows);
    // Final flush of backup buffer
    await backup.flush();

    // Filter, score, and sort
    const validRows = allRows.filter((row) => row && row.problem && row.solution);

    // Sort by quality score (already computed) and take top MAX_ROWS
    const topRows = validRows.sort((a, b) => b._qualityScore - a._qualityScore).slice(0, MAX_ROWS);

    logger.info({ valid: validRows.length, keeping: topRows.length }, 'Valid rows, keeping top by quality score');
    await appendLogs(DATASET_KEY, `Valid rows: ${validRows.length}, keeping top ${topRows.length}`);

    // Prepare final rows (strip temporary fields)
    const finalRows = topRows.map((row) => {
      const { _qualityScore, _materialCount, _hasQuantifiedImpact, ...cleanRow } = row;
      return cleanRow;
    });

    const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, finalRows, {
      append: APPEND_PROCESSED,
    });

    logger.info('Scraping complete');
    logger.info({ maxRows: MAX_ROWS, kept: finalRows.length }, 'Kept top rows');
    logger.info(
      { outputPath: OUTPUT_PATH, written: writeResult.writtenCount, duplicates: writeResult.duplicateCount },
      'Output saved'
    );

    const firstRow = finalRows[0];
    const lastRow = finalRows[finalRows.length - 1];

    await appendLogs(
      DATASET_KEY,
      `Scrape complete: ${cases.length} cases, ${allRows.length} extracted, ${validRows.length} valid, kept ${finalRows.length}, written ${writeResult.writtenCount} (${writeResult.duplicateCount} duplicate rows removed)`,
    );
    await appendLogs(
      DATASET_KEY,
      `   First: ${firstRow.ID} | ${firstRow.problem.substring(0, 50)}...`,
    );
    await appendLogs(
      DATASET_KEY,
      `   Last:  ${lastRow.ID} | ${lastRow.problem.substring(0, 50)}...`,
    );
  } catch (error) {
    logger.error({ error }, '✕ Fatal error');
    await appendLogs(DATASET_KEY, `✕ Fatal error: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
    await appendLogs(DATASET_KEY, `--- End of run ---\n`);
  }
}

async function main() {
  if (isBackupRecoveryMode()) {
    await rebuildFromBackup();
  } else {
    await scrape();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    logger.error({ error: err.message }, '\n✕ Fatal error');
    process.exit(1);
  });
}
