/**
 * scrape_fashion_innovation.js - Fashion for Good Innovation Programme scraping
 *
 * Scrapes from https://www.fashionforgood.com/innovation-platform-2/innovators/
 *
 * Features:
 *   • Pagination via clicking page numbers (JavaScript-based)
 *   • Per-innovator detail extraction (description, focus area, founded year, etc.)
 *   • Quality scoring based on description length, material mentions, quantified impact
 *   • Backup every 3 pages (BACKUP_INTERVAL)
 *   • Recovery mode with `--use-backup`
 *   • Clear logs with `--clear-logs`
 *   • Show browser with `--show`
 *
 * Usage:
 *   node scrape_fashion_innovation.js                 # normal run
 *   node scrape_fashion_innovation.js --use-backup    # rebuild from backup
 *   node scrape_fashion_innovation.js --clear-logs    # clear log file
 *   node scrape_fashion_innovation.js --show          # open browser window
 *   node scrape_fashion_innovation.js --append-processed  # append to processed CSV instead of overwriting
 *   node scrape_fashion_innovation.js --append-backup     # append to backup instead of clearing on start
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
  DATASET_KEYS,
} from '#utils/datasetsUtils.js';

puppeteerExtra.use(StealthPlugin());

const DATASET_KEY = DATASET_KEYS.fashion_innovation;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const BACKUP_INTERVAL = 3;
const CLEAR_BACKUP_ON_START = true;
const LISTING_URL = dataset.urls.listing;
const BASE_URL = dataset.urls.base;
const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

// Pagination: we don't know total pages, but we set a safety maximum
const START_PAGE = 1;
const END_PAGE = 20; // As of March 2026, there are approximately 20 pages total (1..20)
const MAX_PAGES_TO_FETCH = 20; // 20
const MAX_ROWS = 200; // keep top 200 highest‑scoring innovators

const APPEND_PROCESSED = hasAppendProcessedFlag();
const APPEND_BACKUP = hasAppendBackupFlag();
const backup = createBackupHelper(
  DATASET_KEY,
  BACKUP_INTERVAL,
  CLEAR_BACKUP_ON_START && !APPEND_BACKUP,
  MAX_PAGES_TO_FETCH,
);

// Helper delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Score an innovator based on content richness and impact indicators.
 * @param {Object} data - Extracted data (includes description, materials, etc.)
 * @returns {number} Quality score 0‑100
 */
function scoreInnovatorQuality(data) {
  let score = 0;

  // Description length
  if (data.description && data.description.length > 500) score += 30;
  else if (data.description && data.description.length > 200) score += 20;
  else if (data.description && data.description.length > 50) score += 10;

  // Material mentions
  const materialCount = data.materials ? data.materials.split(',').length : 0;
  score += Math.min(materialCount * 5, 25);

  // Quantified impact (numbers, %, CO2, etc.)
  if (data.impact && /\d+/.test(data.impact)) score += 30;

  // Has additional fields (founded, stage, location) – indicates structured data
  if (data.founded) score += 5;
  if (data.stage) score += 5;
  if (data.location) score += 5;

  // Bonus for being in "End of Use" or "Processing" – these are more circular
  if (
    data.focusArea &&
    (data.focusArea.includes('End of Use') || data.focusArea.includes('Processing'))
  )
    score += 10;

  return Math.min(score, 100);
}

/**
 * Extract data from a single innovator detail page.
 * @param {Page} page - Puppeteer page object (already on detail page)
 * @param {string} url - Detail URL
 * @returns {Object|null} item and backupRow, or null on failure
 */
