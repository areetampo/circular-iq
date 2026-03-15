
/**
 * scrape_c2c.js – Cradle-to-Cradle (C2C) certified products scraper
 *
 * Scrapes from https://c2ccertified.org/certified-products
 * Features:
 *   - Pagination handling with retry logic and fallback selectors
 *   - Per-product detail extraction (company, title, certifications, category, description)
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

import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { fileURLToPath } from 'url';
import {
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
const dataset = DATASET_LOOKUP[DATASET_KEY];

const TARGET_URL = dataset.urls.homepage;
if (!TARGET_URL) {
  throw new Error(`Target URL not defined for dataset key: ${DATASET_KEY}`);
}

const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);
const START_PAGE = 1;
const END_PAGE = 56; // As of Feb 2026, there are 56 pages total (1..56)
const MAX_PAGES_TO_FETCH = 56;
const BACKUP_INTERVAL = 3;
const MAX_ROWS = 350;

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
  if (certifications['Product Circularity']) score += 20; // bonus for circularity certification
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
          const company = metadata.company || 'Unknown';
          const title = metadata.title || '';
          const description = metadata.description || '';
          const materials = metadata.materials || 'Cradle‑to‑Cradle Certified Materials';
          const category = row.category;
          const qualityScore =
            metadata.raw_extracted?.qualityScore || scoreProductQuality(certifications);
          const certCount = Object.keys(certifications).length;

          return {
            link: row.source_url,
            company,
            title,
            description,
            materials,
            certifications,
            category,
            qualityScore,
            certCount,
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

    // Build final rows with same enriched format
    const finalRows = productDetails.map((product, idx) => {
      const problem = product.description
        ? `Need for sustainable products: ${product.title} addresses circular economy challenges.`
        : `Need for environmentally sustainable products in the ${product.category} industry.`;

      const solution = product.description
        ? `${product.description} This product, ${product.title} by ${product.company}, is Cradle‑to‑Cradle certified with ${Object.entries(
            product.certifications,
          )
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')}.`
        : `${product.title} by ${product.company} is Cradle‑to‑Cradle certified with ${Object.entries(
            product.certifications,
          )
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')}. Category: ${product.category}`;

      const circular_strategy = `Cradle‑to‑Cradle Certified (${Object.entries(
        product.certifications,
      )
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')})`;

      const impact = `Score: ${product.qualityScore}/100 | ${product.certCount} certifications`;

      const metadata = {
        company: product.company,
        title: product.title,
        certifications: product.certifications,
        certCount: product.certCount,
        description: product.description,
        materials: product.materials,
        raw_extracted: { ...product },
      };

      return {
        problem,
        solution,
        materials: product.materials,
        circular_strategy,
        category: product.category,
        impact,
        source_url: product.link,
        metadata_json: JSON.stringify(metadata),
      };
    });

    console.log(`\n✨ Rebuilt ${finalRows.length} C2C products from backup`);
    const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, finalRows, {
      append: APPEND_PROCESSED,
    });
    console.log(
      `📁 Saved to: ${OUTPUT_PATH} (${writeResult.writtenCount} written, ${writeResult.duplicateCount} duplicate rows removed)`,
    );
    await appendLogs(
      DATASET_KEY,
      `✅ Recovery complete. Wrote ${writeResult.writtenCount} rows to ${OUTPUT_PATH} (duplicate rows removed: ${writeResult.duplicateCount})`,
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
    const productLinkSelector = 'a.listinline[href^="/certified-products/"]';
    await page.waitForSelector(productLinkSelector, { timeout: 10000 });

    // 4. Prepare collections
    const productMap = new Map(); // unique products by URL
    const pagesScraped = [];

    // 5. Loop through pages by clicking "Next"
    for (let pageNum = START_PAGE; pageNum <= FINAL_PAGE; pageNum++) {
      await appendLogs(DATASET_KEY, `\n--- Processing page ${pageNum} ---`);

      // Extract product links from the current page
      let pageLinks = await page.$$eval(productLinkSelector, (links) =>
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

            // Extract all data in one evaluate to avoid cross-context issues
            const data = await detailPage.evaluate(() => {
              // --- Company ---
              const companyEl = document.querySelector('.product-hero__subtitle');
              const company = companyEl ? companyEl.innerText.trim() : 'Unknown';

              // --- Title ---
              const titleEl = document.querySelector('h1.product-hero__title');
              const title = titleEl ? titleEl.innerText.trim() : 'Unknown Product';

              // --- Description ---
              let description = '';
              const descEl = document.querySelector('.product-details__description p');
              if (descEl) {
                description = descEl.innerText.trim();
              }
              // Fallback: meta description
              if (!description) {
                const metaDesc = document
                  .querySelector('meta[name="description"]')
                  ?.getAttribute('content');
                if (metaDesc) description = metaDesc;
              }

              // --- Materials (if any) ---
              let materials = '';
              // There is no obvious materials list in the provided HTML; we'll keep it generic.

              // --- Certifications ---
              const certifications = {};
              const certItems = document.querySelectorAll('.score-cards__item');
              certItems.forEach((item) => {
                const titleEl = item.querySelector('.score-cards__item-title');
                const levelEl = item.querySelector('.score-cards__item-level');
                if (titleEl && levelEl) {
                  const certType = titleEl.innerText.trim();
                  const certLevel = levelEl.innerText.trim();
                  // Normalize type (e.g., "Material Health" -> "Material Health")
                  certifications[certType] = certLevel;
                }
              });
              // Fallback if no score cards found
              if (Object.keys(certifications).length === 0) {
                certifications['C2C Certified'] = 'General';
              }

              // --- Category ---
              let category = 'General';
              const categoryTags = document.querySelectorAll(
                '.product-details__tag .product-details__tag-title',
              );
              if (categoryTags.length) {
                category = Array.from(categoryTags)
                  .map((el) => el.innerText.trim())
                  .join(' > ');
              } else {
                // Fallback: breadcrumb
                const breadcrumbLast = document.querySelector('.breadcrumb li:last-child');
                if (breadcrumbLast) category = breadcrumbLast.innerText.trim();
              }

              return {
                company,
                title,
                description,
                materials,
                certifications,
                category,
              };
            });

            const cleanedCompany = cleanText(data.company);
            const cleanedTitle = cleanText(data.title);
            const cleanedCategory = cleanText(data.category);
            const cleanedDescription = cleanText(data.description);
            const cleanedMaterials =
              cleanText(data.materials) || 'Cradle‑to‑Cradle Certified Materials';

            const detail = {
              link,
              company: cleanedCompany,
              title: cleanedTitle,
              certifications: data.certifications,
              category: cleanedCategory,
              description: cleanedDescription,
              materials: cleanedMaterials,
              qualityScore: scoreProductQuality(data.certifications),
              certCount: Object.keys(data.certifications).length,
            };

            productMap.set(link, detail);

            // Generate enriched problem & solution
            const problem = cleanedDescription
              ? `Need for sustainable products: ${cleanedTitle} addresses circular economy challenges.`
              : `Need for environmentally sustainable products in the ${cleanedCategory} industry.`;

            const solution = cleanedDescription
              ? `${cleanedDescription} This product, ${cleanedTitle} by ${cleanedCompany}, is Cradle‑to‑Cradle certified with ${Object.entries(
                  data.certifications,
                )
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(', ')}.`
              : `${cleanedTitle} by ${cleanedCompany} is Cradle‑to‑Cradle certified with ${Object.entries(
                  data.certifications,
                )
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(', ')}. Category: ${cleanedCategory}`;

            const circular_strategy = `Cradle‑to‑Cradle Certified (${Object.entries(
              data.certifications,
            )
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ')})`;

            const impact = `Score: ${detail.qualityScore}/100 | ${detail.certCount} certifications`;

            const metadata = {
              company: cleanedCompany,
              title: cleanedTitle,
              certifications: data.certifications,
              certCount: detail.certCount,
              description: cleanedDescription,
              materials: cleanedMaterials,
              raw_extracted: { ...detail },
            };

            pageRows.push({
              problem,
              solution,
              materials: cleanedMaterials,
              circular_strategy,
              category: cleanedCategory,
              impact,
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
      const nextButtonSelector = '.certified-products__pagination-btn:last-child';
      let clicked = false;

      try {
        const nextBtn = await page.$(nextButtonSelector);
        if (nextBtn) {
          const isDisabled = await page.evaluate(
            (btn) => btn.disabled || btn.classList.contains('disabled'),
            nextBtn,
          );
          if (!isDisabled) {
            await nextBtn.click();
            clicked = true;
            await appendLogs(DATASET_KEY, `➡️ Clicked next button.`);
          } else {
            await appendLogs(DATASET_KEY, `ℹ️ Next button is disabled – stopping pagination.`);
            break;
          }
        }
      } catch (err) {
        await appendLogs(DATASET_KEY, `⚠️ Error clicking next button: ${err.message}`);
      }

      if (!clicked) {
        // Fallback selectors (without disabled check)
        const fallbackSelectors = ['a[rel="next"]', '.pagination-next a'];
        for (const selector of fallbackSelectors) {
          try {
            const btn = await page.$(selector);
            if (btn) {
              await btn.click();
              clicked = true;
              await appendLogs(DATASET_KEY, `➡️ Clicked next using fallback: ${selector}`);
              break;
            }
          } catch {
            // ignore
          }
        }
      }

      if (!clicked) {
        const errMsg = `❌ No enabled next button found.`;
        console.error(errMsg);
        await appendLogs(DATASET_KEY, errMsg);
        break;
      }

      // Wait for the active page number to become pageNum+1, or for new product links
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
        // Fallback: wait for the number of product links to change
        await page.waitForFunction(
          (oldCount, selector) => {
            const links = document.querySelectorAll(selector);
            return links.length > 0 && links.length !== oldCount;
          },
          { timeout: 10000 },
          pageLinks.length,
          productLinkSelector,
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
      // Build final rows using the enriched format
      const finalRows = sortedProducts.map((product) => {
        const problem = product.description
          ? `Need for sustainable products: ${product.title} addresses circular economy challenges.`
          : `Need for environmentally sustainable products in the ${product.category} industry.`;

        const solution = product.description
          ? `${product.description} This product, ${product.title} by ${product.company}, is Cradle‑to‑Cradle certified with ${Object.entries(
              product.certifications,
            )
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ')}.`
          : `${product.title} by ${product.company} is Cradle‑to‑Cradle certified with ${Object.entries(
              product.certifications,
            )
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ')}. Category: ${product.category}`;

        const circular_strategy = `Cradle‑to‑Cradle Certified (${Object.entries(
          product.certifications,
        )
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')})`;

        const impact = `Score: ${product.qualityScore}/100 | ${product.certCount} certifications`;

        const metadata = {
          company: product.company,
          title: product.title,
          certifications: product.certifications,
          certCount: product.certCount,
          description: product.description,
          materials: product.materials,
          raw_extracted: { ...product },
        };

        return {
          problem,
          solution,
          materials: product.materials,
          circular_strategy,
          category: product.category,
          impact,
          source_url: product.link,
          metadata_json: JSON.stringify(metadata),
        };
      });

      console.log(`\n✅ Scraped ${finalRows.length} unique C2C products.`);
      const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, finalRows, {
        append: APPEND_PROCESSED,
      });
      await backup.flush();

      console.log(
        `📁 Saved to: ${OUTPUT_PATH} (${writeResult.writtenCount} written, ${writeResult.duplicateCount} duplicate rows removed)`,
      );

      const firstRow = finalRows[0];
      const lastRow = finalRows[finalRows.length - 1];
      await appendLogs(
        DATASET_KEY,
        `✅ Scrape complete. Wrote ${writeResult.writtenCount} rows to ${OUTPUT_PATH} (duplicate rows removed: ${writeResult.duplicateCount}). Pages scraped: ${pagesScraped.join(', ')}.`,
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
