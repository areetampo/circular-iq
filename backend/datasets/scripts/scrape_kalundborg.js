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

/* global process */

import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { fileURLToPath } from 'url';
import {
  formatId,
  cleanText,
  getDatasetProcessedCsvPath,
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
} from '#utils/datasetsUtils.js';

// Add stealth plugin to avoid detection
puppeteerExtra.use(StealthPlugin());

const DATASET_KEY = 'kalundborg';
const BACKUP_INTERVAL = 1;
const LISTING_URL = 'https://www.symbiosis.dk/en/category/case/';
const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

const CLEAR_BACKUP_ON_START = true;
//has 1 page only, no pagination needed, but keeping the structure for consistency with other scrapers and future-proofing if more cases are added
const START_PAGE = 1;
const END_PAGE = 1;
const MAX_PAGES_TO_FETCH = 1;
const MAX_ROWS = 170;

const APPEND_PROCESSED = hasAppendProcessedFlag();
const APPEND_BACKUP = hasAppendBackupFlag();
const backup = createBackupHelper(
  DATASET_KEY,
  BACKUP_INTERVAL,
  CLEAR_BACKUP_ON_START && !APPEND_BACKUP,
);

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
    console.log(`    Visiting detail page: ${url}`);
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
          console.log(`    Found content using selector: ${selector}`);
          break;
        }
      } catch (err) {
        // selector not found or empty, try next
      }
    }

    // If no content found with specific selectors, fallback to body text
    if (!content || content.trim().length === 0) {
      console.log('    Falling back to body text');
      content = await page.$eval('body', (el) => el.innerText);
    }

    if (!content || content.trim().length === 0) {
      console.log('    No content extracted at all');
      return null;
    }

    const paragraphs = content.split('\n').filter((p) => p.trim().length > 0);

    // Find quantified impact
    const impactMatch = content.match(
      /(\d+[.,]?\d*)\s*(tons?|t\s|tonnes?|kg|CO2|CO₂|\%|percent|reduction|saving)/i,
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
    console.log(
      `    Extracted ${content.length} chars, ${paragraphs.length} paragraphs, ${materials.length} materials`,
    );
    await appendLogs(
      DATASET_KEY,
      `Extracted: ${content.length} chars, ${paragraphs.length} paragraphs, ${materials.length} materials, impact="${impact.substring(0, 50)}"`,
    );

    return rowData;
  } catch (error) {
    console.error(`Error extracting ${url}:`, error.message);
    await appendLogs(DATASET_KEY, `ERROR: ${url} - ${error.message}`);
    return null;
  }
}

/**
 * Rebuild final CSV from backup (recovery mode)
 */
async function rebuildFromBackup() {
  console.log('Recovery mode: rebuilding from backup...');
  await appendLogs(DATASET_KEY, `♻️ RECOVERY MODE: Rebuilding from backup started.`);

  const backupRows = await readBackupCsv(DATASET_KEY);
  if (!backupRows || backupRows.length === 0) {
    console.warn('No backup found or backup is empty.');
    await appendLogs(DATASET_KEY, `⚠️ No backup content found. Cannot rebuild output.`);
    return;
  }

  console.log(`Found ${backupRows.length} rows in backup`);
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
        return null;
      }
    })
    .filter((c) => c && c.qualityScore > 0 && c.problem && c.solution);

  // Sort by quality and take top MAX_ROWS
  const topCases = cases.sort((a, b) => b.qualityScore - a.qualityScore).slice(0, MAX_ROWS);

  console.log(`Selected ${topCases.length} high‑quality cases after scoring/filtering`);
  await appendLogs(DATASET_KEY, `Selected ${topCases.length} cases after scoring/filtering.`);

  if (topCases.length === 0) {
    console.warn('No valid cases could be reconstructed from backup.');
    await appendLogs(DATASET_KEY, `⚠️ No valid cases – output file unchanged.`);
    return;
  }

  // Add IDs and write final CSV (strip temporary fields)
  const finalRows = topCases.map((row, idx) => {
    const { _qualityScore, _materialCount, _hasQuantifiedImpact, ...cleanRow } = row;
    return {
      ID: formatId(DATASET_KEY, idx + 1),
      ...cleanRow,
    };
  });

  await writeCsv(OUTPUT_PATH, finalRows, APPEND_PROCESSED);
  console.log(`✅ Rebuilt ${finalRows.length} rows from backup`);
  await appendLogs(
    DATASET_KEY,
    `✅ Recovery complete. Wrote ${finalRows.length} rows to ${OUTPUT_PATH}`,
  );
}

/**
 * Main scrape function
 */
async function scrape() {
  await clearLogs(DATASET_KEY);

  await appendLogs(DATASET_KEY, `🚀 Scrape started...`);

  console.log(`Scraping Kalundborg Symbiosis cases from ${LISTING_URL}`);
  console.log(`Logs: ${getDatasetScrapeLogsPath(DATASET_KEY)}`);

  const browser = await puppeteerExtra.launch(getBrowserLaunchOptions());
  const page = await browser.newPage();
  await page.setViewport(getViewportOptions());
  await page.setUserAgent(getUserAgentOptions());
  await page.setExtraHTTPHeaders(getExtraHttpHeaders());

  try {
    // Go to listing page
    console.log('Navigating to listing page...');
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

    console.log(`Found ${cases.length} cases on listing page`);
    await appendLogs(DATASET_KEY, `Found ${cases.length} cases`);

    const allRows = [];

    // Process each case
    for (let i = 0; i < cases.length; i++) {
      const caseItem = cases[i];
      console.log(`[${i + 1}/${cases.length}] Processing: ${caseItem.title}`);
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

    console.log(`Valid rows: ${validRows.length}, keeping top ${topRows.length} by quality score`);
    await appendLogs(DATASET_KEY, `Valid rows: ${validRows.length}, keeping top ${topRows.length}`);

    // Prepare final rows (strip temporary fields)
    const finalRows = topRows.map((row, idx) => {
      const { _qualityScore, _materialCount, _hasQuantifiedImpact, ...cleanRow } = row;
      return {
        ID: formatId(DATASET_KEY, idx + 1),
        ...cleanRow,
      };
    });

    await writeCsv(OUTPUT_PATH, finalRows, APPEND_PROCESSED);

    console.log('\n✅ Scraping complete!');
    console.log(`   Kept (top ${MAX_ROWS}): ${finalRows.length}`);
    console.log(`   Output: ${OUTPUT_PATH}`);

    const firstRow = finalRows[0];
    const lastRow = finalRows[finalRows.length - 1];

    await appendLogs(
      DATASET_KEY,
      `Scrape complete: ${cases.length} cases, ${allRows.length} extracted, ${validRows.length} valid, kept ${finalRows.length}`,
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
    console.error('❌ Fatal error:', error);
    await appendLogs(DATASET_KEY, `❌ Fatal error: ${error.message}`);
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
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  });
}
