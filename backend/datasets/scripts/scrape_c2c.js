/**
 * scrape_c2c.js
 *
 * Scrapes Cradle-to-Cradle (C2C) certified products from the official registry.
 * Uses Puppeteer with stealth plugin to avoid detection.
 * Features:
 *   - Pagination handling with retry logic
 *   - Per-product detail extraction (company, title, certifications, category)
 *   - Quality scoring based on certification levels (Gold/Silver/Bronze)
 *   - Backup system: incremental page‑level backup, final flush, and recovery mode
 *   - Detailed logging to dataset‑specific log file
 *
 * Usage:
 *   node scrape_c2c.js                 # normal run
 *   node scrape_c2c.js --use-backup    # rebuild final CSV from backup
 *   node scrape_c2c.js --clear-logs    # clear the log file before starting
 *
 * For detailed logs, see the path printed at the start of the run.
 */

import puppeteerExtra from 'puppeteer-extra';
import { fileURLToPath } from 'url';
import {
  formatId,
  cleanText,
  getDatasetProcessedCsvPath,
  getBrowserLaunchOptions,
  getViewportOptions,
  getUserAgentOptions,
  getExtraHttpHeaders,
  DATASET_LOOKUP,
  DATASET_KEYS,
  writeCsv,
  hasAppendFlag,
  createBackupHelper,
  isBackupRecoveryMode,
  readBackupCsv,
  appendLogs,
  clearLogs,
  getDatasetScrapeLogsPath,
} from '#utils/datasetsUtils.js';

const DATASET_KEY = DATASET_KEYS.c2c;
const BACKUP_INTERVAL = 3;
const CLEAR_BACKUP_ON_START = true;

const dataset = DATASET_LOOKUP[DATASET_KEY];
const TARGET_URL = dataset.urls.homepage;
const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);
const START_PAGE = 1;
const END_PAGE = 56; // As of Feb 2026, there are 56 pages total (1..56)
const MAX_PAGES_TO_FETCH = 56; // 56
const MAX_ROWS = 450;

const APPEND = hasAppendFlag();
const backup = createBackupHelper(
  DATASET_KEY,
  BACKUP_INTERVAL,
  CLEAR_BACKUP_ON_START,
  MAX_PAGES_TO_FETCH,
);

/**
 * Calculate a quality score for a product based on its certification levels.
 * @param {Object} certifications - Certification categories and their levels.
 * @returns {number} Score from 0 to 100.
 */
function scoreProductQuality(certifications) {
  let score = 0;
  Object.values(certifications).forEach((level) => {
    const levelStr = String(level).toLowerCase();
    if (levelStr.includes('gold')) score += 30;
    else if (levelStr.includes('silver')) score += 20;
    else if (levelStr.includes('bronze')) score += 5;
  });
  if (certifications['Circularity']) score += 20;
  return Math.min(score, 100);
}

