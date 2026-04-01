
/**
 * scrape_circle_knowledge_hub.js - Improved Case Studies Scraper for Circle Economy Knowledge Hub
 *
 * Features:
 *   • Pagination using _start=0,10,20... (10 cases per page)
 *   • Sorted by most popular (_sort=3) to prioritise quality
 *   • Extracts Problem, Solution, Outcome sections using regex on full_text
 *   • Corrects field swapping and filters out low‑quality entries
 *   • Backup every 5 pages (BACKUP_INTERVAL)
 *   • Recovery mode with `--use-backup`
 *   • Clear logs with `--clear-logs`
 *   • Show browser with `--show`
 *
 * Usage:
 *   node scrape_circle_knowledge_hub.js                 # normal run
 *   node scrape_circle_knowledge_hub.js --use-backup    # rebuild from backup
 *   node scrape_circle_knowledge_hub.js --clear-logs    # clear log file
 *   node scrape_circle_knowledge_hub.js --show          # open browser window
 *   node scrape_circle_knowledge_hub.js --append-processed  # append to processed CSV instead of overwriting
 *   node scrape_circle_knowledge_hub.js --append-backup     # append to backup instead of clearing on start
 */

import { fileURLToPath } from 'url';

import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

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


// Add stealth plugin to avoid detection
puppeteerExtra.use(StealthPlugin());

const DATASET_KEY = DATASET_KEYS.circle_knowledge_hub;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const BACKUP_INTERVAL = 3;
const BASE_URL = dataset.urls.base;
const LISTINGS_URL = dataset.urls.listings;
const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);
// 5274 cases / 10 per page ≈ 528 pages
const START_PAGE = 382;
const END_PAGE = 528; // Based on total cases and 10 per page, but we will also check for end of pages dynamically
const MAX_PAGES_TO_FETCH = END_PAGE - START_PAGE + 1;
const MAX_ROWS = 750; // Keep top MAX_ROWS highest-scoring cases

const APPEND_PROCESSED = hasAppendProcessedFlag();
const APPEND_BACKUP = hasAppendBackupFlag();
const backup = createBackupHelper(DATASET_KEY, BACKUP_INTERVAL, APPEND_BACKUP, MAX_PAGES_TO_FETCH);

// ============================================================================
// Helper functions for text parsing and quality scoring (improved)
// ============================================================================

/**
 * Extract a section from text using a heading pattern.
 * @param {string} text - Full text to search.
 * @param {RegExp} headingPattern - Pattern to match the heading (e.g., /PROBLEM/i).
 * @returns {string|null} Extracted section text, or null if not found.
 */
function extractSection(text, headingPattern) {
  const lines = text.split('\n');
  let inSection = false;
  let sectionLines = [];
  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for heading
    if (headingPattern.test(trimmed) && !inSection) {
      inSection = true;
      continue;
    }
    if (inSection) {
      // Stop at next heading (all caps line or line ending with colon)
      if (/^[A-Z\s]{4,}$/.test(trimmed) || trimmed.endsWith(':')) {
        break;
      }
      sectionLines.push(trimmed);
    }
  }
  if (sectionLines.length === 0) return null;
  return sectionLines.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Determine if a text is likely a company description (rather than a problem).
 */
function isCompanyDescription(text) {
  const companyKeywords = [
    'was founded',
    'is a',
    'company',
    'startup',
    'enterprise',
    'headquartered',
    'operates in',
    'mission',
    'vision',
    'since 20',
    'established in',
  ];
  const lower = text.toLowerCase();
  return companyKeywords.some((kw) => lower.includes(kw));
}

/**
 * Calculate a quality score for a case study.
 * @param {Object} data - The extracted case data (includes problem, solution, impact, etc.)
 * @returns {number} Score from 0 to 100.
 */
