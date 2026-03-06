/**
 * scrape_remanufacturing_eu.js - Remanufacturing EU case study tool extraction
 *
 * Extracts all case studies (industry, title, description, PDF link) and downloads each PDF
 * to datasets/raw/remanufacturing_eu/. Uses backup to track progress.
 *
 * Features:
 *   • Extracts all case studies from the case study tool
 *   • Downloads each PDF to datasets/raw/remanufacturing_eu/
 *   • Backup tracking every 5 cases (BACKUP_INTERVAL)
 *   • Supports --show, --clear-logs, --use-backup flags
 *
 * NOTE: When each button is tapped, several PDFs appear to the left. They all are actually
 * in HTML only and not fetched; their display just changes to none when not to be shown.
 *
 * Usage:
 *   node scrape_remanufacturing_eu.js
 *   node scrape_remanufacturing_eu.js --show
 *   node scrape_remanufacturing_eu.js --clear-logs
 *   node scrape_remanufacturing_eu.js --use-backup   (just logs backup content)
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
  readBackupCsv,
  getDatasetScrapeLogsPath,
  randomDelay,
  createBackupHelper,
  DATASET_LOOKUP,
  DATASET_KEYS,
} from '#utils/datasetsUtils.js';

puppeteerExtra.use(StealthPlugin());

const DATASET_KEY = DATASET_KEYS.rema;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const RAW_DIR = getDatasetRawDir(DATASET_KEY);
const BACKUP_INTERVAL = 5; // Backup every 5 cases
const MAX_CASES = 100; // Safety limit (actual count ~50)
const TOTAL_PDF_COLLECTED_LIMIT = 100; // 100

const backup = createBackupHelper(DATASET_KEY, BACKUP_INTERVAL, true, MAX_CASES);

/**
 * Rebuild from backup (only logs content, no download)
 */
async function rebuildFromBackup() {
  const backupRows = await readBackupCsv(DATASET_KEY);
  if (!backupRows.length) {
    console.log('No backup found.');
    return;
  }
  console.log(`Backup contains ${backupRows.length} case studies.`);
  await appendLogs(DATASET_KEY, `Backup rebuild: ${backupRows.length} entries.`);
}

/**
 * Main scrape function
 */
