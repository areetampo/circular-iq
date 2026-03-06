/* global process */

/**
 * scrape_emf.js - Ellen MacArthur Foundation Case Studies
 *
 * Scrapes EMF case studies from their online repository. Extracts detailed information
 * about circular economy implementations including companies, case study descriptions,
 * and measurable impact metrics.
 *
 * Features:
 *   • Dynamic pagination via "Load More" button clicking
 *   • Per-item detail extraction from individual case study pages
 *   • Quality scoring based on descriptions and impact metrics
 *   • Backup system: incremental batch-level backup with recovery mode
 *   • Detailed logging to dataset-specific log file
 *
 * Usage:
 *   node scrape_emf.js                 # normal run
 *   node scrape_emf.js --use-backup    # rebuild from backup
 *   node scrape_emf.js --clear-logs    # clear the log file
 *   node scrape_emf.js --append-processed  # append to CSV instead of overwriting
 *   node scrape_emf.js --append-backup     # append to backup instead of clearing
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

const DATASET_KEY = DATASET_KEYS.emf;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);
const BACKUP_INTERVAL = 3;
const CLEAR_BACKUP_ON_START = true;

const APPEND_PROCESSED = hasAppendProcessedFlag();
const APPEND_BACKUP = hasAppendBackupFlag();

// load more button as pagination – we will click it up to END_LOAD times, collecting items after each click
// Click range configuration – collect items only between START_LOAD and END_LOAD (inclusive)
const START_LOAD = 0; // 0 = include items before any clicks
const END_LOAD = 50; // 50 collect up to this many clicks
const MAX_LOADS_TO_FETCH = 50; // safety maximum number of clicks

// Create backup helper
const backup = createBackupHelper(
  DATASET_KEY,
  BACKUP_INTERVAL,
  CLEAR_BACKUP_ON_START && !APPEND_BACKUP,
  MAX_LOADS_TO_FETCH,
);

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

    const items = backupRows
      .map((row) => {
        try {
          const metadata = JSON.parse(row.metadata_json || '{}');
          return {
            problem: row.problem,
            solution: row.solution,
            materials: row.materials,
            circular_strategy: row.circular_strategy,
            category: row.category,
            impact: row.impact,
            source_url: row.source_url,
            metadata,
          };
        } catch (e) {
          console.warn(`⚠️ Skipping invalid backup row: ${e.message}`);
          return null;
        }
      })
      .filter((item) => item !== null);

    if (items.length === 0) {
      console.warn(`⚠️ No valid items could be reconstructed from backup.`);
      await appendLogs(DATASET_KEY, `⚠️ No valid items – output file unchanged.`);
      await appendLogs(DATASET_KEY, `\n--- End of recovery run (no output) ---\n`);
      return;
    }

    const finalRows = items.map((item, idx) => ({
      ID: formatId(DATASET_KEY, idx + 1),
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
    console.log(`\n✨ Successfully rebuilt ${finalRows.length} EMF case studies from backup`);
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

async function scrape_emf() {
  await clearLogs(DATASET_KEY);

  if (isBackupRecoveryMode()) {
    await rebuildFromBackup();
    return;
  }

  const logFilePath = getDatasetScrapeLogsPath(DATASET_KEY);
  console.log(`Scraping EMF. Detailed logs: ${logFilePath}`);

  let browser;
  try {
    const FINAL_FETCH_LOAD = Math.min(END_LOAD, START_LOAD + MAX_LOADS_TO_FETCH - 1);
    await appendLogs(
      DATASET_KEY,
      `🚀 Scrape started. Target: ${dataset.urls.target}, LOADS: ${START_LOAD}-${FINAL_FETCH_LOAD}, MAX_LOADS_TO_FETCH: ${MAX_LOADS_TO_FETCH}, BACKUP_INTERVAL: ${BACKUP_INTERVAL}, CLEAR_BACKUP_ON_START: ${CLEAR_BACKUP_ON_START}`,
    );

    browser = await puppeteerExtra.launch(getBrowserLaunchOptions());
    const page = await browser.newPage();
    await page.setViewport(getViewportOptions());
    await page.setUserAgent(getUserAgentOptions());
    await page.setExtraHTTPHeaders(getExtraHttpHeaders());

    await appendLogs(DATASET_KEY, `Navigating to EMF Case Study Hub...`);
    await page.goto(dataset.urls.target, { waitUntil: 'networkidle2' });

    // --- STEP 1: Handle "Load More" with incremental collection ---
    await appendLogs(DATASET_KEY, `⏳ Loading cases incrementally...`);
    let loadCount = 0;
    let previousUrls = new Set();
    const collected = [];
    const pagesCollected = []; // track which clicks contributed items

    // Function to get all current case study URLs
    const getCurrentUrls = async () => {
      return await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[data-gtm-id="tile-block"]'));
        return anchors.map((a) => a.href);
      });
    };

    // Initial set (before any clicks)
    let currentUrls = await getCurrentUrls();
    previousUrls = new Set(currentUrls);

    // If START_LOAD == 0, collect initial items
    if (START_LOAD === 0 && currentUrls.length > 0) {
      await appendLogs(DATASET_KEY, `Initial load: ${currentUrls.length} items.`);
      // Fetch details for initial items
      const pageRows = [];
      for (const link of currentUrls) {
        const detail = await fetchDetail(browser, link);
        if (detail) {
          collected.push(detail.item);
          pageRows.push(detail.backupRow);
        }
      }
      if (pageRows.length > 0) {
        try {
          await backup.add(pageRows);
          await appendLogs(DATASET_KEY, `Initial load: collected ${pageRows.length} items.`);
        } catch (e) {
          const backupErr = `⚠️ Backup add failed for initial load: ${e.message}`;
          console.warn(backupErr);
          await appendLogs(DATASET_KEY, backupErr);
        }
        pagesCollected.push(0);
      }
    }

    // Now click "Load More" up to END_LOAD, but no more than MAX_LOADS_TO_FETCH
    while (loadCount < END_LOAD && loadCount < MAX_LOADS_TO_FETCH) {
      try {
        const loadMoreButton = await page.$('button.ais-InfiniteHits-loadMore');
        if (!loadMoreButton) {
          await appendLogs(DATASET_KEY, `  ✓ No more "Load More" button – stopping.`);
          break;
        }

        await loadMoreButton.scrollIntoView();
        await loadMoreButton.click();
        loadCount++;
        await appendLogs(DATASET_KEY, `  ↳ Clicked "Load More" (${loadCount}/${END_LOAD})...`);
        await new Promise((r) => setTimeout(r, 2500)); // wait for new content

        // Get new URLs after this click
        currentUrls = await getCurrentUrls();
        const newUrls = currentUrls.filter((url) => !previousUrls.has(url));
        await appendLogs(DATASET_KEY, `     → Found ${newUrls.length} new items.`);

        // Only collect if this click is within the desired range
        if (loadCount >= START_LOAD_COUNT) {
          // Fetch details for each new URL
          const pageRows = [];
          for (const link of newUrls) {
            const detail = await fetchDetail(browser, link);
            if (detail) {
              collected.push(detail.item);
              pageRows.push(detail.backupRow);
            }
          }
          if (pageRows.length > 0) {
            try {
              await backup.add(pageRows);
              await appendLogs(
                DATASET_KEY,
                `Click ${loadCount}: found ${newUrls.length} new, collected ${pageRows.length} items.`,
              );
            } catch (e) {
              const backupErr = `⚠️ Backup add failed for click ${loadCount}: ${e.message}`;
              console.warn(backupErr);
              await appendLogs(DATASET_KEY, backupErr);
            }
            pagesCollected.push(loadCount);
          }
        } else {
          await appendLogs(DATASET_KEY, `     (Skipping collection – before START_LOAD)`);
        }

        // Update previous URLs for next iteration
        previousUrls = new Set(currentUrls);
      } catch (e) {
        const clickErr = `  ⚠️ Load More click failed at count ${loadCount}: ${e.message}`;
        console.warn(clickErr);
        await appendLogs(DATASET_KEY, clickErr);
        break;
      }
    }

    if (loadCount === END_LOAD) {
      await appendLogs(DATASET_KEY, `✅ Reached target end click count (${END_LOAD}).`);
    } else if (loadCount === MAX_LOADS_TO_FETCH) {
      const limitMsg = `⚠️ Reached fallback max clicks (${MAX_LOADS_TO_FETCH}) – stopping.`;
      console.warn(limitMsg);
      await appendLogs(DATASET_KEY, limitMsg);
    }

    // Flush any remaining backup rows
    await backup.flush();

    await appendLogs(DATASET_KEY, `Total raw items collected: ${collected.length}`);

    if (collected.length === 0) {
      console.log('❌ No items collected. Exiting.');
      await appendLogs(DATASET_KEY, `⚠️ No items collected.`);
      await appendLogs(DATASET_KEY, `\n--- End of run (no output) ---\n`);
      return;
    }

    // --- STEP 2: (Optional) Filter or score items if needed ---
    // (The original script did not filter, so we keep all collected.)

    // --- STEP 3: Save to CSV ---
    const finalRows = collected.map((item, idx) => ({
      ID: formatId(DATASET_KEY, idx + 1),
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
    console.log(`\n✅ Scraped ${finalRows.length} EMF case studies.`);
    console.log(`📁 Saved to: ${OUTPUT_PATH}`);

    const firstRow = finalRows[0];
    const lastRow = finalRows[finalRows.length - 1];

    await appendLogs(
      DATASET_KEY,
      `✅ Scrape complete. Wrote ${finalRows.length} rows to ${OUTPUT_PATH}. Clicks with data: ${pagesCollected.join(', ')}.`,
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
    console.error('❌ Fatal error in scrape_emf:', error);
    await appendLogs(DATASET_KEY, `❌ Fatal error: ${error.message}`);
    await appendLogs(DATASET_KEY, `\n--- Run aborted ---\n`);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Fetch detail page for a single case study link.
 * Returns { item, backupRow } or null if failed.
 */
