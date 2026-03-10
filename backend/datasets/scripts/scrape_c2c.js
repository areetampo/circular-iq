/**
 * scrape_c2c.js – Cradle-to-Cradle (C2C) certified products scraper
 *
 * Scrapes from https://c2ccertified.org/certified-products
 * Features:
 *   - Pagination handling with retry logic and fallback selectors
 *   - Per-product detail extraction (company, title, certifications, category)
 *   - Quality scoring based on certification levels (Gold/Silver/Bronze)
 *   - Backup system: incremental page‑level backup, final flush, and recovery mode
 *   - Detailed logging to dataset‑specific log file
 *   - Stealth plugin to avoid detection
 *
 * Usage:
 *   node scrape_c2c.js                 # normal run
 *   node scrape_c2c.js --use-backup    # rebuild final CSV from backup
 *   node scrape_c2c.js --clear-logs    # clear the log file before starting
 *   node scrape_c2c.js --append-processed  # append to processed CSV instead of overwriting
 *   node scrape_c2c.js --append-backup     # append to backup instead of clearing on start
 *
 * For detailed logs, see the path printed at the start of the run.
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
  DATASET_LOOKUP,
  DATASET_KEYS,
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

const DATASET_KEY = DATASET_KEYS.c2c;
const BACKUP_INTERVAL = 3;

const dataset = DATASET_LOOKUP[DATASET_KEY];
if (!dataset || !dataset.urls || !dataset.urls.listing) {
  throw new Error(`Dataset '${DATASET_KEY}' missing required 'urls.listing' in registry.`);
}

const TARGET_URL = dataset.urls.listing; // e.g., https://c2ccertified.org/certified-products
const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);
const START_PAGE = 1;
const END_PAGE = 56; // As of Feb 2026, there are 56 pages total (1..56)
const MAX_PAGES_TO_FETCH = 56;
const MAX_ROWS = 400;

const APPEND_PROCESSED = hasAppendProcessedFlag();
const APPEND_BACKUP = hasAppendBackupFlag();
const backup = createBackupHelper(DATASET_KEY, BACKUP_INTERVAL, !APPEND_BACKUP, MAX_PAGES_TO_FETCH);

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
  if (certifications['Circularity']) score += 20; // bonus for circularity certification
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

    // Deduplicate backup rows by source_url
    const uniqueMap = new Map();
    for (const row of backupRows) {
      if (!uniqueMap.has(row.source_url)) {
        uniqueMap.set(row.source_url, row);
      }
    }
    const uniqueBackupRows = Array.from(uniqueMap.values());
    console.log(`   → ${uniqueBackupRows.length} unique rows after deduplication.`);

    const productDetails = uniqueBackupRows
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

    await writeCsv(OUTPUT_PATH, finalRows, APPEND_PROCESSED);
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
    const FINAL_PAGE = Math.min(END_PAGE, START_PAGE + MAX_PAGES_TO_FETCH - 1);
    await appendLogs(
      DATASET_KEY,
      `🚀 Scrape started. Target: ${TARGET_URL}, PAGES: 1-${FINAL_PAGE}, MAX_ROWS: ${MAX_ROWS}`,
    );

    browser = await puppeteerExtra.launch(getBrowserLaunchOptions());
    const page = await browser.newPage();
    await page.setViewport(getViewportOptions());
    await page.setUserAgent(getUserAgentOptions());
    await page.setExtraHTTPHeaders(getExtraHttpHeaders());

    // 1. Load the initial page
    await appendLogs(DATASET_KEY, `Loading initial page: ${TARGET_URL}`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // 2. Handle cookie consent (if present)
    try {
      await page.waitForSelector('button:has-text("Accept"), button:has-text("Agree")', {
        timeout: 5000,
      });
      await page.click('button:has-text("Accept")');
      await appendLogs(DATASET_KEY, '✅ Accepted cookies.');
      await new Promise((r) => setTimeout(r, 1000));
    } catch {
      await appendLogs(DATASET_KEY, 'ℹ️ No cookie consent overlay found.');
    }

    // 3. Wait for the first product links to appear
    await page.waitForSelector('a[href*="/certified-products/"]', { timeout: 10000 });

    // 4. Prepare collections
    const productMap = new Map(); // unique products by URL
    const pagesScraped = [];

    // 5. Loop through pages by clicking "Next"
    for (let pageNum = 1; pageNum <= FINAL_PAGE; pageNum++) {
      await appendLogs(DATASET_KEY, `\n--- Processing page ${pageNum} ---`);

      // Extract product links from the current page
      let pageLinks = await page.$$eval('a[href*="/certified-products/"]', (links) =>
        links
          .map((a) => a.href)
          .filter((href) => href && href.includes('/certified-products/'))
          .map((href) => href.split('?')[0]),
      );
      pageLinks = [...new Set(pageLinks)];

      await appendLogs(DATASET_KEY, `Found ${pageLinks.length} products on page ${pageNum}`);

      if (pageLinks.length === 0) {
        await appendLogs(DATASET_KEY, `⚠️ No products found on page ${pageNum} – stopping.`);
        break;
      }

      // Process each product link
      const pageRows = [];
      for (const link of pageLinks) {
        if (productMap.has(link)) {
          await appendLogs(DATASET_KEY, `  ⏩ Skipping duplicate: ${link}`);
          continue;
        }

        let detailPage;
        let detailRetries = 2;
        let detailSuccess = false;

        while (detailRetries > 0 && !detailSuccess) {
          try {
            detailPage = await browser.newPage();
            await detailPage.goto(link, { waitUntil: 'domcontentloaded', timeout: 12000 });
            await new Promise((r) => setTimeout(r, 1500));

            // Improved certification extraction – target specific containers
            const data = await detailPage.evaluate(() => {
              const company =
                document
                  .querySelector('[class*="supplier"], [class*="company"], .product-company')
                  ?.innerText?.trim() || '';
              const title = document.querySelector('h1')?.innerText?.trim() || '';

              const certifications = {};

              // Look inside elements that are likely to hold certification badges
              const badgeContainers = document.querySelectorAll(
                '.badge, .certification-level, [class*="certification"], .product-certifications li',
              );
              badgeContainers.forEach((el) => {
                const text = el.innerText || el.textContent || '';
                const lower = text.toLowerCase();
                // Determine certification type from context or nearby heading
                const parentText = el.closest('div, section, li')?.innerText?.toLowerCase() || '';
                let type = 'General';
                if (parentText.includes('full scope') || text.includes('Full Scope'))
                  type = 'Full Scope';
                else if (parentText.includes('material health') || text.includes('Material Health'))
                  type = 'Material Health';
                else if (parentText.includes('circularity') || text.includes('Circularity'))
                  type = 'Circularity';

                if (lower.includes('gold')) certifications[type] = 'Gold';
                else if (lower.includes('silver')) certifications[type] = 'Silver';
                else if (lower.includes('bronze')) certifications[type] = 'Bronze';
                else certifications[type] = 'Certified';
              });

              // Fallback: scan the whole page for certification patterns
              if (Object.keys(certifications).length === 0) {
                const bodyText = document.body.innerText;
                const lines = bodyText.split('\n');
                for (const line of lines) {
                  const lower = line.toLowerCase();
                  if (lower.includes('full scope') && lower.includes('gold'))
                    certifications['Full Scope'] = 'Gold';
                  else if (lower.includes('full scope') && lower.includes('silver'))
                    certifications['Full Scope'] = 'Silver';
                  else if (lower.includes('full scope') && lower.includes('bronze'))
                    certifications['Full Scope'] = 'Bronze';
                  else if (lower.includes('material health') && lower.includes('gold'))
                    certifications['Material Health'] = 'Gold';
                  else if (lower.includes('material health') && lower.includes('silver'))
                    certifications['Material Health'] = 'Silver';
                  else if (lower.includes('material health') && lower.includes('bronze'))
                    certifications['Material Health'] = 'Bronze';
                  else if (lower.includes('circularity') && lower.includes('gold'))
                    certifications['Circularity'] = 'Gold';
                  else if (lower.includes('circularity') && lower.includes('silver'))
                    certifications['Circularity'] = 'Silver';
                  else if (lower.includes('circularity') && lower.includes('bronze'))
                    certifications['Circularity'] = 'Bronze';
                }
              }

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

            productMap.set(link, detail);
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

      // Backup current page's rows
      try {
        await backup.add(pageRows);
        await appendLogs(
          DATASET_KEY,
          `Page ${pageNum}: processed ${pageRows.length} new products (total unique: ${productMap.size}).`,
        );
      } catch (e) {
        const backupErr = `⚠️ Backup add failed for page ${pageNum}: ${e.message}`;
        console.warn(backupErr);
        await appendLogs(DATASET_KEY, backupErr);
      }

      pagesScraped.push(pageNum);

      // If this is the last page, stop
      if (pageNum === FINAL_PAGE) {
        await appendLogs(DATASET_KEY, `✅ Reached final page ${FINAL_PAGE}.`);
        break;
      }

      // --- Click the "Next" button with fallback selectors ---
      const nextButtonSelectors = [
        '.certified-products__pagination-btn:last-child', // primary
        'a[rel="next"]', // fallback
        '.pagination-next a',
      ];
      let clicked = false;
      for (const selector of nextButtonSelectors) {
        try {
          const btn = await page.$(selector);
          if (btn) {
            await btn.click();
            clicked = true;
            await appendLogs(DATASET_KEY, `➡️ Clicked next button using selector: ${selector}`);
            break;
          }
        } catch {
          // ignore
        }
      }
      if (!clicked) {
        const errMsg = `❌ No next button found with any selector.`;
        console.error(errMsg);
        await appendLogs(DATASET_KEY, errMsg);
        break;
      }

      // Wait for the active page number to become pageNum+1 (if pagination shows numbers)
      try {
        await page.waitForFunction(
          (expectedPage) => {
            const activePage = document.querySelector(
              '.certified-products__pagination-page.active, .pagination .active',
            );
            return activePage && activePage.innerText.trim() === String(expectedPage);
          },
          { timeout: 10000 },
          pageNum + 1,
        );
      } catch {
        // If page number indicator is missing, fall back to waiting for new product links
        await page.waitForFunction(
          (oldCount) => {
            const links = document.querySelectorAll('a[href*="/certified-products/"]');
            return links.length > 0 && links.length !== oldCount;
          },
          { timeout: 10000 },
          pageLinks.length,
        );
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    // --- Process all collected products ---
    const productDetails = Array.from(productMap.values());
    await appendLogs(DATASET_KEY, `\nTotal unique products collected: ${productDetails.length}`);

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

      await writeCsv(OUTPUT_PATH, finalRows, APPEND_PROCESSED);
      await backup.flush();

      console.log(`\n✅ Scraped ${finalRows.length} unique C2C products.`);
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

// Main entry point
async function main() {
  if (isBackupRecoveryMode()) {
    await rebuildFromBackup();
  } else {
    await scrape_c2c();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  });
}
