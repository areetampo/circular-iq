
import '#server/bootstrap.js';

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

import { fileURLToPath } from 'url';

import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import {
    appendLogs,
    cleanText,
    clearLogs,
    createBackupHelper,
    DATASET_KEYS,
    DATASET_LOOKUP,
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

puppeteerExtra.use(StealthPlugin());

const DATASET_KEY = DATASET_KEYS.emf;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);
const BACKUP_INTERVAL = 3;

const APPEND_PROCESSED = hasAppendProcessedFlag();
const APPEND_BACKUP = hasAppendBackupFlag();

// load more button as pagination – we will click it up to END_LOAD times, collecting items after each click
// Click range configuration – collect items only between START_LOAD and END_LOAD (inclusive)
const START_LOAD = 0; // 0 = include items before any clicks
const END_LOAD = 50; // 50 collect up to this many clicks
const MAX_LOADS_TO_FETCH = 50; // safety maximum number of clicks

// Quality threshold for triggering OpenAI refinement (0-100)
const QUALITY_THRESHOLD = 70;

// Boilerplate phrases to remove from problem/solution
const BOILERPLATE_PHRASES = [
  'This page is part of the report',
  'Explore the full report',
  'browse the entire case study collection',
  'the full report to delve',
  'the case study collection',
  'Building Prosperity: Unlocking the Potential',
];

// Phrases indicating a page is NOT a single case study (skip it)
const NON_CASE_PHRASES = [
  'curated collections of case studies',
  'case studies from around the world',
  'examples of circular economy in',
  'collection of insights on the circular economy',
  'this topic area looks at the role',
  'our impact stories',
  'annual impact report',
  'commercial collaboration: a powerful driver',
  'circular innovation city challenge',
  'united kingdom: bringing industry together',
  'the netherlands: addressing barriers',
];

// Material keywords
const MATERIAL_KEYWORDS = [
  'plastic',
  'pet',
  'paper',
  'cardboard',
  'glass',
  'metal',
  'aluminum',
  'steel',
  'textile',
  'fabric',
  'cotton',
  'polyester',
  'wood',
  'timber',
  'biomass',
  'food',
  'organic',
  'waste',
  'water',
  'energy',
  'heat',
  'steam',
  'chemical',
  'solvent',
  'oil',
  'battery',
  'electronic',
  'e-waste',
  'construction',
  'concrete',
  'cement',
  'concrete',
  'brick',
  'stone',
  'aggregate',
  'gravel',
  'sand',
  'soil',
  'compost',
  'fertiliser',
  'pesticide',
  'paint',
  'coating',
  'adhesive',
  'resin',
  'polymer',
];

// Circular strategy keywords (ordered by priority)
const STRATEGY_KEYWORDS = [
  // Reuse should be first to give it priority
  { pattern: /reuse|repurpose|second[-\s]hand|vintage|refill|deposit/i, name: 'Reuse' },
  { pattern: /recycl|recovery|downcycle/i, name: 'Recycling' },
  { pattern: /reduce|minimise|prevent|avoid/i, name: 'Reduce' },
  { pattern: /repair|fix|mend/i, name: 'Repair' },
  { pattern: /refurbish|renovate|restore|renew/i, name: 'Refurbishment' },
  { pattern: /remanufactur/i, name: 'Remanufacturing' },
  { pattern: /energy[-\s]?recovery|waste[-\s]?to[-\s]?energy|incinerat/i, name: 'Energy Recovery' },
  { pattern: /design[-\s]for|eco[-\s]design|circular[-\s]design/i, name: 'Eco-design' },
  {
    pattern: /biodegradable|compostable|bio[-\s]based|regenerative|nature[-\s]based/i,
    name: 'Biobased/Regenerative',
  },
  {
    pattern: /lease|rent|subscription|product[-\s]as[-\s]a[-\s]service|paas|pay[-\s]per[-\s]use/i,
    name: 'Product-as-a-Service',
  },
  { pattern: /modular|prefabricat|component/i, name: 'Modular Design' },
  { pattern: /durable|long[-\s]lasting|lifetime|extend/i, name: 'Durability' },
  {
    pattern: /sharing|share|pool|platform|collaborative|peer[-\s]to[-\s]peer/i,
    name: 'Sharing Economy',
  },
];

