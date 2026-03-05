/**
 * scrape_metabolic.js
 *
 * Downloads selected Metabolic publications (from raw_folder_contents) as PDFs.
 * Features:
 *   - Uses dataset.raw_folder_contents (filename -> detail page URL) to know what to download.
 *   - Visits each detail page, finds PDF download link.
 *   - Downloads PDF to datasets/raw/metabolic/ with the predefined filename.
 *   - Skips already downloaded files.
 *   - Backup every 3 publications to track progress.
 *   - Recovery mode with `--use-backup` (though less needed).
 *   - Clear logs with `--clear-logs`
 *   - Show browser with `--show`
 *
 * Usage:
 *   node scrape_metabolic.js                 # normal run
 *   node scrape_metabolic.js --show          # visible browser
 *   node scrape_metabolic.js --clear-logs    # clear log file
 */

import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import axios from 'axios';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import {
  getDatasetRawDir,
  getBrowserLaunchOptions,
  getViewportOptions,
  getUserAgentOptions,
  getExtraHttpHeaders,
  isBackupRecoveryMode,
  appendLogs,
  clearLogs,
  getDatasetScrapeLogsPath,
  randomDelay,
  DATASET_LOOKUP,
  DATASET_KEYS,
} from '#utils/datasetsUtils.js';

puppeteerExtra.use(StealthPlugin());

const DATASET_KEY = DATASET_KEYS.metabolic;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const RAW_DIR = getDatasetRawDir(DATASET_KEY);

// no need for backup csv writing since we are just downloading pdf urls from dataset.raw_folder_contents
// logs are still made for monitoring progress and errors, but backup is less critical since we are not extracting new URLs during the scrape
// const backup = createBackupHelper(DATASET_KEY, BACKUP_INTERVAL, CLEAR_BACKUP_ON_START, 60);

async function rebuildFromBackup() {
  const msg =
    'Rebuild from backup not implemented for this scraper since we are not extracting new URLs during the scrape, only PDFs are downloaded based on dataset.raw_folder_contents.';
  console.log(msg);
  await appendLogs(DATASET_KEY, `⚠️  ${msg}`);
}

async function scrape() {
  await clearLogs(DATASET_KEY);
  await appendLogs(DATASET_KEY, `🚀 Scrape started...`);
  console.log(`Scraping Metabolic publications. Logs: ${getDatasetScrapeLogsPath(DATASET_KEY)}`);

  // Launch browser with stealth
  const launchOptions = getBrowserLaunchOptions();
  // Add extra argument to reduce automation detection
  launchOptions.args = launchOptions.args || [];
  launchOptions.args.push('--disable-blink-features=AutomationControlled');

  const browser = await puppeteerExtra.launch(launchOptions);
  const page = await browser.newPage();
  await page.setViewport(getViewportOptions());
  await page.setUserAgent(getUserAgentOptions());
  await page.setExtraHTTPHeaders(getExtraHttpHeaders());

  // Override navigator.webdriver property
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  try {
    await fs.promises.mkdir(RAW_DIR, { recursive: true });

    // Get the list of desired files from dataset.raw_folder_contents
    const fileMap = dataset.raw_folder_contents || {};
    const entries = Object.entries(fileMap);
    console.log(`Found ${entries.length} publications to download.`);
    await appendLogs(DATASET_KEY, `Found ${entries.length} publications in raw_folder_contents.`);

    const downloaded = [];

    for (let i = 0; i < entries.length; i++) {
      const [filename, detailUrl] = entries[i];
      console.log(`[${i + 1}/${entries.length}] ${filename} -> ${detailUrl}`);

      const localPath = path.join(RAW_DIR, filename);
      if (fs.existsSync(localPath)) {
        console.log(`  File already exists, skipping.`);
        await appendLogs(DATASET_KEY, `  Already exists: ${filename}`);
        // still record for backup
        downloaded.push({ filename, detailUrl, status: 'exists' });
        // await backup.add([]); // increment counter
        continue;
      }

      let pdfUrl = null;
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
            console.log('  Clicked cookie accept button');
            await randomDelay(2000, 3000);
          }
        } catch (e) {}

        // Wait for iframe
        let iframeFound = false;
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            await page.waitForSelector('iframe.pdfjs-iframe', { timeout: 8000 });
            iframeFound = true;
            break;
          } catch (e) {
            console.log(`  Iframe not found, attempt ${attempt + 1}/5`);
            await randomDelay(3000, 5000);
          }
        }

        if (!iframeFound) {
          const pageTitle = await page.title().catch(() => 'unknown');
          console.warn(`  No iframe found for ${detailUrl}. Page title: "${pageTitle}"`);
          await appendLogs(DATASET_KEY, `  No iframe found, page title: ${pageTitle}`);
          // await backup.add([]);
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
          console.warn('  No PDF URL found in iframe');
          await appendLogs(DATASET_KEY, `  No PDF URL in iframe: ${detailUrl}`);
          // await backup.add([]);
          continue;
        }

        console.log(`  Downloading ${pdfUrl} -> ${filename}`);

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
          console.warn(`  Content-Type is not PDF: ${contentType}`);
          // Read a chunk to see what it is
          let preview = '';
          response.data.on('data', (chunk) => {
            preview += chunk.toString('utf8', 0, 200);
            response.data.destroy();
          });
          await new Promise((resolve) => response.data.on('end', resolve));
          console.warn(`  Preview: ${preview}`);
          await backup.add([]);
          continue;
        }

        // Save the stream to file
        const writer = fs.createWriteStream(localPath);
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        console.log(`  Saved PDF (size: ${fs.statSync(localPath).size} bytes)`);

        // await backup.add([{ filename, detailUrl, pdfUrl }]);
        await appendLogs(DATASET_KEY, `  Downloaded: ${filename}`);
      } catch (err) {
        console.error(`  Error: ${err.message}`);
        await appendLogs(DATASET_KEY, `  ERROR: ${detailUrl} - ${err.message}`);
        // await backup.add([]);
      }

      await randomDelay(3000, 7000);
    }

    // await backup.flush();

    console.log(
      `\n✅ Processed ${downloaded.length} publications. Downloaded new ones: ${downloaded.filter((d) => d.status === 'downloaded').length}`,
    );
    await appendLogs(
      DATASET_KEY,
      `Downloaded ${downloaded.filter((d) => d.status === 'downloaded').length} new PDFs.`,
    );
  } catch (error) {
    console.error('❌ Fatal error:', error);
    await appendLogs(DATASET_KEY, `❌ Fatal error: ${error.message}`);
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
