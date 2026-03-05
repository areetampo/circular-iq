/**
 * scrape_circle_knowledge_hub.js
 *
 * Scrapes case studies from the Circle Economy Knowledge Hub.
 * Features:
 *   - Pagination using _start=0,10,20... (10 cases per page)
 *   - Sorted by most popular (_sort=3) to prioritize quality
 *   - Extracts Problem, Solution, Outcome sections where available
 *   - Falls back to full text for unstructured cases
 *   - Filters out "TBC" and empty cases
 *   - Quality scoring based on content richness and quantified impact
 *   - Backup every 5 pages (BACKUP_INTERVAL)
 *   - Recovery mode with `--use-backup`
 *   - Clear logs with `--clear-logs`
 *   - Show browser with `--show`
 *
 * Usage:
 *   node scrape_circle_knowledge_hub.js                 # normal run
 *   node scrape_circle_knowledge_hub.js --use-backup    # rebuild from backup
 *   node scrape_circle_knowledge_hub.js --clear-logs    # clear log file
 *   node scrape_circle_knowledge_hub.js --show          # open browser window
 */

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
  createBackupHelper,
  isBackupRecoveryMode,
  readBackupCsv,
  appendLogs,
  clearLogs,
  getDatasetScrapeLogsPath,
  DATASET_LOOKUP,
  DATASET_KEYS,
} from '#utils/datasetsUtils.js';

// Add stealth plugin to avoid detection
puppeteerExtra.use(StealthPlugin());

const DATASET_KEY = DATASET_KEYS.circle_knowledge_hub;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const BACKUP_INTERVAL = 3;
const CLEAR_BACKUP_ON_START = true;
const LISTINGS_URL = dataset.urls.listings;
const BASE_URL = dataset.urls.base;
const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);
// 5274 cases / 10 per page ≈ 528 pages
const START_PAGE = 1;
const END_PAGE = 528; // Based on total cases and 10 per page, but we will also check for end of pages dynamically
const MAX_PAGES_TO_FETCH = 1;
const MAX_ROWS = 500; // Keep top MAX_ROWS highest-scoring cases

const backup = createBackupHelper(
  DATASET_KEY,
  BACKUP_INTERVAL,
  CLEAR_BACKUP_ON_START,
  MAX_PAGES_TO_FETCH,
);

/**
 * Calculate a quality score for a case study.
 * @param {Object} data - The extracted case data
 * @returns {number} Score from 0 to 100
 */