// Impact outcome verbs – used to identify true impact sentences
const IMPACT_VERBS = [
  'reduced',
  'saved',
  'diverted',
  'prevented',
  'avoided',
  'increased',
  'improved',
  'cut',
  'lowered',
  'decreased',
  'achieve',
  'resulted in',
  'led to',
];

// Create backup helper
const backup = createBackupHelper(DATASET_KEY, BACKUP_INTERVAL, !APPEND_BACKUP, MAX_LOADS_TO_FETCH);

/**
 * Remove boilerplate lines from a text.
 * @param {string} text - The text to clean.
 * @returns {string} Cleaned text.
 */
function removeBoilerplate(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const filtered = lines.filter((line) => {
    const lower = line.toLowerCase();
    return !BOILERPLATE_PHRASES.some((phrase) => lower.includes(phrase.toLowerCase()));
  });
  return filtered.join('\n').trim();
}

/**
 * Extract materials from text.
 * @param {string} text - Combined text to scan.
 * @returns {string} Comma-separated unique materials.
 */
function extractMaterials(text) {
  const lower = text.toLowerCase();
  const found = new Set();
  for (const kw of MATERIAL_KEYWORDS) {
    if (lower.includes(kw)) {
      found.add(kw);
    }
  }
  return Array.from(found).join(', ');
}

/**
 * Extract circular strategy from text.
 * @param {string} text - Combined text to scan.
 * @returns {string} Best matching strategy name (first match, prioritizing Reuse).
 */
function extractStrategy(text) {
  const lower = text.toLowerCase();
  for (const { pattern, name } of STRATEGY_KEYWORDS) {
    if (pattern.test(lower)) {
      return name;
    }
  }
  return 'General Circular Economy';
}

/**
 * Extract quantitative impact from text – look for sentences with numbers and outcome verbs,
 * preferably in the solution or benefits sections.
 * @param {string} text - Text to scan.
 * @returns {string} Best impact sentence, or empty if none.
 */
function extractImpact(text) {
  if (!text) return '';
  const sentences = text.split(/[.!?]+/);
  let best = '';
  for (const sent of sentences) {
    const trimmed = sent.trim();
    if (!trimmed) continue;
    // Must contain a number
    if (!/\d+/.test(trimmed)) continue;
    // Must contain an outcome verb or unit (tons, %, etc.)
    const hasVerb = IMPACT_VERBS.some((v) => trimmed.toLowerCase().includes(v));
    const hasUnit = /(tons?|tonnes?|kg|co2|carbon|euro|usd|\$|million|billion|%|percent)/i.test(
      trimmed,
    );
    if (hasVerb && hasUnit) {
      // If we already have a candidate, prefer shorter ones (more concise)
      if (!best || trimmed.length < best.length) {
        best = trimmed;
      }
    }
  }
  return best;
}

/**
 * Compute a quality score for the extracted data (0-100).
 */