/**
 * Rebuild final CSV from backup content.
 * Used when --use-backup flag is passed.
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

    const productDetails = backupRows
      .map((row) => {
        try {
          const metadata = JSON.parse(row.metadata_json || '{}');
          const certifications = metadata.certifications || {};
          return {
            link: row.source_url,
            title: metadata.title || '',
            company: metadata.company || 'C2C Certified',
            category: row.category,
            certifications,
            qualityScore: scoreProductQuality(certifications),
            certCount: Object.keys(certifications).length,
          };
        } catch (e) {
          console.warn(`⚠️ Skipping invalid backup row: ${e.message}`);
          return null;
        }
      })
      .filter((p) => p && p.qualityScore > 0)
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, MAX_ROWS);

    console.log(`✅ Selected ${productDetails.length} high-quality C2C products from backup`);
    await appendLogs(
      DATASET_KEY,
      `Selected ${productDetails.length} products after scoring/filtering.`,
    );

    if (productDetails.length === 0) {
      console.warn(`⚠️ No valid product details could be reconstructed from backup.`);
      await appendLogs(DATASET_KEY, `⚠️ No valid products – output file unchanged.`);
      await appendLogs(DATASET_KEY, `\n--- End of recovery run (no output) ---\n`);
      return;
    }

    const finalRows = productDetails.map((product, index) => {
      const rawExtracted = {
        link: product.link,
        company: product.company,
        title: product.title,
        certifications: product.certifications,
        category: product.category,
        qualityScore: product.qualityScore,
        certCount: product.certCount,
      };
      const metadata = {
        company: product.company,
        title: product.title,
        certifications: product.certifications,
        certCount: product.certCount,
        raw_extracted: rawExtracted,
      };
      return {
        ID: formatId(DATASET_KEY, index + 1),
        problem: cleanText(`Circular economy solutions - ${product.title}`),
        solution: cleanText(
          `${product.title} - Cradle-to-Cradle certified. Category: ${product.category}`,
        ),
        materials: cleanText('Cradle-to-Cradle Certified Materials'),
        circular_strategy: cleanText(
          `C2C ${Object.keys(product.certifications).join(' + ')} (${Object.values(product.certifications).join(', ')})`,
        ),
        category: product.category,
        impact: cleanText(`Score: ${product.qualityScore}/100 | ${product.certCount} cert types`),
        source_url: product.link,
        metadata_json: JSON.stringify(metadata),
      };
    });

    await writeCsv(OUTPUT_PATH, finalRows, APPEND);
    console.log(`\n✨ Successfully rebuilt ${finalRows.length} C2C products from backup`);
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

/**
 * Main scraping function.
 * Iterates through pages, extracts product details, scores them, and saves the best.
 */
