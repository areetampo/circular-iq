
/**
 * scrape_metabolic.js - Metabolic publications downloading and management
 *
 * Visits detail pages, finds PDF download links, and downloads PDFs. Uses dataset configuration
 * to know what to download. Provides backup tracking and recovery mode.
 *
 * Features:
 *   • Uses dataset.raw_folder_contents (filename -> detail page URL) to know what to download.
 *   • Visits each detail page, finds PDF download link.
 *   • Downloads PDF to datasets/raw/metabolic/ with the predefined filename.
 *   • Skips already downloaded files.
 *   • Writes a metadata.json file in the raw folder for later extraction.
 *   • Backup every 3 publications to track progress (logs only).
 *   • Recovery mode with `--use-backup` (though less needed).
 *   • Clear logs with `--clear-logs`
 *   • Show browser with `--show`
 *
 * Usage:
 *   node scrape_metabolic.js                 # normal run
 *   node scrape_metabolic.js --show          # visible browser
 *   node scrape_metabolic.js --clear-logs    # clear log file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import axios from 'axios';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';


import {
    appendLogs,
    clearLogs,
    DATASET_KEYS,
    DATASET_LOOKUP,
    getBrowserLaunchOptions,
    getDatasetRawDir,
    getDatasetScrapeLogsPath,
    getExtraHttpHeaders,
    getUserAgentOptions,
    getViewportOptions,
    isBackupRecoveryMode,
    randomDelay,
} from '#utils/datasetsUtils.js';
import { logger } from '#utils/logger.js';

puppeteerExtra.use(StealthPlugin());

const DATASET_KEY = DATASET_KEYS.metabolic;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const RAW_DIR = getDatasetRawDir(DATASET_KEY);

async function rebuildFromBackup() {
  logger.info(
    '♻️ BACKUP RECOVERY MODE: This scraper downloads PDFs. Please run extract_metabolic.js to process the downloaded files.',
  );
  await appendLogs(
    DATASET_KEY,
    '♻️ RECOVERY MODE: Run extract_metabolic.js to process downloaded PDFs.',
  );
}

async function scrape() {
  await clearLogs(DATASET_KEY);
  await appendLogs(DATASET_KEY, `🚀 Scrape started...`);
  logger.info(`Scraping Metabolic publications. Logs: ${getDatasetScrapeLogsPath(DATASET_KEY)}`);

  // Launch browser with stealth
  const launchOptions = getBrowserLaunchOptions();
  launchOptions.args = launchOptions.args || [];
  launchOptions.args.push('--disable-blink-features=AutomationControlled');

  const browser = await puppeteerExtra.launch(launchOptions);
  const page = await browser.newPage();
  await page.setViewport(getViewportOptions());
  await page.setUserAgent(getUserAgentOptions());
  await page.setExtraHTTPHeaders(getExtraHttpHeaders());
  const randomUA = getUserAgentOptions();

  // Override navigator.webdriver property
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  try {
    await fs.promises.mkdir(RAW_DIR, { recursive: true });

    // Get the list of desired files from dataset.raw_folder_contents
    const fileMap = dataset.raw_folder_contents || {};
    const entries = Object.entries(fileMap);
    logger.info(`Found ${entries.length} publications to download.`);
    await appendLogs(DATASET_KEY, `Found ${entries.length} publications in raw_folder_contents.`);

    const metadataList = []; // will store { filename, detailUrl, pdfUrl }

    for (let i = 0; i < entries.length; i++) {
      const [filename, detailUrl] = entries[i];
      logger.info(`[${i + 1}/${entries.length}] ${filename} -> ${detailUrl}`);

      const localPath = path.join(RAW_DIR, filename);
      let pdfUrl = null;
      let downloaded = false;

      if (fs.existsSync(localPath)) {
        logger.info(`  File already exists, skipping.`);
        await appendLogs(DATASET_KEY, `  Already exists: ${filename}`);
        // Still record metadata for existing file
        metadataList.push({ filename, detailUrl, pdfUrl: '' });
        continue;
      }

      try {
        await randomDelay(2000, 5000);
        await page.goto(detailUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        // Handle cookie banner if present
        try {
          const acceptButton = await page.$(
            'button:contains("Accept"), .wt-cck--actions-button, [aria-label*="cookie"]',
          );
          if (acceptButton) {
            await acceptButton.click();
            logger.info('  Clicked cookie accept button');
            await randomDelay(2000, 3000);
          }
        } catch {
          // Ignore cookie handling errors
        }

        // Wait for iframe
        let iframeFound = false;
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            await page.waitForSelector('iframe.pdfjs-iframe', { timeout: 8000 });
            iframeFound = true;
            break;
          } catch (e) {
            logger.info(
              `  Iframe not found, attempt (error: ${e.message}). Retrying ${attempt + 1}/5 ...`,
            );
            await randomDelay(3000, 5000);
          }
        }

        if (!iframeFound) {
          const pageTitle = await page.title().catch(() => 'unknown');
          logger.warn(`  No iframe found for ${detailUrl}. Page title: "${pageTitle}"`);
          await appendLogs(DATASET_KEY, `  No iframe found, page title: ${pageTitle}`);
          continue;
        }

        // Extract PDF URL from iframe
        const iframeSrc = await page.$eval('iframe.pdfjs-iframe', (iframe) => iframe.src);
        const urlParams = new URLSearchParams(iframeSrc.split('?')[1]);
        pdfUrl = urlParams.get('file');

        if (pdfUrl) {
          if (pdfUrl.startsWith('//')) pdfUrl = 'https:' + pdfUrl;
          else if (pdfUrl.startsWith('/')) pdfUrl = 'https://www.metabolic.nl' + pdfUrl;
        }

        if (!pdfUrl) {
          logger.warn('  No PDF URL found in iframe');
          await appendLogs(DATASET_KEY, `  No PDF URL in iframe: ${detailUrl}`);
          continue;
        }

        logger.info(`  Downloading ${pdfUrl} -> ${filename}`);

        // Get cookies from the current page
        const cookies = await page.cookies();
        const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

        // Prepare headers
        const headers = {
          'User-Agent': randomUA,
          Referer: detailUrl,
          Accept:
            'application/pdf,text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0',
          ...(cookieString ? { Cookie: cookieString } : {}),
        };

        // Use axios to download with a stream to save memory
        const response = await axios({
          method: 'GET',
          url: pdfUrl,
          responseType: 'stream',
          headers,
          timeout: 30000,
        });

        // Check content-type
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.includes('pdf')) {
          logger.warn(`  Content-Type is not PDF: ${contentType}`);
          let preview = '';
          response.data.on('data', (chunk) => {
            preview += chunk.toString('utf8', 0, 200);
            response.data.destroy();
          });
          await new Promise((resolve) => response.data.on('end', resolve));
          logger.warn(`  Preview: ${preview}`);
          continue;
        }

        // Save the stream to file
        const writer = fs.createWriteStream(localPath);
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        logger.info(`  Saved PDF (size: ${fs.statSync(localPath).size} bytes)`);
        downloaded = true;
        await appendLogs(DATASET_KEY, `  Downloaded: ${filename}`);
      } catch (err) {
        logger.error(`  Error: ${err.message}`);
        await appendLogs(DATASET_KEY, `  ERROR: ${detailUrl} - ${err.message}`);
      }

      // Record metadata regardless of success/failure (pdfUrl may be empty if failed)
      metadataList.push({ filename, detailUrl, pdfUrl: pdfUrl || '' });
      await randomDelay(3000, 7000);
    }

    // Write metadata.json file
    const metadataPath = path.join(RAW_DIR, 'metadata.json');
    await fs.promises.writeFile(metadataPath, JSON.stringify(metadataList, null, 2));
    logger.info(`✓ Wrote metadata to ${metadataPath}`);
    await appendLogs(DATASET_KEY, `Metadata saved for ${metadataList.length} entries.`);

    logger.info(`\n✓ Processed ${entries.length} publications.`);
  } catch (error) {
    logger.error('✕ Fatal error:', error);
    await appendLogs(DATASET_KEY, `✕ Fatal error: ${error.message}`);
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
    logger.error('\n✕ Fatal error:', err.message);
    process.exit(1);
  });
}