function scoreCaseQuality(data) {
  let score = 0;

  // Problem quality
  if (data.problem && data.problem.length > 200) score += 15;
  else if (data.problem && data.problem.length > 100) score += 10;
  else if (data.problem && data.problem.length > 50) score += 5;

  // Solution quality
  if (data.solution && data.solution.length > 300) score += 20;
  else if (data.solution && data.solution.length > 150) score += 15;
  else if (data.solution && data.solution.length > 50) score += 5;

  // Impact quality (quantified is best)
  if (data.impact) {
    if (data.impact.length > 100) score += 15;
    else if (data.impact.length > 50) score += 10;
    if (/\d+/.test(data.impact)) score += 30; // contains numbers
    if (/(%|tons|tonnes|kg|CO2|saved|reduced|diverted|investment)/i.test(data.impact)) score += 10;
  }

  // Has structured sections
  if (data._hasProblem) score += 10;
  if (data._hasSolution) score += 10;
  if (data._hasOutcome) score += 10;

  // Materials mentioned
  if (data.materials && data.materials.length > 0) {
    const materialCount = data.materials.split(',').length;
    score += Math.min(materialCount * 5, 20);
  }

  // Penalise if problem is actually a company description
  if (isCompanyDescription(data.problem || '')) score -= 30;
  if (isCompanyDescription(data.solution || '')) score -= 20;

  // Penalise "TBC" or very short content
  if (
    data.problem?.includes('TBC') ||
    data.solution?.includes('TBC') ||
    data.impact?.includes('TBC')
  ) {
    score -= 30;
  }
  if (data.problem?.length < 20 && data.solution?.length < 20 && data.impact?.length < 20) {
    score -= 40;
  }

  return Math.max(0, Math.min(score, 100));
}

/**
 * Extract data from a single case detail page (improved version).
 */
