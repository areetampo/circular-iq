/* global process */

/**
 * scrape_ecesp.js - European Commission Circular Economy and Sustainability Practices extraction
 *
 * Extracts good practice examples from official registry. Extracts detailed case studies including
 * organizations, problem statements, solutions, and sustainability impact metrics.
 *
 * Features:
 *   • Pagination handling with dynamic load-more button clicking
 *   • Per-item detail extraction (organization, description, impact metrics)
 *   • Quality scoring based on content completeness and measurable impact indicators
 *   • Backup system: incremental batch-level backup and recovery mode
 *   • Detailed logging to dataset-specific log file
 *
 * Usage:
 *   node scrape_ecesp.js                 # normal run
 *   node scrape_ecesp.js --use-backup    # rebuild final CSV from backup
 *   node scrape_ecesp.js --clear-logs    # clear the log file before starting
 *   node scrape_ecesp.js --append-processed  # append to processed CSV instead of overwriting
 *   node scrape_ecesp.js --append-backup     # append to backup instead of clearing on start
 *
 * For detailed logs, see the path printed at the start of the run.
 */

import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { fileURLToPath } from 'url';
import {
  formatId,
  cleanText,
  getBrowserLaunchOptions,
  getViewportOptions,
  getUserAgentOptions,
  getExtraHttpHeaders,
  DATASET_LOOKUP,
  DATASET_KEYS,
  getDatasetProcessedCsvPath,
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

puppeteerExtra.use(StealthPlugin());

const DATASET_KEY = DATASET_KEYS.ecesp;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const BASE_URL = dataset.urls.target;
const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);
const START_PAGE = 0; // pagination is 0‑based index
const END_PAGE = 63; // 0-based index for the last page
const MAX_PAGES_TO_FETCH = 64;
const BEST_LIMIT = 450; // Max items to keep
const BACKUP_INTERVAL = 3; // pages per backup flush
const CLEAR_BACKUP_ON_START = true;