function scoreCaseQuality(data) {
  let score = 0;

  // Content length (indicates substance)
  if (data.problem && data.problem.length > 200) score += 15;
  else if (data.problem && data.problem.length > 100) score += 10;
  else if (data.problem && data.problem.length > 50) score += 5;

  if (data.solution && data.solution.length > 300) score += 20;
  else if (data.solution && data.solution.length > 150) score += 15;
  else if (data.solution && data.solution.length > 50) score += 5;

  if (data.impact && data.impact.length > 100) score += 15;
  else if (data.impact && data.impact.length > 50) score += 10;

  // Quantified impact (numbers indicate measurable outcomes)
  if (data.impact && /\d+/.test(data.impact)) score += 30;

  // Has proper sections (Problem/Solution/Outcome)
  if (data._hasProblem) score += 10;
  if (data._hasSolution) score += 10;
  if (data._hasOutcome) score += 10;

  // Materials mentioned
  if (data.materials && data.materials.length > 0) {
    const materialCount = data.materials.split(',').length;
    score += Math.min(materialCount * 5, 20);
  }

  // Penalize "TBC" or very short content
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
 * Extract data from a single case detail page.
 */
async function extractCaseData(page, url, title, type) {
  try {
    console.log(`    Visiting detail page: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000)); // Allow dynamic content to load

    // Check if page has minimal content (TBC)
    const bodyText = await page.$eval('body', (el) => el.innerText).catch(() => '');
    if (bodyText.trim() === 'TBC' || bodyText.trim().length < 50) {
      console.log('    ⚠️ Page has minimal content (TBC or empty)');
      return null;
    }

    // If the page contains the technical error banner, log a warning but continue.
    if (bodyText.includes('We are experiencing technical issues')) {
      console.log('    ⚠️ Page has technical error banner – content may still be present');
    }

    // Extract structured sections if they exist
    const data = await page.evaluate(() => {
      // Try to find Problem/Solution/Outcome sections
      const sections = {};

      // Look for headings that might indicate sections
      const headings = Array.from(
        document.querySelectorAll('h1, h2, h3, h4, h5, h6, .textStyles__Header6'),
      );

      for (let i = 0; i < headings.length; i++) {
        const heading = headings[i];
        const headingText = heading.innerText.trim().toLowerCase();

        // Find content after heading until next heading
        let content = [];
        let next = heading.nextElementSibling;
        while (next && !next.matches('h1, h2, h3, h4, h5, h6, .textStyles__Header6')) {
          if (next.innerText) content.push(next.innerText.trim());
          next = next.nextElementSibling;
        }
        const sectionText = content.join(' ').trim();

        if (headingText.includes('problem')) {
          sections.problem = sectionText;
        } else if (headingText.includes('solution')) {
          sections.solution = sectionText;
        } else if (
          headingText.includes('outcome') ||
          headingText.includes('impact') ||
          headingText.includes('result')
        ) {
          sections.outcome = sectionText;
        } else if (headingText.includes('summary') && !sections.problem) {
          sections.summary = sectionText;
        }
      }

      // If no structured sections found, get all text
      if (Object.keys(sections).length === 0) {
        const article =
          document.querySelector('article') || document.querySelector('main') || document.body;
        sections.fullText = article.innerText;
      }

      // Get type/tags
      const typeEl =
        document.querySelector('[class*="Contenttype"]') ||
        document.querySelector('.textStyles__Header6:first-child');
      const caseType = typeEl ? typeEl.innerText.trim() : '';

      // Get location if available
      const locationEl = Array.from(document.querySelectorAll('*')).find(
        (el) => el.innerText?.includes('Location') || el.innerText?.includes('Country'),
      );
      let location = '';
      if (locationEl) {
        const match = locationEl.innerText.match(/(?:Location|Country)[:\s]+([^\n]+)/i);
        location = match ? match[1].trim() : '';
      }

      return {
        problem: sections.problem || sections.summary || sections.fullText?.split('\n')[0] || '',
        solution: sections.solution || sections.fullText?.split('\n').slice(1, 4).join(' ') || '',
        outcome: sections.outcome || '',
        fullText: sections.fullText || '',
        type: caseType,
        location,
        hasProblem: !!sections.problem,
        hasSolution: !!sections.solution,
        hasOutcome: !!sections.outcome,
      };
    });

    // If we got nothing meaningful, return null
    if (!data.problem && !data.solution && !data.outcome && !data.fullText) {
      return null;
    }

    // --- CLEAN FULLTEXT FROM ERROR BANNER ---
    if (data.fullText && data.fullText.includes('We are experiencing technical issues')) {
      const lines = data.fullText.split('\n');

      // Find the first line that looks like real content (contains a section heading)

      const contentStartIndex = lines.findIndex(
        (line) =>
          line.includes('PROBLEM') ||
          line.includes('SOLUTION') ||
          line.includes('OUTCOME') ||
          line.match(/^[A-Z\s]{4,}$/), // all-caps line that might be a heading
      );

      if (contentStartIndex !== -1) {
        data.fullText = lines.slice(contentStartIndex).join('\n');

        // Also reset problem/solution/outcome if they were based on the dirty fullText

        if (!data.hasProblem) data.problem = '';

        if (!data.hasSolution) data.solution = '';

        if (!data.hasOutcome) data.outcome = '';
      }
    }

    // Determine materials from text (simple keyword matching)
    const materials = [];
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
      data.problem +
      ' ' +
      data.solution +
      ' ' +
      data.outcome +
      ' ' +
      data.fullText
    ).toLowerCase();
    for (const keyword of materialKeywords) {
      if (textToSearch.includes(keyword)) {
        materials.push(keyword);
      }
    }

    // Determine circular strategy based on content
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

    // Determine category from type or content
    let category = data.type || 'General';
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

    // Clean up the texts – use cleaned fullText for fallbacks
    const problem = data.problem || data.fullText?.substring(0, 300) || title;
    const solution = data.solution || data.fullText?.substring(300, 800) || '';
    const outcome = data.outcome || '';

    // Combine outcome into impact field
    const impact =
      outcome ||
      (data.fullText?.match(/\d+%|\d+ tons|\d+ tonnes|\d+ kg|\d+ CO2/i)
        ? data.fullText
            ?.split(/[.!?]+/)
            .find((s) => /\d+%|\d+ tons|\d+ tonnes|\d+ kg|\d+ CO2/i.test(s)) || outcome
        : outcome);

    const rowData = {
      title,
      url,
      problem: cleanText(problem),
      solution: cleanText(solution),
      outcome: cleanText(outcome),
      impact: cleanText(impact),
      materials: materials.length > 0 ? [...new Set(materials)].join(', ') : '',
      circular_strategy: strategy,
      category: cleanText(category),
      location: cleanText(data.location),
      type: cleanText(data.type),
      source_url: url,
      metadata_json: JSON.stringify({
        full_text: data.fullText?.substring(0, 5000),
        has_problem: data.hasProblem,
        has_solution: data.hasSolution,
        has_outcome: data.hasOutcome,
        type: data.type,
        location: data.location,
        extracted_at: new Date().toISOString(),
      }),
      // Temporary fields for scoring/filtering
      _qualityScore: 0,
      _materialCount: materials.length,
      _hasProblem: data.hasProblem,
      _hasSolution: data.hasSolution,
      _hasOutcome: data.hasOutcome,
    };

    rowData._qualityScore = scoreCaseQuality(rowData);
    return rowData;
  } catch (error) {
    console.error(`    Error extracting ${url}:`, error.message);
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
        // Use stored quality score or recompute
        let qualityScore = row._qualityScore ? parseFloat(row._qualityScore) : 0;
        if (qualityScore === 0) {
          qualityScore = scoreCaseQuality(row);
        }
        return { ...row, qualityScore };
      } catch (e) {
        return null;
      }
    })
    .filter((c) => c && c.qualityScore > 20 && c.problem && c.problem.length > 20);

  // Sort by quality and take top MAX_ROWS
  const topCases = cases.sort((a, b) => b.qualityScore - a.qualityScore).slice(0, MAX_ROWS);

  console.log(`Selected ${topCases.length} high-quality cases after scoring/filtering`);
  await appendLogs(DATASET_KEY, `Selected ${topCases.length} cases after scoring/filtering.`);

  if (topCases.length === 0) {
    console.warn('No valid cases could be reconstructed from backup.');
    await appendLogs(DATASET_KEY, `⚠️ No valid cases – output file unchanged.`);
    return;
  }

  // Add IDs and write final CSV (strip temporary fields)
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
    return {
      ID: formatId(DATASET_KEY, idx + 1),
      ...cleanRow,
    };
  });

  await writeCsv(OUTPUT_PATH, finalRows);
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

  await appendLogs(DATASET_KEY, `Scraping Circle Economy Knowledge Hub cases from ${LISTINGS_URL}`);
  console.log(`Scraping Circle Economy Knowledge Hub cases from ${LISTINGS_URL}`);
  console.log(`Logs: ${getDatasetScrapeLogsPath(DATASET_KEY)}`);

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
      const pageUrl = `${LISTINGS_URL}&_start=${currentStart}`;
      console.log(`\n📄 Page ${pageNum} (start=${currentStart}) – ${pageUrl}`);
      await appendLogs(DATASET_KEY, `Loading ${pageUrl}...`);

      let retries = 3;
      let success = false;
      let caseLinks = [];

      while (retries > 0 && !success) {
        try {
          await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 });
          await new Promise((r) => setTimeout(r, 3000));

          // Wait for case links to appear
          await page.waitForSelector('a[href*="/article/"]', { timeout: 10000 });

          // Extract all case links, titles, and types from the listing page
          caseLinks = await page.evaluate((baseUrl) => {
            const links = Array.from(document.querySelectorAll('a[href*="/article/"]'));
            return links
              .map((link) => {
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
              })
              .filter((c) => c.url && c.title);
          }, BASE_URL);

          caseLinks = caseLinks.filter(
            (link, index, self) =>
              // 1. Keep only the first occurrence of each URL (Deduplicate)
              index === self.findIndex((l) => l.url === link.url) &&
              // 2. Exclude the specific "new" article URL
              link.url !== `${BASE_URL}/article/new`,
          );

          if (caseLinks.length === 0) {
            await appendLogs(DATASET_KEY, `  ✓ No more cases found on page ${pageNum}.`);
            break;
          }

          console.log(`  Found ${caseLinks.length} case links`);
          await appendLogs(DATASET_KEY, `  Found ${caseLinks.length} cases on page`);

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
            await new Promise((r) => setTimeout(r, 5000));
          }
        }
      }

      if (!caseLinks || caseLinks.length === 0) break;

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
        const limitMsg = `⚠️ Reached final fetch page (${FINAL_FETCH_PAGE}) – stopping.`;
        console.warn(limitMsg);
        await appendLogs(DATASET_KEY, limitMsg);
        break;
      }

      // Additional delay between pages
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Final flush of backup buffer
    await backup.flush();

    console.log(`\n📊 Total raw cases collected: ${allRows.length}`);
    await appendLogs(DATASET_KEY, `Total raw cases collected: ${allRows.length}`);

    // Filter out low-quality cases and score them
    const validRows = allRows.filter(
      (row) => row && row._qualityScore > 20 && row.problem && row.problem.length > 20,
    );

    // Sort by quality score and take top MAX_ROWS
    const topRows = validRows.sort((a, b) => b._qualityScore - a._qualityScore).slice(0, MAX_ROWS);

    console.log(`\n📈 After scoring/filtering:`);
    console.log(`   - Valid rows (score > 20): ${validRows.length}`);
    console.log(`   - Keeping top ${MAX_ROWS} highest quality`);
    console.log(`   - Best score: ${topRows[0]?._qualityScore || 0}`);
    console.log(`   - Worst kept score: ${topRows[topRows.length - 1]?._qualityScore || 0}`);

    await appendLogs(
      DATASET_KEY,
      `After scoring: ${validRows.length} valid, keeping top ${MAX_ROWS} (score range: ${topRows[0]?._qualityScore || 0} - ${topRows[topRows.length - 1]?._qualityScore || 0})`,
    );

    if (topRows.length === 0) {
      console.warn('⚠️ No valid cases found.');
      await appendLogs(DATASET_KEY, `⚠️ No valid cases found.`);
      return;
    }

    // Prepare final rows with IDs (strip temporary fields)
    const finalRows = topRows.map((row, idx) => {
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
      return {
        ID: formatId(DATASET_KEY, idx + 1),
        ...cleanRow,
      };
    });

    await writeCsv(OUTPUT_PATH, finalRows);

    console.log('\n✅ Scraping complete!');
    console.log(`   Final rows kept: ${finalRows.length}`);
    console.log(`   Output: ${OUTPUT_PATH}`);

    const firstRow = finalRows[0];
    const lastRow = finalRows[finalRows.length - 1];

    await appendLogs(
      DATASET_KEY,
      `✅ Scrape complete. Pages: ${pagesScraped.length}, total: ${allRows.length}, valid: ${validRows.length}, kept: ${finalRows.length}`,
    );
    await appendLogs(
      DATASET_KEY,
      `   First: ${firstRow.ID} | ${firstRow.title.substring(0, 50)}...`,
    );
    await appendLogs(DATASET_KEY, `   Last:  ${lastRow.ID} | ${lastRow.title.substring(0, 50)}...`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    await appendLogs(DATASET_KEY, `❌ Fatal error: ${error.message}`);
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