async function extractInnovatorData(page, url) {
  try {
    await page.waitForSelector('.innovator-page .single__intro', { timeout: 10000 });

    const data = await page.evaluate(() => {
      // --- Title ---
      const title = document.querySelector('h1.font--heading-m')?.innerText.trim() || '';

      // --- Main description (solution) ---
      const description = document.querySelector('.wysiwyg--xl p')?.innerText.trim() || '';

      // --- "Why Fashion for Good is working with..." section (problem) ---
      // Find any section whose id starts with "why-"
      const whySection =
        document.querySelector('section[id^="why-"] .wysiwyg p')?.innerText.trim() ||
        document.querySelector('section[id*="why"] .wysiwyg p')?.innerText.trim() ||
        '';

      // --- Innovator details (founded, stage, location, website) ---
      const details = {};
      document.querySelectorAll('.innovator-details li').forEach((li) => {
        const text = li.innerText.trim();
        if (text.includes('Focus Area:'))
          details.focusArea = text.replace('Focus Area:', '').trim();
        else if (text.includes('Founded in:'))
          details.founded = text.replace('Founded in:', '').trim();
        else if (text.includes('Stage:')) details.stage = text.replace('Stage:', '').trim();
        else if (text.includes('Location:'))
          details.location = text.replace('Location:', '').trim();
        else if (text.includes('Website:')) {
          const link = li.querySelector('a')?.href;
          details.website = link || '';
        }
      });

      return {
        title,
        description,
        why: whySection,
        focusArea: details.focusArea || '',
        founded: details.founded || '',
        stage: details.stage || '',
        location: details.location || '',
        website: details.website || '',
      };
    });

    if (!data.title && !data.description) return null;

    // --- Determine Problem ---
    let problem = '';
    if (data.why && data.why.length > 20) {
      problem = data.why; // Use the dedicated "why" section
    } else {
      // Fallback: look for sentences containing problem keywords
      const sentences = data.description
        .split(/[.!?]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10);
      const problemKeywords = [
        'challenge',
        'problem',
        'issue',
        'barrier',
        'difficult',
        'waste',
        'emission',
        'pollution',
        'impact',
      ];
      for (const s of sentences) {
        const lower = s.toLowerCase();
        if (problemKeywords.some((kw) => lower.includes(kw))) {
          problem = s;
          break;
        }
      }
      // If still no problem, take the first sentence
      if (!problem && sentences.length > 0) {
        problem = sentences[0];
      }
    }

    // --- Determine Solution ---
    let solution = data.description;
    // If problem was taken from the description, remove that part from solution to avoid duplication
    if (!data.why && problem && solution.includes(problem)) {
      solution = solution.replace(problem, '').trim();
      // Remove leading punctuation (.,!?) and extra spaces
      solution = solution.replace(/^[.,!?\s]+/, '').trim();
    }
    if (!solution) solution = data.description; // fallback

    // --- Extract materials ---
    const materialKeywords = [
      'plastic',
      'pet',
      'polyester',
      'nylon',
      'elastomer',
      'rubber',
      'textile',
      'fabric',
      'cotton',
      'wool',
      'silk',
      'leather',
      'cellulose',
      'biobased',
      'recycled',
      'waste',
      'dye',
      'pigment',
      'chemical',
      'solvent',
      'biopolymer',
      'foam',
      'coating',
      'adhesive',
      'elastane',
      'spandex',
      'polyurethane',
      'polymer',
    ];
    const textToSearch = (data.description + ' ' + data.why).toLowerCase();
    const foundMaterials = materialKeywords.filter((kw) => textToSearch.includes(kw));

    // --- Circular strategy (same as before) ---
    let strategy = 'General';
    const lowerDesc = textToSearch;
    if (lowerDesc.includes('recycl')) strategy = 'Recycling';
    else if (lowerDesc.includes('reuse')) strategy = 'Reuse';
    else if (lowerDesc.includes('repair')) strategy = 'Repair';
    else if (lowerDesc.includes('refurbish')) strategy = 'Refurbishment';
    else if (lowerDesc.includes('remanufactur')) strategy = 'Remanufacturing';
    else if (lowerDesc.includes('reduce') || lowerDesc.includes('eliminate')) strategy = 'Reduce';
    else if (lowerDesc.includes('design')) strategy = 'Eco‑design';

    const focusLower = (data.focusArea || '').toLowerCase();
    if (focusLower.includes('end of use')) strategy = 'End of Use';
    else if (focusLower.includes('processing')) strategy = 'Processing';
    else if (focusLower.includes('raw materials')) strategy = 'Raw Material Innovation';
    else if (focusLower.includes('manufacturing')) strategy = 'Manufacturing Innovation';

    // --- Impact (look for numbers, and ensure it's not the same as problem) ---
    let impact = '';
    const allText = data.description + ' ' + data.why;
    const sentences = allText
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);
    for (const s of sentences) {
      if (
        /\d+/.test(s) &&
        (s.includes('%') ||
          s.includes('ton') ||
          s.includes('CO2') ||
          s.includes('carbon') ||
          s.includes('reduce'))
      ) {
        // If this sentence is very similar to problem, skip it
        if (
          problem &&
          s.length > 20 &&
          (s.includes(problem.substring(0, 30)) || problem.includes(s.substring(0, 30)))
        ) {
          continue;
        }
        impact = s;
        break;
      }
    }
    if (!impact) {
      // fallback: first sentence that is not the problem
      for (const s of sentences) {
        if (problem && s !== problem && s.length > 20) {
          impact = s;
          break;
        }
      }
    }
    if (!impact && sentences.length > 0) {
      impact = sentences[0]; // last resort
    }

    // --- Clean everything ---
    const cleanedProblem = cleanText(problem);
    const cleanedSolution = cleanText(solution);
    const cleanedMaterials = foundMaterials.length ? foundMaterials.join(', ') : '';
    const cleanedImpact = cleanText(impact);
    const cleanedFocusArea = cleanText(data.focusArea);
    const cleanedFounded = cleanText(data.founded);
    const cleanedStage = cleanText(data.stage);
    const cleanedLocation = cleanText(data.location);
    const cleanedWebsite = cleanText(data.website);

    // --- Metadata ---
    const metadata = {
      title: data.title,
      description: cleanText(data.description),
      why: cleanText(data.why),
      focusArea: cleanedFocusArea,
      founded: cleanedFounded,
      stage: cleanedStage,
      location: cleanedLocation,
      website: cleanedWebsite,
      extracted_at: new Date().toISOString(),
    };

    const item = {
      problem: cleanedProblem,
      solution: cleanedSolution,
      materials: cleanedMaterials,
      circular_strategy: strategy,
      category: 'Fashion',
      impact: cleanedImpact,
      source_url: url,
      metadata,
      // temporary fields for scoring
      _descriptionLength: cleanedSolution.length,
      _hasQuantified: /\d+/.test(cleanedImpact),
      _materialCount: foundMaterials.length,
      _founded: cleanedFounded,
      _stage: cleanedStage,
      _location: cleanedLocation,
    };

    const backupRow = {
      problem: item.problem,
      solution: item.solution,
      materials: item.materials,
      circular_strategy: item.circular_strategy,
      category: item.category,
      impact: item.impact,
      source_url: item.source_url,
      metadata_json: JSON.stringify(metadata),
      _qualityScore: 0,
    };

    return { item, backupRow };
  } catch (err) {
    console.warn(`Error extracting ${url}: ${err.message}`);
    await appendLogs(DATASET_KEY, `ERROR: ${url} – ${err.message}`);
    return null;
  }
}

