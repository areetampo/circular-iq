/**
 * @module run_datasets_scripts
 * @description Orchestrator for dataset extract/scrape scripts in datasets/scripts/.
 *
 * Usage:
 *   node pipeline/rag/run_datasets_scripts.js            # default: extract then scrape
 *   node pipeline/rag/run_datasets_scripts.js --extract
 *   node pipeline/rag/run_datasets_scripts.js --scrape
 *   node pipeline/rag/run_datasets_scripts.js --all
 *
 * Only one flag may be provided. Exits on the first script failure.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { assertDirExists, DATASETS_SCRIPTS_DIR } from '#utils/datasetsUtils.js';
import { logger } from '#utils/logger.js';

/**
 * Lists sorted `.js` filenames in `datasets/scripts/`.
 * @returns {string[]} Script basenames.
 */
function collectFiles() {
  try {
    assertDirExists(DATASETS_SCRIPTS_DIR, 'datasets/scripts directory');
  } catch (err) {
    logger.error({ err }, 'Dataset scripts directory missing');
    process.exit(1);
  }

  return fs
    .readdirSync(DATASETS_SCRIPTS_DIR)
    .filter((f) => f.endsWith('.js'))
    .sort((a, b) => a.localeCompare(b));
}

function runScript(file) {
  const fullPath = path.join(DATASETS_SCRIPTS_DIR, file);
  logger.info({ file }, 'Running dataset script');
  try {
    execSync(`node "${fullPath}"`, { stdio: 'inherit' });
  } catch (err) {
    logger.error({ err, file }, 'Failure executing dataset script');
    process.exit(err.status || 1);
  }
}

/**
 * Ensures at most one of `--extract`, `--scrape`, or `--all` is present.
 * @param {string[]} flags - CLI arguments after the script name.
 * @returns {string|null} Active flag or `null` for default mode.
 */
function validateFlags(flags) {
  const allowed = ['--extract', '--scrape', '--all'];
  const active = flags.filter((f) => allowed.includes(f));
  if (active.length > 1) {
    logger.error('✗ ERROR: Only one of --extract, --scrape or --all may be specified');
    process.exit(1);
  }
  return active[0] || null;
}

/** CLI entry: runs extract/scrape dataset scripts according to flags. */
function main() {
  const args = process.argv.slice(2);
  const flag = validateFlags(args);

  const allFiles = collectFiles();
  if (allFiles.length === 0) {
    logger.info('No dataset scripts found, nothing to do');
    return;
  }

  const extractFiles = allFiles.filter((f) => f.startsWith('extract_'));
  const scrapeFiles = allFiles.filter((f) => f.startsWith('scrape_'));
  const otherFiles = allFiles.filter((f) => !f.startsWith('extract_') && !f.startsWith('scrape_'));

  let ordered = [];
  if (flag === '--extract') {
    ordered = [...extractFiles];
    logger.info({ count: ordered.length, mode: 'extract-only' }, 'Running extract-only scripts');
  } else if (flag === '--scrape') {
    ordered = [...scrapeFiles];
    logger.info({ count: ordered.length, mode: 'scrape-only' }, 'Running scrape-only scripts');
  } else if (flag === '--all') {
    ordered = [...extractFiles, ...scrapeFiles, ...otherFiles];
    logger.info({ count: ordered.length, mode: 'all' }, 'Running all scripts');
  } else {
    // default: extract then scrape
    ordered = [...extractFiles, ...scrapeFiles, ...otherFiles];
    logger.info({ count: ordered.length, mode: 'default' }, 'Running default scripts');
  }

  logger.info({ total: allFiles.length, directory: DATASETS_SCRIPTS_DIR }, 'Found dataset scripts');

  if (ordered.length === 0) {
    logger.info('No scripts match the requested selection, exiting');
    return;
  }

  ordered.forEach(runScript);

  logger.info('All requested dataset scripts completed successfully');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export default main;