async function extractCaseData(page, url, title, type) {
  try {
    logger.info(`    Visiting detail page: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000)); // Allow dynamic content to load

    // Get full page text (including any error banners)
    const fullText = await page.$eval('body', (el) => el.innerText).catch(() => '');
    if (fullText.trim() === 'TBC' || fullText.trim().length < 50) {
      logger.info('    ‼ Page has minimal content (TBC or empty)');
      return null;
    }

    // If there's a technical error banner, remove everything before the first meaningful heading
    let cleanFullText = fullText;
    if (fullText.includes('We are experiencing technical issues')) {
      const lines = fullText.split('\n');
      const contentStart = lines.findIndex(
        (line) =>
          line.includes('PROBLEM') ||
          line.includes('SOLUTION') ||
          line.includes('OUTCOME') ||
          /^[A-Z\s]{4,}$/.test(line), // all‑caps line likely a heading
      );
      if (contentStart !== -1) {
        cleanFullText = lines.slice(contentStart).join('\n');
      }
    }

    // Extract sections using regex patterns
    let problem = extractSection(cleanFullText, /PROBLEM/i);
    let solution = extractSection(cleanFullText, /SOLUTION/i);
    let outcome = extractSection(cleanFullText, /OUTCOME|IMPACT|RESULT/i);

    const hasProblem = !!problem;
    const hasSolution = !!solution;
    const hasOutcome = !!outcome;

    // If sections missing, fall back to first paragraphs
    if (!problem && !solution && !outcome) {
      const paragraphs = cleanFullText
        .split('\n')
        .map((p) => p.trim())
        .filter((p) => p && !p.match(/^(BUSINESS|POLICY) CASE$/i) && !p.match(/^\d+\s+0$/));
      if (paragraphs.length > 0) {
        // First paragraph often describes the company – assign to problem? Better to leave empty.
        problem = paragraphs[0] || '';
        solution = paragraphs.slice(1, 3).join(' ') || '';
      }
    }

    // Ensure we have at least a problem from the title if nothing else
    if (!problem && title) problem = title;

    // --- Try to correct field swapping ---
    // If problem looks like a solution (contains action verbs) and solution looks like a problem, swap them.
    const actionVerbs = /(use|implement|adopt|create|design|develop|reduce|reuse|recycle|recover)/i;
    const challengeWords = /(waste|loss|emission|shortage|scarcity|pollution|impact)/i;
    if (problem && solution) {
      const problemIsAction = actionVerbs.test(problem) && !challengeWords.test(problem);
      const solutionIsChallenge = challengeWords.test(solution) && !actionVerbs.test(solution);
      if (problemIsAction && solutionIsChallenge) {
        [problem, solution] = [solution, problem];
        logger.info('      ↻ Swapped problem/solution based on keyword analysis');
      }
    }

    // --- Extract impact from outcome, or find a quantified sentence in fullText ---
    let impact = outcome || '';
    if (!impact) {
      // Look for a sentence containing numbers and circular‑related units
      const sentences = cleanFullText.split(/[.!?]+/);
      const quantSentence = sentences.find(
        (s) => /\d+/.test(s) && /(%|tons|tonnes|kg|CO2|saved|reduced|diverted|investment)/i.test(s),
      );
      if (quantSentence) impact = quantSentence.trim();
    }

    // --- Determine materials (simple keyword matching) ---
    const materialKeywords = [
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
    ];
    const textToSearch = (
      problem +
      ' ' +
      solution +
      ' ' +
      impact +
      ' ' +
      cleanFullText
    ).toLowerCase();
    const materialsFound = materialKeywords.filter((kw) => textToSearch.includes(kw));
    const materials = [...new Set(materialsFound)].join(', ');

    // --- Determine circular strategy based on content ---
    let strategy = 'General Circular Economy';
    if (textToSearch.includes('recycl')) strategy = 'Recycling';
    else if (textToSearch.includes('reuse')) strategy = 'Reuse';
    else if (textToSearch.includes('reduce')) strategy = 'Reduce';
    else if (textToSearch.includes('repair')) strategy = 'Repair';
    else if (textToSearch.includes('refurbish')) strategy = 'Refurbishment';
    else if (textToSearch.includes('remanufactur')) strategy = 'Remanufacturing';
    else if (textToSearch.includes('recover') || textToSearch.includes('energy'))
      strategy = 'Energy Recovery';
    else if (textToSearch.includes('design')) strategy = 'Eco-design';

    // --- Determine category from type or content ---
    let category = type || 'General';
    if (!category || category === '') {
      if (textToSearch.includes('policy') || textToSearch.includes('regulation'))
        category = 'Policy';
      else if (textToSearch.includes('business') || textToSearch.includes('company'))
        category = 'Business';
      else if (textToSearch.includes('city') || textToSearch.includes('urban'))
        category = 'City/Region';
      else if (textToSearch.includes('product')) category = 'Product';
      else category = 'Case Study';
    }

    // --- Extract location if present ---
    let location = '';
    const locationMatch = cleanFullText.match(/(?:Location|Country)[:\s]+([^\n]+)/i);
    if (locationMatch) location = locationMatch[1].trim();

    // Clean up texts
    const cleanProblem = cleanText(problem || '');
    const cleanSolution = cleanText(solution || '');
    const cleanImpact = cleanText(impact || '');
    const cleanFullTextSnippet = cleanFullText.substring(0, 5000); // limit metadata size

    // Build row data (temporary fields for scoring)
    const rowData = {
      title,
      url,
      problem: cleanProblem,
      solution: cleanSolution,
      impact: cleanImpact,
      materials,
      circular_strategy: strategy,
      category: cleanText(category),
      location: cleanText(location),
      source_url: url,
      metadata_json: JSON.stringify({
        full_text: cleanFullTextSnippet,
        has_problem: hasProblem,
        has_solution: hasSolution,
        has_outcome: hasOutcome,
        type,
        location,
        extracted_at: new Date().toISOString(),
      }),
      // Temporary scoring fields
      _qualityScore: 0,
      _materialCount: materialsFound.length,
      _hasProblem: hasProblem,
      _hasSolution: hasSolution,
      _hasOutcome: hasOutcome,
    };

    rowData._qualityScore = scoreCaseQuality(rowData);
    return rowData;
  } catch (error) {
    logger.error(`    Error extracting ${url}:`, error.message);
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

  logger.info(`Found ${backupRows.length} rows in backup`);
  await appendLogs(DATASET_KEY, `Read ${backupRows.length} backup rows.`);

  // Reconstruct each row with its flags from metadata_json, then compute quality score
  const cases = backupRows
    .map((row) => {
      try {
        // Parse metadata to retrieve flags stored during scraping
        let meta = {};
        try {
          meta = JSON.parse(row.metadata_json || '{}');
        } catch {
          // malformed JSON – ignore, flags remain false
        }

        // Enhance the row with the flags so scoreCaseQuality can use them
        const enhancedRow = {
          ...row,
          _hasProblem: meta.has_problem || false,
          _hasSolution: meta.has_solution || false,
          _hasOutcome: meta.has_outcome || false,
        };

        // Compute quality score using the enhanced row
        const qualityScore = scoreCaseQuality(enhancedRow);

        // Return the original row (without the temporary flags) plus the computed score
        return { ...row, qualityScore };
      } catch (err) {
        logger.warn('Skipping invalid row:', err.message);
        return null;
      }
    })
    .filter((c) => c && c.qualityScore > 20 && c.problem && c.problem.length > 20);

  // Sort by quality and take top MAX_ROWS
  const topCases = cases.sort((a, b) => b.qualityScore - a.qualityScore).slice(0, MAX_ROWS);

  logger.info(`Selected ${topCases.length} high‑quality cases after scoring/filtering`);
  await appendLogs(DATASET_KEY, `Selected ${topCases.length} cases after scoring/filtering.`);

  if (topCases.length === 0) {
    logger.warn('No valid cases could be reconstructed from backup.');
    await appendLogs(DATASET_KEY, `‼ No valid cases – output file unchanged.`);
    return;
  }

  // Add IDs and write final CSV (strip any remaining temporary fields)
  const finalRows = topCases.map((row, idx) => {
    const {
      _qualityScore,
      _materialCount,
      _hasProblem,
      _hasSolution,
      _hasOutcome,
      outcome,
      type,
      location,
      ...cleanRow
    } = row;
    return cleanRow;
  });

  logger.info(`✓ Rebuilt ${finalRows.length} rows from backup`);
  const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, finalRows, {
    append: APPEND_PROCESSED,
  });
  await appendLogs(
    DATASET_KEY,
    `✓ Recovery complete. Wrote ${writeResult.writtenCount} rows to ${OUTPUT_PATH} (duplicate rows removed: ${writeResult.duplicateCount})`,
  );
}

/**
 * Main scrape function (unchanged except for the use of improved extractCaseData)
 */
async function scrape() {
  await clearLogs(DATASET_KEY);
  await appendLogs(DATASET_KEY, `🚀 Scrape started...`);

  await appendLogs(DATASET_KEY, `Scraping Circle Economy Knowledge Hub cases from ${LISTINGS_URL}`);
  logger.info(`Scraping Circle Economy Knowledge Hub cases from ${LISTINGS_URL}`);
  logger.info(`Logs: ${getDatasetScrapeLogsPath(DATASET_KEY)}`);

  const browser = await puppeteerExtra.launch(getBrowserLaunchOptions());
  const page = await browser.newPage();
  await page.setViewport(getViewportOptions());
  await page.setUserAgent(getUserAgentOptions());
  await page.setExtraHTTPHeaders(getExtraHttpHeaders());

  try {
    const allRows = [];
    const pagesScraped = [];
    const FINAL_FETCH_PAGE = Math.min(END_PAGE, START_PAGE + MAX_PAGES_TO_FETCH - 1);

    for (let pageNum = START_PAGE; pageNum <= FINAL_FETCH_PAGE; pageNum++) {
      const currentStart = (pageNum - 1) * 10;
      const pageUrl = `${LISTINGS_URL}${currentStart}`;
      logger.info(`\n📄 Page ${pageNum} (start=${currentStart}) – ${pageUrl}`);
      await appendLogs(DATASET_KEY, `Loading ${pageNum}: ${pageUrl}...`);

      let retries = 3;
      let success = false;
      let caseLinks = [];

      while (retries > 0 && !success) {
        try {
          await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 });
          await new Promise((r) => setTimeout(r, 3000));

          // Wait for case links to appear
          await page.waitForSelector('a[href*="/article/"]', { timeout: 10000 });

          // Extract all case links, titles, and types
          caseLinks = await page.evaluate((baseUrl) => {
            const links = Array.from(document.querySelectorAll('a[href*="/article/"]'));
            return links.map((link) => {
              const article = link.closest('.styles__Wrapper-sc-13f21bx-0') || link;
              const typeEl = article.querySelector(
                '[class*="Contenttype"], .styles__TagText-sc-13f21bx-4',
              );
              const titleEl = article.querySelector('.styles__Title-sc-13f21bx-5');

              return {
                url: link.href.startsWith('http') ? link.href : `${baseUrl}${link.href}`,
                title: titleEl ? titleEl.innerText.trim() : link.innerText.trim(),
                type: typeEl ? typeEl.innerText.trim() : '',
              };
            });
          }, BASE_URL);

          success = true;
        } catch (err) {
          retries--;
          const msg = `  ‼ Page ${pageNum} error (retries left: ${retries}): ${err.message}`;
          logger.warn(msg);
          await appendLogs(DATASET_KEY, msg);

          if (retries === 0) {
            const skipMsg = `  ‼ Skipping page ${pageNum} after 3 failed attempts.`;
            logger.warn(skipMsg);
            await appendLogs(DATASET_KEY, skipMsg);
            break;
          } else {
            await new Promise((r) => setTimeout(r, 5000));
          }
        }
      }

      // Deduplicate and filter out the "new" article
      caseLinks = caseLinks.filter(
        (link, index, self) =>
          index === self.findIndex((l) => l.url === link.url) &&
          link.url !== `${BASE_URL}/article/new`,
      );

      if (caseLinks.length === 0) {
        await appendLogs(DATASET_KEY, `  ✓ No more cases found on page ${pageNum}.`);
        continue;
      }

      logger.info(`  Found ${caseLinks.length} case links`);
      await appendLogs(DATASET_KEY, `  Found ${caseLinks.length} cases on page ${pageNum}.`);

      const pageRows = [];

      // Process each case on the current page
      for (let i = 0; i < caseLinks.length; i++) {
        const caseItem = caseLinks[i];
        const rowData = await extractCaseData(page, caseItem.url, caseItem.title, caseItem.type);

        if (rowData) {
          pageRows.push(rowData);
          allRows.push(rowData);
          await appendLogs(
            DATASET_KEY,
            `  Added: ${caseItem.url} | score=${rowData._qualityScore}`,
          );
        } else {
          await appendLogs(DATASET_KEY, `  Skipped: ${caseItem.url} (low quality or TBC)`);
        }

        // Small delay to be polite
        await new Promise((r) => setTimeout(r, 1000));
      }

      // Backup after each page
      await backup.add(pageRows);
      pagesScraped.push(pageNum);

      if (pageNum === FINAL_FETCH_PAGE) {
        const limitMsg = `‼ Reached final fetch page (${FINAL_FETCH_PAGE}) – stopping.`;
        logger.warn(limitMsg);
        await appendLogs(DATASET_KEY, limitMsg);
        break;
      }

      // Additional delay between pages
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Final flush of backup buffer
    await backup.flush();

    logger.info(`\n📊 Total raw cases collected: ${allRows.length}`);
    await appendLogs(DATASET_KEY, `Total raw cases collected: ${allRows.length}`);

    // Filter out low-quality cases and score them
    const validRows = allRows.filter(
      (row) => row && row._qualityScore > 20 && row.problem && row.problem.length > 20,
    );

    // Sort by quality score and take top MAX_ROWS
    const topRows = validRows.sort((a, b) => b._qualityScore - a._qualityScore).slice(0, MAX_ROWS);

    logger.info(`\n📈 After scoring/filtering:`);
    logger.info(`   - Valid rows (score > 20): ${validRows.length}`);
    logger.info(`   - Keeping top ${MAX_ROWS} highest quality`);
    logger.info(`   - Best score: ${topRows[0]?._qualityScore || 0}`);
    logger.info(`   - Worst kept score: ${topRows[topRows.length - 1]?._qualityScore || 0}`);

    await appendLogs(
      DATASET_KEY,
      `After scoring: ${validRows.length} valid, keeping top ${MAX_ROWS} ` +
        `(score range: ${topRows[0]?._qualityScore || 0} - ${topRows[topRows.length - 1]?._qualityScore || 0})`,
    );

    if (topRows.length === 0) {
      logger.warn('‼ No valid cases found.');
      await appendLogs(DATASET_KEY, `‼ No valid cases found.`);
      return;
    }

    // Prepare final rows with IDs (strip temporary fields)
    const finalRows = topRows.map((row) => {
      const {
        _qualityScore,
        _materialCount,
        _hasProblem,
        _hasSolution,
        _hasOutcome,
        outcome, // remove if present
        type, // remove if present
        location, // already handled separately
        ...cleanRow
      } = row;
      return cleanRow;
    });

    const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, finalRows, {
      append: APPEND_PROCESSED,
    });

    logger.info('\n✓ Scraping complete!');
    logger.info(`   Final rows kept: ${writeResult.writtenCount}`);
    logger.info(`   Output: ${OUTPUT_PATH} (${writeResult.duplicateCount} duplicate rows removed)`);

    const firstRow = finalRows[0];
    const lastRow = finalRows[finalRows.length - 1];

    await appendLogs(
      DATASET_KEY,
      `✓ Scrape complete. Pages: ${pagesScraped.length}, total: ${allRows.length}, ` +
        `valid: ${validRows.length}, kept: ${writeResult.writtenCount} (${writeResult.duplicateCount} duplicate rows removed)`,
    );
    await appendLogs(
      DATASET_KEY,
      `   First: ${firstRow.ID} | ${firstRow.title.substring(0, 50)}...`,
    );
    await appendLogs(DATASET_KEY, `   Last:  ${lastRow.ID} | ${lastRow.title.substring(0, 50)}...`);
  } catch (error) {
    logger.error('✕ Fatal error:', error);
    await appendLogs(DATASET_KEY, `✕ Fatal error: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
    await appendLogs(DATASET_KEY, `--- End of run ---\n`);
  }
}

// Main entry point
async function main() {
  if (isBackupRecoveryMode()) {
    await rebuildFromBackup();
  } else {
    await scrape();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    logger.error('\n✕ Fatal error:', err.message);
    process.exit(1);
  });
}