/**
 * Rebuild final CSV from backup (recovery mode)
 */
async function rebuildFromBackup() {
  console.log('♻️ RECOVERY MODE: Rebuilding from backup...');
  await appendLogs(DATASET_KEY, `♻️ RECOVERY MODE: Rebuilding from backup started.`);

  const backupRows = await readBackupCsv(DATASET_KEY);
  if (!backupRows || backupRows.length === 0) {
    console.warn('No backup found or backup is empty.');
    await appendLogs(DATASET_KEY, `⚠️ No backup content found. Cannot rebuild output.`);
    return;
  }

  console.log(`Found ${backupRows.length} rows in backup`);
  await appendLogs(DATASET_KEY, `Read ${backupRows.length} backup rows.`);

  // Reconstruct items from metadata_json and re‑score
  const items = backupRows
    .map((row) => {
      try {
        const metadata = JSON.parse(row.metadata_json || '{}');
        // Build a temporary object for scoring
        const tempItem = {
          description: metadata.description || '',
          materials: row.materials || '',
          impact: row.impact || '',
          founded: metadata.founded || '',
          stage: metadata.stage || '',
          location: metadata.location || '',
          focusArea: metadata.focusArea || '',
        };
        const score = scoreInnovatorQuality(tempItem);
        return {
          ...row,
          _qualityScore: score,
          metadata,
        };
      } catch (e) {
        return null;
      }
    })
    .filter((item) => item && item._qualityScore > 20 && item.problem && item.problem.length > 20);

  // Sort and take top MAX_ROWS
  const topItems = items.sort((a, b) => b._qualityScore - a._qualityScore).slice(0, MAX_ROWS);

  console.log(`Selected ${topItems.length} high‑quality innovators after scoring/filtering`);
  await appendLogs(DATASET_KEY, `Selected ${topItems.length} items after scoring/filtering.`);

  if (topItems.length === 0) {
    console.warn('No valid innovators could be reconstructed from backup.');
    await appendLogs(DATASET_KEY, `⚠️ No valid items – output file unchanged.`);
    return;
  }

  // Add IDs and write final CSV
  const finalRows = topItems.map((row, idx) => ({
    ID: formatId(DATASET_KEY, idx + 1),
    problem: row.problem,
    solution: row.solution,
    materials: row.materials,
    circular_strategy: row.circular_strategy,
    category: row.category,
    impact: row.impact,
    source_url: row.source_url,
    metadata_json: JSON.stringify(row.metadata),
  }));

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

  console.log(`Scraping Fashion for Good innovators from ${LISTING_URL}`);
  console.log(`Logs: ${getDatasetScrapeLogsPath(DATASET_KEY)}`);

  const browser = await puppeteerExtra.launch(getBrowserLaunchOptions());
  const page = await browser.newPage();
  await page.setViewport(getViewportOptions());
  await page.setUserAgent(getUserAgentOptions());
  await page.setExtraHTTPHeaders(getExtraHttpHeaders());

  try {
    await page.goto(LISTING_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    const FINAL_FETCH_PAGE = Math.min(END_PAGE, START_PAGE + MAX_PAGES_TO_FETCH - 1);
    await appendLogs(
      DATASET_KEY,
      `🚀 Scrape started. Target: ${LISTING_URL}, PAGES: ${START_PAGE}-${FINAL_FETCH_PAGE}, MAX_PAGES_TO_FETCH: ${MAX_PAGES_TO_FETCH}, BACKUP_INTERVAL: ${BACKUP_INTERVAL}, CLEAR_BACKUP_ON_START: ${CLEAR_BACKUP_ON_START}`,
    );

    let allItems = [];
    let currentPage = START_PAGE;
    let hasNextPage = true;

    while (currentPage <= FINAL_FETCH_PAGE && hasNextPage) {
      const pagesScraped = currentPage - START_PAGE + 1;
      console.log(`\n📄 Page ${currentPage} (fetch ${pagesScraped}/${MAX_PAGES_TO_FETCH})`);
      await appendLogs(DATASET_KEY, `Fetching page ${currentPage}...`);

      // Wait for tiles to appear
      await page.waitForSelector('.tile--innovator', { timeout: 10000 });

      // Get all detail links on current page
      const links = await page.evaluate((base) => {
        const tiles = Array.from(document.querySelectorAll('.tile--innovator a.tile__image'));
        return tiles.map((a) => {
          const href = a.href;
          return href.startsWith('http') ? href : base + href;
        });
      }, BASE_URL);

      const uniqueLinks = [...new Set(links)];
      console.log(`  Found ${uniqueLinks.length} innovator links`);
      await appendLogs(DATASET_KEY, `  Found ${uniqueLinks.length} links`);

      // Process each link
      const pageRows = [];
      for (let i = 0; i < uniqueLinks.length; i++) {
        const link = uniqueLinks[i];
        console.log(`    [${i + 1}/${uniqueLinks.length}] Visiting: ${link}`);
        await appendLogs(DATASET_KEY, `    Visiting: ${link}`);

        const detailPage = await browser.newPage();
        try {
          await detailPage.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await sleep(2000); // allow lazy content

          const result = await extractInnovatorData(detailPage, link);
          if (result) {
            allItems.push(result.item);
            pageRows.push(result.backupRow);
            console.log(`      → Extracted: ${result.item.problem.substring(0, 60)}...`);
          } else {
            console.log(`      → No data extracted`);
          }
        } catch (err) {
          console.warn(`      ⚠️ Error on detail page: ${err.message}`);
          await appendLogs(DATASET_KEY, `      ERROR: ${link} – ${err.message}`);
        } finally {
          await detailPage.close();
        }

        // Polite delay between details
        await sleep(1000 + Math.random() * 1000);
      }

      // Backup rows for this page
      if (pageRows.length > 0) {
        await backup.add(pageRows);
        await appendLogs(
          DATASET_KEY,
          `  Backed up ${pageRows.length} rows from page ${currentPage}`,
        );
      }

      // --- Try to go to next page ---
      // Get the current page number (for logging only)
      const currentPageNum = await page.evaluate(() => {
        const active = document.querySelector('.pagination li.active a');
        return active ? parseInt(active.getAttribute('data-page')) : null;
      });

      // Determine the next page element
      let nextLink = null;
      if (currentPageNum) {
        nextLink = await page.$(`.pagination a[data-page="${currentPageNum + 1}"]`);
      }
      if (!nextLink) {
        // fallback to arrow if it's not disabled
        nextLink = await page.$('#arrow-right:not(.disabled)');
      }

      if (!nextLink) {
        console.log(`  ⚠️ No next page found. Ending at page ${currentPage}.`);
        await appendLogs(DATASET_KEY, `  ⚠️ No next page found. Ending at page ${currentPage}.`);
        hasNextPage = false;
        break;
      }

      // Before clicking, record the current tile links to detect change
      const oldTileHrefs = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.tile--innovator a.tile__image')).map((a) => a.href),
      );

      console.log(`  Clicking to go to page ${currentPageNum ? currentPageNum + 1 : 'next'}`);
      await nextLink.click();

      // Wait for loader to appear and disappear (if loader exists)
      try {
        await page.waitForSelector('.loader', { visible: true, timeout: 2000 });
        await page.waitForSelector('.loader', { hidden: true, timeout: 10000 });
      } catch {
        // loader might not exist; proceed to tile change detection
      }

      // Wait for the tiles to change (i.e., at least one new href appears)
      try {
        await page.waitForFunction(
          (oldHrefs) => {
            const currentHrefs = Array.from(
              document.querySelectorAll('.tile--innovator a.tile__image'),
            ).map((a) => a.href);
            // Check if there's at least one href that wasn't in oldHrefs
            return currentHrefs.some((href) => !oldHrefs.includes(href));
          },
          { timeout: 15000 },
          oldTileHrefs,
        );
        console.log('  New tiles loaded successfully');
      } catch (err) {
        console.warn('  ⚠️ Timed out waiting for new tiles, but continuing...');
        // Still continue; maybe the page is the last one and no new tiles appear
      }

      await sleep(2000); // extra safety delay
      currentPage++;
    }

    // Check if we stopped due to MAX_PAGES_TO_FETCH
    if (hasNextPage && currentPage > FINAL_FETCH_PAGE) {
      console.warn(
        `⚠️ Reached MAX_PAGES_TO_FETCH limit (${MAX_PAGES_TO_FETCH}). Stopping at page ${currentPage - 1}.`,
      );
      await appendLogs(
        DATASET_KEY,
        `⚠️ Reached MAX_PAGES_TO_FETCH limit (${MAX_PAGES_TO_FETCH}). Stopping at page ${currentPage - 1}.`,
      );
    }

    // Flush backup buffer
    await backup.flush();

    console.log(`\n📊 Total raw innovators collected: ${allItems.length}`);
    await appendLogs(DATASET_KEY, `Total raw items collected: ${allItems.length}`);

    // Score all items
    const scored = allItems.map((item) => ({
      ...item,
      _qualityScore: scoreInnovatorQuality(item),
    }));

    // Filter out low‑quality (score > 20) and sort
    const valid = scored.filter((item) => item._qualityScore > 20 && item.problem.length > 20);
    valid.sort((a, b) => b._qualityScore - a._qualityScore);
    const top = valid.slice(0, MAX_ROWS);

    console.log(`  Valid (score>20): ${valid.length}`);
    console.log(`  Keeping top ${top.length} (best score: ${top[0]?._qualityScore})`);

    if (top.length === 0) {
      console.warn('⚠️ No valid innovators found.');
      await appendLogs(DATASET_KEY, `⚠️ No valid items – skipping CSV write.`);
      return;
    }

    // Prepare final rows (remove temporary fields)
    const finalRows = top.map((item, idx) => {
      const {
        _descriptionLength,
        _hasQuantified,
        _materialCount,
        _founded,
        _stage,
        _location,
        ...cleanItem
      } = item;
      return {
        ID: formatId(DATASET_KEY, idx + 1),
        ...cleanItem,
      };
    });

    await writeCsv(OUTPUT_PATH, finalRows, APPEND_PROCESSED);

    console.log('\n✅ Scraping complete!');
    console.log(`   Final rows kept: ${finalRows.length}`);
    console.log(`   Output: ${OUTPUT_PATH}`);

    const firstRow = finalRows[0];
    const lastRow = finalRows[finalRows.length - 1];
    await appendLogs(
      DATASET_KEY,
      `✅ Scrape complete. Pages: ${currentPage - 1}, total: ${allItems.length}, valid: ${valid.length}, kept: ${finalRows.length}`,
    );
    await appendLogs(
      DATASET_KEY,
      `   First: ${firstRow.ID} | ${firstRow.problem.substring(0, 50)}...`,
    );
    await appendLogs(
      DATASET_KEY,
      `   Last:  ${lastRow.ID} | ${lastRow.problem.substring(0, 50)}...`,
    );
    await appendLogs(DATASET_KEY, `--- End of run ---\n`);
  } catch (err) {
    console.error('❌ Fatal error:', err);
    await appendLogs(DATASET_KEY, `❌ Fatal error: ${err.message}`);
    throw err;
  } finally {
    await browser.close();
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