async function scrape() {
  await clearLogs(DATASET_KEY);
  await appendLogs(DATASET_KEY, `🚀 Scrape started...`);
  console.log(
    `Scraping Remanufacturing EU case studies. Logs: ${getDatasetScrapeLogsPath(DATASET_KEY)}`,
  );

  await fs.promises.mkdir(RAW_DIR, { recursive: true });

  let totalPdfCollected = 0;
  let downloadedCases = [];

  const launchOptions = getBrowserLaunchOptions();
  launchOptions.args = launchOptions.args || [];
  launchOptions.args.push('--disable-blink-features=AutomationControlled');
  const browser = await puppeteerExtra.launch(launchOptions);
  const page = await browser.newPage();
  await page.setViewport(getViewportOptions('lg'));
  await page.setUserAgent(getUserAgentOptions());
  await page.setExtraHTTPHeaders(getExtraHttpHeaders());

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  try {
    const targetUrl = dataset.urls.case_studies;

    console.log(`Navigating to ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait for the page to load
    await page.waitForSelector('.col.s12.m4 a.btn[id^="ind"]', { timeout: 10000 });

    // Extract ALL cases from ALL panels in one go
    const allCases = await page.evaluate(() => {
      const results = [];

      // 1. Map industry buttons to their panel numbers
      const industryButtons = Array.from(document.querySelectorAll('.col.s12.m4 a.btn[id^="ind"]'));
      const industryMap = {};

      industryButtons.forEach((btn) => {
        const btnId = btn.id;
        const panelNum = btnId.replace('ind', '');
        const industryName = btn.innerText.trim();
        industryMap[panelNum] = industryName;
      });

      // 2. For each panel, find all case divs
      Object.entries(industryMap).forEach(([panelNum, industryName]) => {
        const panelSelector = `.panel${panelNum}.row.allpanels`;
        const caseDivs = document.querySelectorAll(panelSelector);

        caseDivs.forEach((caseDiv) => {
          const titleElem = caseDiv.querySelector('h5.roboto-bold');
          const descElem = caseDiv.querySelector('p');
          const linkElem = caseDiv.querySelector('a.btn[href*=".pdf"]');

          if (titleElem && descElem && linkElem) {
            // Switching to .href automatically returns the absolute URL
            // e.g., "https://www.remanufacturing.eu/studies/case1.pdf"
            const pdfUrl = linkElem.href;

            results.push({
              industry: industryName,
              title: titleElem.innerText.trim(),
              description: descElem.innerText.trim(),
              pdfUrl: pdfUrl,
            });
          }
        });
      });

      return results;
    });

    console.log(`Found ${allCases.length} total case studies across all industries.`);
    await appendLogs(DATASET_KEY, `Found ${allCases.length} total cases.`);

    // Deduplicate by PDF filename (some cases might share the same PDF? unlikely but safe)
    const uniqueCases = [];
    const seenFilenames = new Set();

    for (const item of allCases) {
      const urlPath = new URL(item.pdfUrl).pathname;
      const filename = path.basename(urlPath);

      if (!seenFilenames.has(filename)) {
        seenFilenames.add(filename);
        uniqueCases.push({ ...item, filename });
      } else {
        console.log(`  Skipping duplicate PDF: ${filename} (${item.title})`);
      }
    }

    console.log(`Processing ${uniqueCases.length} unique case studies.`);

    // Download all PDFs
    for (let i = 0; i < uniqueCases.length; i++) {
      const item = uniqueCases[i];
      const localPath = path.join(RAW_DIR, item.filename);

      console.log(`[${i + 1}/${uniqueCases.length}] ${item.title} (${item.industry})`);

      const backupRow = {
        industry: item.industry,
        title: item.title,
        description: item.description,
        pdf_url: item.pdfUrl,
        filename: item.filename,
        downloaded: fs.existsSync(localPath) ? 'yes' : 'pending',
      };

      if (!fs.existsSync(localPath)) {
        try {
          console.log(`  Downloading ${item.pdfUrl} -> ${item.filename}`);

          const cookies = await page.cookies();
          const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

          const response = await axios({
            method: 'GET',
            url: item.pdfUrl,
            responseType: 'stream',
            headers: {
              'User-Agent': getUserAgentOptions(),
              Referer: targetUrl,
              Accept:
                'application/pdf,text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
              ...(cookieString ? { Cookie: cookieString } : {}),
            },
            timeout: 30000,
          });

          const contentType = response.headers['content-type'];
          if (!contentType || !contentType.includes('pdf')) {
            console.warn(`  Content-Type is not PDF: ${contentType}, skipping.`);
            backupRow.downloaded = 'failed (not pdf)';
          } else {
            const writer = fs.createWriteStream(localPath);
            response.data.pipe(writer);
            await new Promise((resolve, reject) => {
              writer.on('finish', resolve);
              writer.on('error', reject);
            });
            console.log(`  Saved PDF (${fs.statSync(localPath).size} bytes)`);
            await appendLogs(
              DATASET_KEY,
              `  Downloaded: ${item.filename} (${item.title}, ${item.pdfUrl}) - ${contentType}, ${response.headers['content-length']} bytes`,
            );
            backupRow.downloaded = 'yes';
          }
        } catch (err) {
          console.error(`  Error downloading: ${err.message}`);
          backupRow.downloaded = `failed (${err.message})`;
          await appendLogs(DATASET_KEY, `  Download error for ${item.filename}: ${err.message}`);
        }
      } else {
        console.log(`  File already exists, skipping download.`);
        backupRow.downloaded = 'yes';
      }

      await backup.add([backupRow]);

      if (backupRow.downloaded === 'yes') {
        totalPdfCollected++;
        downloadedCases.push(item);
        if (totalPdfCollected >= TOTAL_PDF_COLLECTED_LIMIT) {
          console.log(`Reached limit of ${TOTAL_PDF_COLLECTED_LIMIT} PDFs collected. Stopping.`);
          await appendLogs(DATASET_KEY, `Reached limit: ${totalPdfCollected} PDFs collected.`);
          break;
        }
      }

      await randomDelay(1000, 2000);
    }

    await backup.flush();

    // After all downloads, write a metadata JSON file for the extractor
    const metadataPath = path.join(RAW_DIR, 'metadata.json');
    const metadataList = downloadedCases.map((item) => ({
      filename: item.filename,
      industry: item.industry,
      title: item.title,
      description: item.description,
      pdf_url: item.pdfUrl,
    }));
    await fs.promises.writeFile(metadataPath, JSON.stringify(metadataList, null, 2));
    console.log(`✅ Wrote metadata to ${metadataPath}`);
    await appendLogs(
      DATASET_KEY,
      `Wrote metadata for ${metadataList.length} cases to ${metadataPath}`,
    );

    console.log(`\n✅ Scrape completed. PDFs saved to ${RAW_DIR}`);
    await appendLogs(DATASET_KEY, `Scrape completed. Total PDFs: ${totalPdfCollected}`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    await appendLogs(DATASET_KEY, `❌ Fatal error: ${error.message}`);
  } finally {
    await browser.close();
    await appendLogs(DATASET_KEY, `--- End of run ---\n`);
  }
}

/**
 * Main entry point
 */
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