const APPEND_PROCESSED = hasAppendProcessedFlag();
const APPEND_BACKUP = hasAppendBackupFlag();
const backup = createBackupHelper(
  DATASET_KEY,
  BACKUP_INTERVAL,
  CLEAR_BACKUP_ON_START && !APPEND_BACKUP,
  MAX_PAGES_TO_FETCH,
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Score an item based on description and results.
 * @param {string} description - Full description text.
 * @param {string} results - Main results/impact text.
 * @returns {number} Quality score (higher is better).
 */
function scoreItem(description, results) {
  const text = (description + ' ' + results).toLowerCase();
  let score = 0;

  // +3 for measurable impact (numbers, units)
  if (/\d+%|\d+\s?tonnes|\d+\s?million|€|\$|\d+\s?co2/i.test(text)) score += 3;

  // +2 for long description (more detailed)
  if (description.length > 800) score += 2;

  // +2 for circular economy keywords
  const circularKeywords = [
    'reuse',
    'recycle',
    'remanufacture',
    'circular',
    'closed loop',
    'recovery',
  ];
  if (circularKeywords.some((kw) => text.includes(kw))) score += 2;

  // +1 for material/industry keywords
  const materialKeywords = [
    'steel',
    'plastic',
    'textile',
    'wood',
    'paper',
    'glass',
    'metal',
    'biomass',
    'organic',
    'waste',
    'rubber',
    'tyre',
    'biopolymer',
    'recycled',
    'aluminium',
    'copper',
    'electronics',
    'e-waste',
    'packaging',
    'cardboard',
    'concrete',
    'timber',
  ];
  if (materialKeywords.some((kw) => text.includes(kw))) score += 1;

  // -2 for policy/report narrative (likely not a concrete practice)
  if (text.includes('report') || text.includes('framework') || text.includes('strategy document'))
    score -= 2;

  return score;
}

/**
 * Rebuild final CSV from backup content.
 * Used when --use-backup flag is passed to script.
 */
async function rebuildFromBackup() {
  console.log(`♻️ BACKUP RECOVERY MODE: Building final CSV from saved backup content...`);

  try {
    await appendLogs(DATASET_KEY, `♻️ RECOVERY MODE: Rebuilding from backup started.`);

    const backupRows = await readBackupCsv(DATASET_KEY);
    if (backupRows.length === 0) {
      const msg = `⚠️ No backup content found. Cannot rebuild output.`;
      console.warn(msg);
      await appendLogs(DATASET_KEY, msg);
      await appendLogs(DATASET_KEY, `\n--- End of recovery run (no data) ---\n`);
      return;
    }

    console.log(`📖 Processing ${backupRows.length} backup rows...`);
    await appendLogs(DATASET_KEY, `Read ${backupRows.length} backup rows.`);

    // Reconstruct items from the stored metadata_json
    const items = backupRows
      .map((row) => {
        try {
          const metadata = JSON.parse(row.metadata_json || '{}');
          const description = metadata.description || '';
          const results = metadata.results || '';
          const score = scoreItem(description, results);

          return {
            problem: row.problem,
            solution: row.solution,
            materials: row.materials,
            circular_strategy: row.circular_strategy,
            category: row.category,
            impact: row.impact,
            source_url: row.source_url,
            score,
            metadata,
          };
        } catch (e) {
          console.warn(`⚠️ Skipping invalid backup row: ${e.message}`);
          return null;
        }
      })
      .filter((item) => item !== null);

    // Sort by score descending
    items.sort((a, b) => b.score - a.score);

    // Deduplicate by title (using metadata.title) and source_url
    const seenUrls = new Set();
    const seenTitles = new Set();
    const uniqueItems = [];

    for (const item of items) {
      if (seenUrls.has(item.source_url)) continue;
      seenUrls.add(item.source_url);

      const title = item.metadata.title || '';
      if (seenTitles.has(title)) continue;
      seenTitles.add(title);

      uniqueItems.push(item);
    }

    // Take top BEST_LIMIT
    const bestItems = uniqueItems.slice(0, BEST_LIMIT);

    console.log(`✅ Selected ${bestItems.length} best items from backup`);
    await appendLogs(DATASET_KEY, `Selected ${bestItems.length} items after scoring/filtering.`);

    if (bestItems.length === 0) {
      console.warn(`⚠️ No valid items could be reconstructed from backup.`);
      await appendLogs(DATASET_KEY, `⚠️ No valid items – output file unchanged.`);
      await appendLogs(DATASET_KEY, `\n--- End of recovery run (no output) ---\n`);
      return;
    }

    // Build final output rows
    const finalRows = bestItems.map((item, index) => ({
      ID: formatId(DATASET_KEY, index + 1),
      problem: cleanText(item.problem || ''),
      solution: cleanText(item.solution || ''),
      materials: cleanText(item.materials || ''),
      circular_strategy: cleanText(item.circular_strategy || ''),
      category: cleanText(item.category || ''),
      impact: cleanText(item.impact || ''),
      source_url: item.source_url || '',
      metadata_json: JSON.stringify(item.metadata),
    }));

    await writeCsv(OUTPUT_PATH, finalRows, APPEND_PROCESSED);
    console.log(`\n✨ Successfully rebuilt ${finalRows.length} ECESP items from backup`);
    console.log(`📁 Saved to: ${OUTPUT_PATH}`);
    await appendLogs(
      DATASET_KEY,
      `✅ Recovery complete. Wrote ${finalRows.length} rows to ${OUTPUT_PATH}`,
    );
    await appendLogs(DATASET_KEY, `\n--- End of recovery run ---\n`);
  } catch (error) {
    console.error('❌ Error rebuilding from backup:', error.message);
    await appendLogs(DATASET_KEY, `❌ Recovery failed: ${error.message}`);
    await appendLogs(DATASET_KEY, `\n--- Recovery aborted ---\n`);
    throw error;
  }
}

async function scrape_ecesp() {
  await clearLogs(DATASET_KEY);

  if (isBackupRecoveryMode()) {
    await rebuildFromBackup();
    return;
  }

  const logFilePath = getDatasetScrapeLogsPath(DATASET_KEY);
  console.log(`Scraping ECESP. Detailed logs: ${logFilePath}`);

  let browser;
  try {
    const FINAL_FETCH_PAGE = Math.min(END_PAGE, START_PAGE + MAX_PAGES_TO_FETCH - 1);
    await appendLogs(
      DATASET_KEY,
      `🚀 Scrape started. Target: ${BASE_URL}, PAGES: ${START_PAGE}-${FINAL_FETCH_PAGE}, MAX_PAGES_TO_FETCH: ${MAX_PAGES_TO_FETCH}, BACKUP_INTERVAL: ${BACKUP_INTERVAL}, CLEAR_BACKUP_ON_START: ${CLEAR_BACKUP_ON_START}`,
    );

    browser = await puppeteerExtra.launch(getBrowserLaunchOptions());

    const page = await browser.newPage();
    await page.setViewport(getViewportOptions());
    await page.setUserAgent(getUserAgentOptions());
    await page.setExtraHTTPHeaders(getExtraHttpHeaders());

    const allItems = []; // will hold items with full metadata
    const pagesScraped = [];

    for (let pageNum = START_PAGE; pageNum <= FINAL_FETCH_PAGE; pageNum++) {
      const listUrl = pageNum === 0 ? BASE_URL : `${BASE_URL}?page=${pageNum}`;
      await appendLogs(DATASET_KEY, `Fetching page ${pageNum}...`);

      let retries = 3;
      let success = false;
      let pageLinks = [];

      while (retries > 0 && !success) {
        try {
          await sleep(3000 + Math.floor(Math.random() * 3000));
          await page.goto(listUrl, { waitUntil: 'networkidle0', timeout: 60000 });
          await sleep(5000);

          await page.waitForSelector('div.node--type-cecon-good-practice', { timeout: 30000 });

          pageLinks = await page.$$eval('div.node--type-cecon-good-practice h2 a', (anchors) =>
            anchors.map((a) => a.href),
          );

          if (pageLinks.length === 0) {
            await appendLogs(
              DATASET_KEY,
              `  ✓ No practices found on page ${pageNum}. Stopping pagination.`,
            );
            break;
          }

          await appendLogs(DATASET_KEY, `  ✓ Found ${pageLinks.length} practices.`);
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
            break;
          } else {
            await sleep(10000 * (3 - retries)); // exponential backoff
          }
        }
      }

      // If no links found, stop pagination entirely
      if (pageLinks.length === 0) break;

      // Process each detail page on this listing page
      const pageRows = []; // for backup
      for (const link of pageLinks) {
        const detailPage = await browser.newPage();
        let detailSuccess = false;
        let detailRetries = 2;

        while (detailRetries > 0 && !detailSuccess) {
          try {
            await sleep(3000 + Math.floor(Math.random() * 3000));
            await detailPage.goto(link, { waitUntil: 'networkidle2', timeout: 60000 });

            // Cookie handling (optional)
            try {
              const cookieBanner = await detailPage.$('#cookie-consent-banner, .wt-cck--banner');
              if (cookieBanner) {
                const acceptButton = await detailPage.$('a.wt-cck--actions-button:first-child');
                if (acceptButton) {
                  await Promise.race([
                    detailPage
                      .waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 })
                      .catch(() => {}),
                    acceptButton.click(),
                  ]);
                  await sleep(2000);
                }
              }
            } catch (e) {
              // cookie error is non‑critical, just log to backup
              await appendLogs(DATASET_KEY, `  - Cookie handling error: ${e.message}`);
            }

            await detailPage.waitForSelector('.field-node--field-cecon-description .field-item', {
              timeout: 10000,
            });

            // Extract data
            const data = await detailPage.evaluate(() => {
              const getText = (selectors) => {
                for (const sel of selectors) {
                  const el = document.querySelector(sel);
                  if (el && el.innerText.trim()) return el.innerText.trim();
                }
                return '';
              };

              return {
                title: getText(['h1.page-title', 'h1.title', '.field-node--title .field-item']),
                organisation: getText([
                  '.field-node--field-cecon-organisation-company a',
                  '.field-node--field-cecon-organisation-company .field-item',
                ]),
                country: getText(['.field-node--field-cecon-country .field-item']),
                keyArea: getText([
                  '.field-node--field-cecon-key-area .field-item a',
                  '.field-node--field-cecon-key-area .field-item',
                ]),
                description: getText([
                  '.field-node--field-cecon-description .field-item',
                  '.field-node--body .field-item',
                  '.field--type-text-with-summary .field-item',
                  '.clearfix.text-formatted.field',
                ]),
                results: getText([
                  '.field-node--field-cecon-main-results .field-item',
                  '.field-node--field-cecon-results .field-item',
                ]),
                sectors: Array.from(
                  document.querySelectorAll('.field-node--field-cecon-sector .field-item a'),
                ).map((el) => el.innerText.trim()),
              };
            });

            // Clean text fields
            const cleanedTitle = cleanText(data.title);
            const cleanedOrganisation = cleanText(data.organisation);
            const cleanedCountry = cleanText(data.country);
            const cleanedKeyArea = cleanText(data.keyArea);
            const cleanedDescription = cleanText(data.description);
            const cleanedResults = cleanText(data.results);
            const cleanedSectors = data.sectors.map((s) => cleanText(s));

            // Extract materials from description
            const materialKeywords = [
              'steel',
              'plastic',
              'textile',
              'wood',
              'paper',
              'glass',
              'metal',
              'biomass',
              'organic',
              'waste',
              'rubber',
              'tyre',
              'biopolymer',
              'recycled',
              'aluminium',
              'copper',
              'electronics',
              'e-waste',
              'packaging',
              'cardboard',
              'concrete',
              'timber',
            ];
            const materialsFound = [];
            const lowerDesc = cleanedDescription.toLowerCase();
            for (const kw of materialKeywords) {
              if (lowerDesc.includes(kw)) materialsFound.push(kw);
            }

            // Problem: first sentence of description (or fallback)
            let problem = '';
            if (cleanedDescription) {
              const firstSentence = cleanedDescription.split(/[.!?]+/)[0];
              problem = firstSentence;
            }
            if (!problem || problem.length < 20) {
              problem = `Circular economy practice in ${cleanedCountry || 'unknown'}.`;
            }

            const solution = cleanedDescription || 'No description available.';

            // Category: key area or first sector
            let category = cleanedKeyArea;
            if (!category && cleanedSectors.length) {
              category = cleanedSectors[0];
            }

            // Infer circular strategy
            let strategy = '';
            const strategyMap = {
              reduce: ['reduce', 'prevention', 'refuse', 'less'],
              reuse: ['reuse', 'second-hand'],
              recycle: ['recycle', 'recovery'],
              repair: ['repair', 'maintenance'],
              refurbish: ['refurbish', 'renovate'],
              remanufacture: ['remanufactur'],
              'product-as-a-service': ['service', 'leasing', 'rental', 'product as a service'],
              'industrial symbiosis': ['symbiosis', 'by-product', 'waste exchange'],
              'eco-design': ['design', 'ecodesign', 'design for'],
            };
            const combinedText = (
              cleanedDescription +
              ' ' +
              cleanedSectors.join(' ')
            ).toLowerCase();
            for (const [strat, keywords] of Object.entries(strategyMap)) {
              if (keywords.some((kw) => combinedText.includes(kw))) {
                strategy = strat;
                break;
              }
            }

            const impact = cleanedResults || 'No specific impact data available.';

            // Build the item with full metadata
            const metadata = {
              title: cleanedTitle,
              organisation: cleanedOrganisation,
              country: cleanedCountry,
              keyArea: cleanedKeyArea,
              description: cleanedDescription,
              results: cleanedResults,
              sectors: cleanedSectors,
            };

            const item = {
              problem: cleanText(problem),
              solution: cleanText(solution),
              materials: materialsFound.join(', '),
              circular_strategy: strategy || 'general',
              category: category || 'general',
              impact: cleanText(impact),
              source_url: link,
              metadata,
            };

            allItems.push(item);

            // Prepare backup row (with metadata_json)
            const backupRow = {
              problem: item.problem,
              solution: item.solution,
              materials: item.materials,
              circular_strategy: item.circular_strategy,
              category: item.category,
              impact: item.impact,
              source_url: item.source_url,
              metadata_json: JSON.stringify(metadata),
            };
            pageRows.push(backupRow);

            detailSuccess = true;
          } catch (err) {
            detailRetries--;
            const errMsg = `⚠️ Error processing detail (retries left: ${detailRetries}): ${err.message}`;
            await appendLogs(DATASET_KEY, errMsg);
            if (detailRetries === 0) {
              await appendLogs(DATASET_KEY, `⚠️ Skipping this practice after 2 failed attempts.`);
            } else {
              await sleep(5000);
            }
          } finally {
            await detailPage.close();
          }
        }

        // Small delay between detail fetches
        await sleep(1000 + Math.floor(Math.random() * 1000));
      }

      // Add page rows to backup helper (increments counter)
      if (pageRows.length > 0) {
        try {
          await backup.add(pageRows);
          await appendLogs(
            DATASET_KEY,
            `Page ${pageNum}: found ${pageLinks.length} links, processed ${pageRows.length} practices.`,
          );
        } catch (e) {
          await appendLogs(DATASET_KEY, `⚠️ Backup add failed for page ${pageNum}: ${e.message}`);
        }
      }

      pagesScraped.push(pageNum);

      if (pageNum === FINAL_FETCH_PAGE) {
        await appendLogs(
          DATASET_KEY,
          `⚠️ Reached final fetch page (${FINAL_FETCH_PAGE}) – stopping.`,
        );
        break;
      }

      await sleep(2000); // Rate limiting between pages
    }

    // Flush any remaining backup rows
    await backup.flush();

    await appendLogs(DATASET_KEY, `Total raw practices collected: ${allItems.length}`);

    if (allItems.length === 0) {
      console.log('❌ No items scraped. Exiting.');
      await appendLogs(DATASET_KEY, `⚠️ No items scraped.`);
      await appendLogs(DATASET_KEY, `\n--- End of run (no output) ---\n`);
      return;
    }

    // Score all items
    const scoredItems = allItems.map((item) => ({
      ...item,
      score: scoreItem(item.metadata.description || '', item.metadata.results || ''),
    }));

    // Sort by score descending
    scoredItems.sort((a, b) => b.score - a.score);

    // Deduplicate by title and URL
    const seenUrls = new Set();
    const seenTitles = new Set();
    const uniqueItems = [];

    for (const item of scoredItems) {
      if (seenUrls.has(item.source_url)) continue;
      seenUrls.add(item.source_url);

      const title = item.metadata.title || '';
      if (seenTitles.has(title)) continue;
      seenTitles.add(title);

      uniqueItems.push(item);
    }

    // Take top BEST_LIMIT
    const bestItems = uniqueItems.slice(0, BEST_LIMIT);

    await appendLogs(DATASET_KEY, `After filtering and scoring: ${bestItems.length} items kept.`);

    // Write final CSV
    const finalRows = bestItems.map((item, index) => ({
      ID: formatId(DATASET_KEY, index + 1),
      problem: item.problem,
      solution: item.solution,
      materials: item.materials,
      circular_strategy: item.circular_strategy,
      category: item.category,
      impact: item.impact,
      source_url: item.source_url,
      metadata_json: JSON.stringify(item.metadata),
    }));

    await writeCsv(OUTPUT_PATH, finalRows, APPEND_PROCESSED);
    console.log(`\n✅ Scraped ${finalRows.length} ECESP items.`);
    console.log(`📁 Saved to: ${OUTPUT_PATH}`);

    const firstRow = finalRows[0];
    const lastRow = finalRows[finalRows.length - 1];

    await appendLogs(
      DATASET_KEY,
      `✅ Scrape complete. Wrote ${finalRows.length} rows to ${OUTPUT_PATH}. Pages scraped: ${pagesScraped.join(', ')}.`,
    );
    await appendLogs(
      DATASET_KEY,
      `   First: ${firstRow.ID} | ${firstRow.problem.substring(0, 50)}...`,
    );
    await appendLogs(
      DATASET_KEY,
      `   Last:  ${lastRow.ID} | ${lastRow.problem.substring(0, 50)}...`,
    );
    await appendLogs(DATASET_KEY, `\n--- End of run ---\n`);
  } catch (error) {
    console.error('❌ Fatal error in scrape_ecesp:', error);
    await appendLogs(DATASET_KEY, `❌ Fatal error: ${error.message}`);
    await appendLogs(DATASET_KEY, `\n--- Run aborted ---\n`);
    throw error;
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
    await scrape_ecesp();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  });
}