async function scrape_c2c() {
  await clearLogs(DATASET_KEY);

  if (isBackupRecoveryMode()) {
    await rebuildFromBackup();
    return;
  }

  const logFilePath = getDatasetScrapeLogsPath(DATASET_KEY);
  console.log(`Scraping C2C. Detailed logs: ${logFilePath}`);

  let browser;
  try {
    const FINAL_FETCH_PAGE = Math.min(END_PAGE, START_PAGE + MAX_PAGES_TO_FETCH - 1);
    await appendLogs(
      DATASET_KEY,
      `🚀 Scrape started. Target: ${TARGET_URL}, PAGES: ${START_PAGE}-${FINAL_FETCH_PAGE}, MAX_PAGES_TO_FETCH: ${MAX_PAGES_TO_FETCH}, BACKUP_INTERVAL: ${BACKUP_INTERVAL}, CLEAR_BACKUP_ON_START: ${CLEAR_BACKUP_ON_START}`,
    );

    browser = await puppeteerExtra.launch(getBrowserLaunchOptions());
    const page = await browser.newPage();
    await page.setViewport(getViewportOptions());
    await page.setUserAgent(getUserAgentOptions());
    await page.setExtraHTTPHeaders(getExtraHttpHeaders());

    const productDetails = [];
    const pagesScraped = [];

    for (let pageNum = START_PAGE; pageNum <= FINAL_FETCH_PAGE; pageNum++) {
      let retries = 3;
      let success = false;
      let pageLinks = [];

      while (retries > 0 && !success) {
        try {
          const pageUrl =
            pageNum === 1
              ? TARGET_URL
              : `${TARGET_URL}?certified_products_by_date_asc[page]=${pageNum}`;

          await appendLogs(DATASET_KEY, `Loading page ${pageNum}...`);
          await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 20000 });
          await new Promise((r) => setTimeout(r, 2500));
          await page.waitForSelector('a[href*="/certified-products/"]', { timeout: 5000 });

          pageLinks = await page.$$eval('a[href*="/certified-products/"]', (links) =>
            links
              .map((a) => a.href)
              .filter((href) => href && href.includes('/certified-products/'))
              .map((href) => href.split('?')[0]),
          );
          pageLinks = [...new Set(pageLinks)];

          if (pageLinks.length === 0) {
            await appendLogs(DATASET_KEY, `  ✓ No more products found on page ${pageNum}.`);
            break;
          }

          await appendLogs(
            DATASET_KEY,
            `  ✓ Found ${pageLinks.length} products on page ${pageNum}`,
          );
          success = true;
        } catch (err) {
          retries--;
          const msg = `  ⚠️ Page ${pageNum} error (retries left: ${retries}): ${err.message}`;
          await appendLogs(DATASET_KEY, msg);
          if (retries === 0) {
            const skipMsg = `  ⚠️ Skipping page ${pageNum} after 3 failed attempts.`;
            await appendLogs(DATASET_KEY, skipMsg);
            break;
          } else {
            await new Promise((r) => setTimeout(r, 5000));
          }
        }
      }

      if (!pageLinks || pageLinks.length === 0) break;

      const pageRows = [];
      for (const link of pageLinks) {
        let detailPage;
        let detailRetries = 2;
        let detailSuccess = false;

        while (detailRetries > 0 && !detailSuccess) {
          try {
            detailPage = await browser.newPage();
            await detailPage.goto(link, { waitUntil: 'domcontentloaded', timeout: 12000 });
            await new Promise((r) => setTimeout(r, 1500));

            const data = await detailPage.evaluate(() => {
              const company =
                document
                  .querySelector('[class*="supplier"], [class*="company"]')
                  ?.innerText?.trim() || '';
              const title = document.querySelector('h1')?.innerText?.trim() || '';

              const certifications = {};
              document.querySelectorAll('*').forEach((el) => {
                const text = (
                  el.innerText ||
                  el.textContent ||
                  el.getAttribute('aria-label') ||
                  ''
                ).trim();
                const className = el.className || '';
                const lookIn = String(text ?? className).toLowerCase();
                if (lookIn.includes('full') && lookIn.includes('scope')) {
                  if (lookIn.includes('gold')) certifications['Full Scope'] = 'Gold';
                  else if (lookIn.includes('silver')) certifications['Full Scope'] = 'Silver';
                  else if (lookIn.includes('bronze')) certifications['Full Scope'] = 'Bronze';
                  else certifications['Full Scope'] = 'Certified';
                }
                if (lookIn.includes('material') && lookIn.includes('health')) {
                  if (lookIn.includes('gold')) certifications['Material Health'] = 'Gold';
                  else if (lookIn.includes('silver')) certifications['Material Health'] = 'Silver';
                  else if (lookIn.includes('bronze')) certifications['Material Health'] = 'Bronze';
                  else certifications['Material Health'] = 'Certified';
                }
                if (lookIn.includes('circularity')) {
                  if (lookIn.includes('gold')) certifications['Circularity'] = 'Gold';
                  else if (lookIn.includes('silver')) certifications['Circularity'] = 'Silver';
                  else if (lookIn.includes('bronze')) certifications['Circularity'] = 'Bronze';
                  else certifications['Circularity'] = 'Certified';
                }
              });

              const category =
                document
                  .querySelector('.breadcrumb li:last-child, [class*="category"]')
                  ?.innerText?.trim() || 'General';
              return {
                company: company || 'Unknown',
                title: title || 'Unknown Product',
                certifications:
                  Object.keys(certifications).length > 0
                    ? certifications
                    : { 'C2C Certified': 'General' },
                category,
              };
            });

            const cleanedCompany = cleanText(data.company);
            const cleanedTitle = cleanText(data.title);
            const cleanedCategory = cleanText(data.category);

            const detail = {
              link,
              company: cleanedCompany,
              title: cleanedTitle,
              certifications: data.certifications,
              category: cleanedCategory,
              qualityScore: scoreProductQuality(data.certifications),
              certCount: Object.keys(data.certifications).length,
            };
            productDetails.push(detail);

            const metadata = {
              company: cleanedCompany,
              title: cleanedTitle,
              certifications: data.certifications,
              certCount: detail.certCount,
            };

            pageRows.push({
              problem: `Circular economy solutions - ${cleanedTitle}`,
              solution: `${cleanedTitle} - Cradle-to-Cradle certified. Category: ${cleanedCategory}`,
              materials: 'Cradle-to-Cradle Certified Materials',
              circular_strategy: `C2C ${Object.keys(data.certifications).join(' + ')} (${Object.values(data.certifications).join(', ')})`,
              category: cleanedCategory,
              impact: `Score: ${detail.qualityScore}/100 | ${detail.certCount} cert types`,
              source_url: detail.link,
              metadata_json: JSON.stringify(metadata),
            });

            detailSuccess = true;
          } catch (err) {
            detailRetries--;
            const errMsg = `⚠️ Error processing product at ${link} (retries left: ${detailRetries}): ${err.message}`;
            console.warn(errMsg);
            await appendLogs(DATASET_KEY, errMsg);
            if (detailRetries === 0) {
              const skipMsg = ` ⚠️ Skipping product after 2 failed attempts.`;
              console.warn(skipMsg);
              await appendLogs(DATASET_KEY, skipMsg);
            } else {
              await new Promise((r) => setTimeout(r, 3000));
            }
          } finally {
            if (detailPage) await detailPage.close();
          }
        }
        await new Promise((r) => setTimeout(r, 300));
      }

      try {
        await backup.add(pageRows);
        await appendLogs(
          DATASET_KEY,
          `Page ${pageNum}: found ${pageLinks.length} links, processed ${pageRows.length} products.`,
        );
      } catch (e) {
        const backupErr = `⚠️ Backup add failed for page ${pageNum}: ${e.message}`;
        console.warn(backupErr);
        await appendLogs(DATASET_KEY, backupErr);
      }

      pagesScraped.push(pageNum);

      if (pageNum === FINAL_FETCH_PAGE) {
        const limitMsg = `⚠️ Reached final fetch page (${FINAL_FETCH_PAGE}) – stopping.`;
        console.warn(limitMsg);
        await appendLogs(DATASET_KEY, limitMsg);
        break;
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    await appendLogs(DATASET_KEY, `Total raw products collected: ${productDetails.length}`);

    const sortedProducts = productDetails
      .filter((p) => p.qualityScore > 0)
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, MAX_ROWS);

    await appendLogs(
      DATASET_KEY,
      `After filtering and scoring: ${sortedProducts.length} products kept.`,
    );

    if (sortedProducts.length > 0) {
      const finalRows = sortedProducts.map((product, index) => {
        const metadata = {
          company: product.company,
          title: product.title,
          certifications: product.certifications,
          certCount: product.certCount,
          raw_extracted: { ...product },
        };
        return {
          ID: formatId(DATASET_KEY, index + 1),
          problem: cleanText(`Circular economy solutions - ${product.title}`),
          solution: cleanText(
            `${product.title} - Cradle-to-Cradle certified. Category: ${product.category}`,
          ),
          materials: cleanText('Cradle-to-Cradle Certified Materials'),
          circular_strategy: cleanText(
            `C2C ${Object.keys(product.certifications).join(' + ')} (${Object.values(product.certifications).join(', ')})`,
          ),
          category: product.category,
          impact: cleanText(`Score: ${product.qualityScore}/100 | ${product.certCount} cert types`),
          source_url: product.link,
          metadata_json: JSON.stringify(metadata),
        };
      });

      await writeCsv(OUTPUT_PATH, finalRows, APPEND);
      await backup.flush();

      console.log(`\n✅ Scraped ${finalRows.length} C2C products.`);
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
    } else {
      console.warn('⚠️ No products with quality score > 0 were extracted.');
      await appendLogs(DATASET_KEY, `⚠️ No products with quality score > 0 extracted.`);
      await appendLogs(DATASET_KEY, `\n--- End of run (no output) ---\n`);
    }
  } catch (error) {
    console.error('❌ Fatal error in scrape_c2c:', error);
    await appendLogs(DATASET_KEY, `❌ Fatal error: ${error.message}`);
    await appendLogs(DATASET_KEY, `\n--- Run aborted ---\n`);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

// Main entry point: handles both normal and recovery modes
async function main() {
  if (isBackupRecoveryMode()) {
    await rebuildFromBackup();
  } else {
    await scrape_c2c();
  }
}

// Self‑execution when run directly
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