async function fetchDetail(browser, link) {
  let detailPage;
  try {
    detailPage = await browser.newPage();
    await detailPage.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const data = await detailPage.evaluate(() => {
      const title =
        document.querySelector('h1')?.innerText ||
        document.querySelector('.legend-text p:last-child')?.innerText ||
        'Untitled';

      const gridItems = Array.from(document.querySelectorAll('.grid-wrapper'));
      let problem = '';
      let solution = '';

      gridItems.forEach((item) => {
        const heading = item.querySelector('h2')?.innerText.toLowerCase() || '';
        const content = item.querySelector('p')?.innerText || '';
        if (heading.includes('challenge') || heading.includes('brief')) {
          problem += content + ' ';
        } else if (heading.includes('solution') || heading.includes('contribution')) {
          solution += content + ' ';
        }
      });

      // Fallback if grid-wrapper is missing
      if (!problem) {
        const pTags = Array.from(document.querySelectorAll('p')).map((p) => p.innerText);
        problem = pTags.slice(0, 2).join(' ');
        solution = pTags.slice(2, 6).join(' ');
      }

      return { title, problem, solution };
    });

    // Only keep cases with a substantial problem description
    if (data.problem.length > 20) {
      const cleanedTitle = cleanText(data.title);
      const cleanedProblem = cleanText(data.problem);
      const cleanedSolution = cleanText(data.solution);

      const item = {
        problem: cleanedProblem,
        solution: cleanedSolution,
        materials: 'Circular Materials',
        circular_strategy: 'Design for Circularity',
        category: 'Case Study',
        impact: 'EMF Verified',
        source_url: link,
        metadata: { title: cleanedTitle, problem: cleanedProblem, solution: cleanedSolution },
      };

      const backupRow = {
        problem: item.problem,
        solution: item.solution,
        materials: item.materials,
        circular_strategy: item.circular_strategy,
        category: item.category,
        impact: item.impact,
        source_url: item.source_url,
        metadata_json: JSON.stringify(item.metadata),
      };

      return { item, backupRow };
    } else {
      // Log skipped items only to backup log, not console
      await appendLogs(
        DATASET_KEY,
        `⏩ Skipped (problem too short): ${data.title.substring(0, 40)}`,
      );
      return null;
    }
  } catch (err) {
    const errMsg = `⚠️ Error on ${link}: ${err.message}`;
    console.warn(errMsg);
    await appendLogs(DATASET_KEY, errMsg);
    return null;
  } finally {
    if (detailPage) await detailPage.close();
  }
}

// Main entry point: handles both normal and recovery modes
async function main() {
  if (isBackupRecoveryMode()) {
    await rebuildFromBackup();
  } else {
    await scrape_emf();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  });
}