function computeQualityScore(problem, solution, impact) {
  let score = 0;
  // Problem should be a clear statement, not too short and not containing solution words
  if (
    problem &&
    problem.length >= 30 &&
    !problem.toLowerCase().includes('joined forces') &&
    !problem.toLowerCase().includes('launched')
  ) {
    score += 30;
  } else if (problem && problem.length >= 15) {
    score += 15;
  }

  // Solution should be substantial
  if (solution && solution.length >= 150) score += 30;
  else if (solution && solution.length >= 100) score += 20;
  else if (solution && solution.length >= 50) score += 10;

  // Impact with a number and outcome verb gets high score
  if (impact && impact.length > 0 && /\d+/.test(impact)) {
    if (IMPACT_VERBS.some((v) => impact.toLowerCase().includes(v))) {
      score += 40;
    } else {
      score += 20;
    }
  } else if (impact && impact.length > 0) {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * Call OpenAI API with a given prompt and return parsed JSON.
 */
async function callOpenAI(prompt, content) {
  const apiKey = BACKEND_CONFIG.openai.apiKey;
  if (!apiKey) {
    logger.warn('‼ OpenAI API key not found – skipping AI refinement.');
    return null;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // adjust as needed
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        { role: 'user', content: content },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const contentStr = data.choices[0].message.content;
  // Extract JSON from the response (it may be wrapped in markdown code blocks)
  const jsonMatch = contentStr.match(/```json\n([\s\S]*?)\n```/) || contentStr.match(/{[\s\S]*}/);
  const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : contentStr;
  return JSON.parse(jsonStr);
}

/**
 * Extract multiple case studies from an overview page using OpenAI.
 * @param {string} text - Full page text.
 * @returns {Promise<Array>} Array of objects with keys: problem, solution, impact, circular_strategy, category.
 */
async function extractMultipleFromOverview(text) {
  const prompt = `The following text contains one or more case studies about the circular economy. Extract each distinct case study and return a JSON array of objects. Each object must have keys: "problem" (the challenge, 1-2 sentences), "solution" (the action taken, 2-3 sentences), "impact" (quantified impact if available, else empty string), "circular_strategy" (one or more of: Recycling, Reuse, Reduce, Repair, Refurbishment, Remanufacturing, Energy Recovery, Eco-design, Biobased/Regenerative, Product-as-a-Service, Modular Design, Durability, Sharing Economy), "category" (primary industry sector: Food, Fashion, Plastics, Construction, Electronics, Business Case, Urban Resilience, etc.). If no case studies are present, return an empty array.`;
  try {
    const result = await callOpenAI(prompt, text);
    if (Array.isArray(result)) {
      return result;
    } else {
      return [];
    }
  } catch {
    return [];
  }
}

/**
 * Rebuild final CSV from backup content.
 * Used when --use-backup flag is passed to script.
 */
async function rebuildFromBackup() {
  logger.info('BACKUP RECOVERY MODE: Building final CSV from saved backup content');

  try {
    await appendLogs(DATASET_KEY, `♻️ RECOVERY MODE: Rebuilding from backup started.`);

    const backupRows = await readBackupCsv(DATASET_KEY);
    if (backupRows.length === 0) {
      const msg = `‼ No backup content found. Cannot rebuild output.`;
      logger.warn(msg);
      await appendLogs(DATASET_KEY, msg);
      await appendLogs(DATASET_KEY, `\n--- End of recovery run (no data) ---\n`);
      return;
    }

    logger.info({ count: backupRows.length }, 'Processing backup rows');
    await appendLogs(DATASET_KEY, `Read ${backupRows.length} backup rows.`);

    const items = backupRows
      .map((row) => {
        try {
          const metadata = JSON.parse(row.metadata_json || '{}');
          // restore or recompute quality score
          let qualityScore = 0;
          if (row._qualityScore != null) {
            qualityScore = parseFloat(row._qualityScore);
          } else {
            qualityScore = computeQualityScore(row.problem, row.solution, row.impact);
          }
          return {
            problem: row.problem,
            solution: row.solution,
            materials: row.materials,
            circular_strategy: row.circular_strategy,
            category: row.category,
            impact: row.impact,
            source_url: row.source_url,
            metadata,
            qualityScore,
          };
        } catch (e) {
          logger.warn({ error: e.message }, 'Skipping invalid backup row');
          return null;
        }
      })
      .filter((item) => item !== null);

    if (items.length === 0) {
      logger.warn('No valid items could be reconstructed from backup.');
      await appendLogs(DATASET_KEY, `‼ No valid items – output file unchanged.`);
      await appendLogs(DATASET_KEY, `\n--- End of recovery run (no output) ---\n`);
      return;
    }

    const finalRows = items.map((item) => {
      const { qualityScore, _qualityScore, ...cleanRow } = item;
      return {
        problem: cleanText(cleanRow.problem || ''),
        solution: cleanText(cleanRow.solution || ''),
        materials: cleanText(cleanRow.materials || ''),
        circular_strategy: cleanText(cleanRow.circular_strategy || ''),
        category: cleanText(cleanRow.category || ''),
        impact: cleanText(cleanRow.impact || ''),
        source_url: cleanRow.source_url || '',
        metadata_json: JSON.stringify(cleanRow.metadata),
      };
    });

    const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, finalRows, {
      append: APPEND_PROCESSED,
    });
    logger.info(
      { written: writeResult.writtenCount, duplicates: writeResult.duplicateCount },
      'Successfully rebuilt EMF case studies from backup'
    );
    logger.info({ outputPath: OUTPUT_PATH }, 'Saved to output file');
    await appendLogs(
      DATASET_KEY,
      `✓ Recovery complete. Wrote ${writeResult.writtenCount} rows to ${OUTPUT_PATH} (${writeResult.duplicateCount} duplicate rows removed)`,
    );
    await appendLogs(DATASET_KEY, `\n--- End of recovery run ---\n`);
  } catch (error) {
    logger.error({ error: error.message }, '✕ Error rebuilding from backup');
    await appendLogs(DATASET_KEY, `✕ Recovery failed: ${error.message}`);
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
  logger.info({ logFilePath }, 'Scraping EMF');

  let browser;
  try {
    const FINAL_FETCH_LOADS = Math.min(END_LOAD, START_LOAD + MAX_LOADS_TO_FETCH);
    await appendLogs(
      DATASET_KEY,
      `🚀 Scrape started. Target: ${dataset.urls.target}, LOADS: ${START_LOAD}-${FINAL_FETCH_LOADS}, MAX_LOADS_TO_FETCH: ${MAX_LOADS_TO_FETCH}, BACKUP_INTERVAL: ${BACKUP_INTERVAL}`,
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
        const details = await fetchDetail(browser, link);
        for (const detail of details) {
          collected.push(detail.item);
          pageRows.push(detail.backupRow);
        }
      }
      if (pageRows.length > 0) {
        try {
          await backup.add(pageRows);
          await appendLogs(DATASET_KEY, `Initial load: collected ${pageRows.length} items.`);
        } catch (e) {
          const backupErr = `‼ Backup add failed for initial load: ${e.message}`;
          logger.warn(backupErr);
          await appendLogs(DATASET_KEY, backupErr);
        }
        pagesCollected.push(0);
      }
    }

    // Now click "Load More" up to END_LOAD, but no more than MAX_LOADS_TO_FETCH
    while (loadCount <= FINAL_FETCH_LOADS) {
      try {
        // Wait for the "Load More" button to appear and be visible
        const loadMoreButton = await page.$('button.ais-InfiniteHits-loadMore').catch(() => null);
        if (!loadMoreButton) {
          await appendLogs(DATASET_KEY, `  ✓ No more "Load More" button – stopping.`);
          break;
        }

        // Scroll into view and click
        await loadMoreButton.scrollIntoView();
        await loadMoreButton.click();
        loadCount++;
        await appendLogs(DATASET_KEY, `  ↳ Clicked "Load More" (${loadCount}/${END_LOAD})...`);

        // Wait for new content to load
        await new Promise((r) => setTimeout(r, 3000));

        // Get new URLs after this click
        currentUrls = await getCurrentUrls();
        const newUrls = currentUrls.filter((url) => !previousUrls.has(url));
        await appendLogs(DATASET_KEY, `     → Found ${newUrls.length} new items.`);

        // Only collect if this click is within the desired range
        if (loadCount >= START_LOAD && loadCount <= FINAL_FETCH_LOADS && newUrls.length > 0) {
          // Fetch details for each new URL
          const pageRows = [];
          for (const link of newUrls) {
            const details = await fetchDetail(browser, link);
            for (const detail of details) {
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
              const backupErr = `‼ Backup add failed for click ${loadCount}: ${e.message}`;
              logger.warn(backupErr);
              await appendLogs(DATASET_KEY, backupErr);
            }
            pagesCollected.push(loadCount);
          }
        } else {
          await appendLogs(
            DATASET_KEY,
            `     (Skipping collection – before START_LOAD or no new items)`,
          );
        }

        // Update previous URLs for next iteration
        previousUrls = new Set(currentUrls);
      } catch (e) {
        const clickErr = `  ‼ Load More click failed at count ${loadCount}: ${e.message}`;
        logger.warn(clickErr);
        await appendLogs(DATASET_KEY, clickErr);
        break;
      }
    }

    if (loadCount === FINAL_FETCH_LOADS) {
      await appendLogs(DATASET_KEY, `✓ Reached target end click count (${FINAL_FETCH_LOADS}).`);
    } else if (loadCount === MAX_LOADS_TO_FETCH) {
      const limitMsg = `‼ Reached fallback max clicks (${MAX_LOADS_TO_FETCH}) – stopping.`;
      logger.warn(limitMsg);
      await appendLogs(DATASET_KEY, limitMsg);
    }

    // Flush any remaining backup rows
    await backup.flush();

    await appendLogs(DATASET_KEY, `Total raw items collected: ${collected.length}`);

    if (collected.length === 0) {
      logger.info('✕ No items collected. Exiting.');
      await appendLogs(DATASET_KEY, `‼ No items collected.`);
      await appendLogs(DATASET_KEY, `\n--- End of run (no output) ---\n`);
      return;
    }

    // --- STEP 2: Save to CSV ---
    const finalRows = collected.map((item) => ({
      problem: item.problem,
      solution: item.solution,
      materials: item.materials,
      circular_strategy: item.circular_strategy,
      category: item.category,
      impact: item.impact,
      source_url: item.source_url,
      metadata_json: JSON.stringify(item.metadata),
    }));

    logger.info({ count: finalRows.length }, 'Scraped EMF case studies');
    const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, finalRows, {
      append: APPEND_PROCESSED,
    });
    logger.info(
      { outputPath: OUTPUT_PATH, written: writeResult.writtenCount, duplicates: writeResult.duplicateCount },
      'Saved to output file'
    );

    const firstRow = finalRows[0];
    const lastRow = finalRows[finalRows.length - 1];

    await appendLogs(
      DATASET_KEY,
      `✓ Scrape complete. Wrote ${writeResult.writtenCount} rows to ${OUTPUT_PATH} (duplicate rows removed: ${writeResult.duplicateCount}). Clicks with data: ${pagesCollected.join(', ')}.`,
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
    logger.error({ error }, '✕ Fatal error in scrape_emf');
    await appendLogs(DATASET_KEY, `✕ Fatal error: ${error.message}`);
    await appendLogs(DATASET_KEY, `\n--- Run aborted ---\n`);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Fetch detail page for a single case study link.
 * Returns an array of { item, backupRow } objects (could be empty, one, or multiple).
 */
async function fetchDetail(browser, link) {
  let detailPage;
  try {
    detailPage = await browser.newPage();
    await detailPage.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 1. Check if the page is a valid case study (not a cookie page or generic article)
    const pageText = await detailPage.evaluate(() => document.body.innerText);
    if (
      pageText.includes('We use cookies to personalise') ||
      pageText.includes('reason for this download') ||
      pageText.includes('This page is part of the report') ||
      pageText.match(/cookie|consent|download/i)
    ) {
      await appendLogs(DATASET_KEY, `⏩ Skipped (cookie/boilerplate page): ${link}`);
      return [];
    }

    // Check if the page is an overview (multiple cases)
    const lowerText = pageText.toLowerCase();
    if (NON_CASE_PHRASES.some((phrase) => lowerText.includes(phrase))) {
      await appendLogs(
        DATASET_KEY,
        `※ Overview page detected, using OpenAI to extract multiple cases: ${link}`,
      );
      const aiResults = await extractMultipleFromOverview(pageText);
      if (aiResults.length === 0) {
        await appendLogs(DATASET_KEY, `⏩ No cases extracted from overview page: ${link}`);
        return [];
      }
      // Convert each AI result to our item/backupRow format
      const results = [];
      for (let i = 0; i < aiResults.length; i++) {
        const res = aiResults[i];
        // Use title from page or a generic one
        const title = `Case study from ${link}`;
        const materials = extractMaterials(
          res.problem + ' ' + res.solution + ' ' + (res.impact || ''),
        );
        const category = res.category || 'Case Study';
        const impact = res.impact || 'EMF Verified';
        // Convert array to string if needed
        let strategy = res.circular_strategy;
        if (Array.isArray(strategy)) {
          strategy = strategy.join(', ');
        }
        const circular_strategy = strategy || 'General Circular Economy';

        const cleanedProblem = cleanText(res.problem);
        const cleanedSolution = cleanText(res.solution);

        const item = {
          problem: cleanedProblem,
          solution: cleanedSolution,
          materials: materials || 'Circular Materials',
          circular_strategy: circular_strategy,
          category: category,
          impact: impact,
          source_url: link,
          metadata: {
            title: title,
            problem: cleanedProblem,
            solution: cleanedSolution,
            fullDescription: pageText.substring(0, 3000),
            strategyLine: '',
            locationLine: '',
            orgLine: '',
            ai_extracted: true,
          },
        };

        // Compute final quality score using the cleaned values (after any AI extraction)
        const qualityScore = computeQualityScore(cleanedProblem, cleanedSolution, impact);

        const backupRow = {
          problem: item.problem,
          solution: item.solution,
          materials: item.materials,
          circular_strategy: item.circular_strategy,
          category: item.category,
          impact: item.impact,
          source_url: item.source_url,
          metadata_json: JSON.stringify(item.metadata),
          _qualityScore: qualityScore, // store score so rebuild can match original ranking
        };

        results.push({ item, backupRow });
      }
      return results;
    }

    // 2. Extract structured data from the page (normal case study)
    const data = await detailPage.evaluate(() => {
      // Get title
      const titleEl = document.querySelector('h1');
      const title = titleEl ? titleEl.innerText.trim() : 'Untitled';

      // Target the main content area (avoid navigation, footer, sidebar)
      const mainContainer = document.querySelector('.main-container, main, article');
      if (!mainContainer) return null;

      // Collect all text blocks from paragraphs and list items inside the main container,
      // but exclude the "You may also like" section and the logo section.
      const excludeSelectors = [
        '.legend-wrapper', // logo and name section
        '[class*="You may also like"]',
        'section:last-of-type', // often contains "You may also like"
      ];

      const blocks = [];
      const elements = mainContainer.querySelectorAll('p, li, h2, h3');
      for (const el of elements) {
        // Skip if the element is inside an excluded section
        let parent = el.parentElement;
        let excluded = false;
        while (parent) {
          if (excludeSelectors.some((sel) => parent.matches && parent.matches(sel))) {
            excluded = true;
            break;
          }
          parent = parent.parentElement;
        }
        if (excluded) continue;

        const text = el.innerText.trim();
        if (!text) continue;

        blocks.push({
          text,
          isHeading: el.tagName === 'H2' || el.tagName === 'H3',
        });
      }

      // Extract strategy, location, organisation lines if present (they are usually standalone paragraphs)
      let strategyLine = '',
        locationLine = '',
        orgLine = '';
      for (let block of blocks) {
        if (block.text.startsWith('Strategy:')) strategyLine = block.text;
        else if (block.text.startsWith('Location:')) locationLine = block.text;
        else if (block.text.startsWith('Organisation:')) orgLine = block.text;
      }

      // Build full description from all text blocks
      const fullDescription = blocks
        .map((b) => b.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      // --- Identify problem ---
      // Look for a paragraph containing challenge keywords, but avoid those that also contain solution words.
      const problemKeywords = [
        'challenge',
        'issue',
        'problem',
        'need',
        'waste',
        'difficult',
        'barrier',
        'crisis',
      ];
      const solutionIndicators = [
        'launched',
        'created',
        'established',
        'founded',
        'developed',
        'partnered',
        'initiative',
        'programme',
        'project',
      ];
      let problem = '';
      let solutionStartIndex = 0;

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (block.isHeading) continue;
        const lower = block.text.toLowerCase();
        const hasProblemKeyword = problemKeywords.some((kw) => lower.includes(kw));
        const hasSolutionIndicator = solutionIndicators.some((ind) => lower.includes(ind));
        // If it has a problem keyword AND does NOT have a strong solution indicator, it's a good candidate.
        if (hasProblemKeyword && !hasSolutionIndicator) {
          // Take the first sentence only
          const sentences = block.text.split(/[.!?]+/);
          problem = sentences[0].trim();
          solutionStartIndex = i + 1;
          break;
        }
      }

      // If no keyword match, use the first non‑heading paragraph as problem (but only first sentence)
      if (!problem) {
        for (let i = 0; i < blocks.length; i++) {
          if (!blocks[i].isHeading) {
            const sentences = blocks[i].text.split(/[.!?]+/);
            problem = sentences[0].trim();
            solutionStartIndex = i + 1;
            break;
          }
        }
      }

      // --- Identify solution ---
      // First, try to find a "How it works" section
      let solution = '';
      let howItWorksIndex = -1;
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (block.isHeading && block.text.toLowerCase().includes('how it works')) {
          howItWorksIndex = i + 1;
          break;
        }
      }
      if (howItWorksIndex !== -1) {
        // Take the next few paragraphs until next heading
        for (let i = howItWorksIndex; i < blocks.length; i++) {
          if (blocks[i].isHeading) break;
          solution += ' ' + blocks[i].text;
        }
        solution = solution.replace(/\s+/g, ' ').trim();
      } else {
        // Fallback: take a few paragraphs after the problem, but avoid duplicate sections
        let count = 0;
        const seen = new Set();
        for (let i = solutionStartIndex; i < blocks.length && count < 5; i++) {
          if (!blocks[i].isHeading) {
            const text = blocks[i].text;
            // Avoid duplication by checking if we've already seen this text
            if (!seen.has(text)) {
              solution += ' ' + text;
              seen.add(text);
              count++;
            }
          }
        }
        solution = solution.replace(/\s+/g, ' ').trim();
      }
      if (solution.length > 1000) solution = solution.substring(0, 1000) + '...';

      return {
        title,
        problem,
        solution,
        fullDescription,
        strategyLine,
        locationLine,
        orgLine,
      };
    });

    if (!data) {
      await appendLogs(DATASET_KEY, `⏩ Skipped (no main container): ${link}`);
      return [];
    }

    // Clean the texts
    let problem = removeBoilerplate(data.problem || '');
    let solution = removeBoilerplate(data.solution || '');

    // If problem or solution are empty, fallback to full description (split roughly)
    if (
      (!problem || problem.length < 20) &&
      (!solution || solution.length < 20) &&
      data.fullDescription
    ) {
      const desc = removeBoilerplate(data.fullDescription);
      const sentences = desc.split(/[.!?]+/);
      problem = sentences[0] || '';
      solution = sentences.slice(1, 6).join('. ') || '';
    }

    // Combine text for keyword scanning (only first 2000 chars to avoid noise)
    const combinedText = (problem + ' ' + solution + ' ' + data.fullDescription)
      .substring(0, 2000)
      .toLowerCase();

    // Extract materials, strategy, impact
    let materials = extractMaterials(combinedText);
    let circular_strategy = extractStrategy(combinedText);
    let impact = extractImpact(solution + ' ' + data.fullDescription) || '';

    // Compute quality score
    const qualityScore = computeQualityScore(problem, solution, impact);
    await appendLogs(DATASET_KEY, `Quality score for ${data.title}: ${qualityScore}`);

    // If quality is low, try OpenAI refinement with a concise prompt
    if (qualityScore < QUALITY_THRESHOLD) {
      try {
        // Use first 2000 chars of fullDescription to focus AI on key sections
        const promptText = data.fullDescription.substring(0, 2000);
        const prompt = `Extract the core problem, solution, quantified impact, circular strategy, and category from this case study text. Return a JSON object with keys "problem", "solution", "impact", "circular_strategy", "category".\n\nText:\n${promptText}`;
        const aiResult = await callOpenAI(prompt, promptText);
        if (aiResult) {
          if (
            aiResult.problem &&
            aiResult.problem.length > 20 &&
            !aiResult.problem.toLowerCase().includes('joined forces') &&
            !aiResult.problem.toLowerCase().includes('launched')
          ) {
            problem = aiResult.problem;
          }
          if (aiResult.solution && aiResult.solution.length > 50) solution = aiResult.solution;
          if (aiResult.impact) impact = aiResult.impact;
          if (aiResult.circular_strategy) {
            circular_strategy = Array.isArray(aiResult.circular_strategy)
              ? aiResult.circular_strategy.join(', ')
              : aiResult.circular_strategy;
          }
          // Optionally use AI category if it seems reliable – but we'll keep rule‑based for now
        }
      } catch (aiErr) {
        await appendLogs(DATASET_KEY, `‼ OpenAI refinement failed: ${aiErr.message}`);
      }
    }

    // Determine category (rule‑based)
    let category = 'Case Study';
    if (data.strategyLine) {
      if (data.strategyLine.includes('Maximise') || data.strategyLine.includes('green-blue'))
        category = 'Urban Resilience';
      else if (data.strategyLine.includes('Optimise') || data.strategyLine.includes('low-impact'))
        category = 'Construction';
      else if (data.strategyLine.includes('Revitalise')) category = 'Urban Regeneration';
    } else if (data.locationLine && data.locationLine.includes('Poland')) {
      category = 'Agriculture';
    } else if (data.orgLine) {
      category = 'Business Case';
    } else if (combinedText.includes('food') || combinedText.includes('agriculture')) {
      category = 'Food';
    } else if (combinedText.includes('fashion') || combinedText.includes('textile')) {
      category = 'Fashion';
    } else if (combinedText.includes('plastic') || combinedText.includes('packaging')) {
      category = 'Plastics';
    } else if (combinedText.includes('construction') || combinedText.includes('building')) {
      category = 'Built Environment';
    }

    // Final filter: problem must be substantial and not contain obvious boilerplate
    if (
      problem.length >= 30 &&
      !problem.toLowerCase().includes('you may also like') &&
      !problem.toLowerCase().includes('cookies')
    ) {
      const cleanedTitle = cleanText(data.title);
      const cleanedProblem = cleanText(problem);
      const cleanedSolution = cleanText(solution);
      const cleanedImpact = cleanText(impact);

      const item = {
        problem: cleanedProblem,
        solution: cleanedSolution,
        materials: materials || 'Circular Materials',
        circular_strategy: circular_strategy || 'General Circular Economy',
        category: category,
        impact: cleanedImpact || 'EMF Verified',
        source_url: link,
        metadata: {
          title: cleanedTitle,
          problem: cleanedProblem,
          solution: cleanedSolution,
          fullDescription: data.fullDescription,
          strategyLine: data.strategyLine,
          locationLine: data.locationLine,
          orgLine: data.orgLine,
        },
      };

      // compute final quality score after potential AI refinement above
      const qualityScore = computeQualityScore(cleanedProblem, cleanedSolution, cleanedImpact);

      const backupRow = {
        problem: item.problem,
        solution: item.solution,
        materials: item.materials,
        circular_strategy: item.circular_strategy,
        category: item.category,
        impact: item.impact,
        source_url: item.source_url,
        metadata_json: JSON.stringify(item.metadata),
        _qualityScore: qualityScore,
      };

      return [{ item, backupRow }];
    } else {
      await appendLogs(
        DATASET_KEY,
        `⏩ Skipped (problem too short or boilerplate: ${data.title.substring(0, 40)})`,
      );
      return [];
    }
  } catch (err) {
    const errMsg = `‼ Error on ${link}: ${err.message}`;
    logger.warn(errMsg);
    await appendLogs(DATASET_KEY, errMsg);
    return [];
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
    logger.error({ error: err.message }, '\n✕ Fatal error');
    process.exit(1);
  });
}
