/**
 * Runs dataset extract/scrape scripts in `datasets/scripts/`; default runs extract then scrape.
 * CLI: exactly one of `--extract`, `--scrape`, `--all` (exits on first script failure).
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { assertDirExists, DATASETS_SCRIPTS_DIR } from '#utils/datasetsUtils.js';
import { logger } from '#utils/logger.js';

/**
 * Lists dataset script basenames in deterministic execution order.
 *
 * @returns {string[]} Sorted `.js` filenames from `datasets/scripts/`.
 */
function collectFiles() {
  try {
    assertDirExists(DATASETS_SCRIPTS_DIR, 'datasets/scripts directory');
  } catch (error) {
    logger.error({ error }, 'Dataset scripts directory missing');
    process.exit(1);
  }

  return fs
    .readdirSync(DATASETS_SCRIPTS_DIR)
    .filter((f) => f.endsWith('.js'))
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Executes one dataset script with inherited stdio; exits the process on non-zero status.
 *
 * @param {string} file - Script basename under `datasets/scripts/`.
 */
function runScript(file) {
  const fullPath = path.join(DATASETS_SCRIPTS_DIR, file);
  logger.info({ file }, 'Running dataset script');
  try {
    execSync(`node "${fullPath}"`, { stdio: 'inherit' });
  } catch (error) {
    logger.error({ error, file }, 'Failure executing dataset script');
    process.exit(error.status || 1);
  }
}

/**
 * Resolves the active dataset-script mode from mutually exclusive CLI flags.
 *
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

/** CLI entry that runs the selected dataset scripts and exits on the first script failure. */
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
