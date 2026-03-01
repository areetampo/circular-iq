/* global process */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { DATASETS_SCRIPTS_DIR } from '#utils/datasetsUtils.js';

// run_datasets_scripts.js
// Orchestrator for dataset scripts with flags to control behavior.
// Usage:
//   node pipeline/run_datasets_scripts.js            # default: extract then scrape
//   node pipeline/run_datasets_scripts.js --extract
//   node pipeline/run_datasets_scripts.js --scrape
//   node pipeline/run_datasets_scripts.js --all
// Only one flag may be provided. The runner exits on the first script failure.

function collectFiles() {
  if (!fs.existsSync(DATASETS_SCRIPTS_DIR)) {
    console.error(`✗ datasets/scripts directory not found: ${DATASETS_SCRIPTS_DIR}`);
    process.exit(1);
  }

  return fs
    .readdirSync(DATASETS_SCRIPTS_DIR)
    .filter((f) => f.endsWith('.js'))
    .sort((a, b) => a.localeCompare(b));
}

function runScript(file) {
  const fullPath = path.join(DATASETS_SCRIPTS_DIR, file);
  console.log(`\n>>> Running dataset script: ${file}`);
  try {
    execSync(`node "${fullPath}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`\n✗ FAILURE executing ${file}`);
    process.exit(err.status || 1);
  }
}

function validateFlags(flags) {
  const allowed = ['--extract', '--scrape', '--all'];
  const active = flags.filter((f) => allowed.includes(f));
  if (active.length > 1) {
    console.error('✗ ERROR: Only one of --extract, --scrape or --all may be specified');
    process.exit(1);
  }
  return active[0] || null;
}

function main() {
  const args = process.argv.slice(2);
  const flag = validateFlags(args);

  const allFiles = collectFiles();
  if (allFiles.length === 0) {
    console.log('No dataset scripts found, nothing to do.');
    return;
  }

  const extractFiles = allFiles.filter((f) => f.startsWith('extract_'));
  const scrapeFiles = allFiles.filter((f) => f.startsWith('scrape_'));
  const otherFiles = allFiles.filter((f) => !f.startsWith('extract_') && !f.startsWith('scrape_'));

  let ordered = [];
  if (flag === '--extract') {
    ordered = [...extractFiles];
    console.log(`Running extract-only: ${ordered.length} script(s)`);
  } else if (flag === '--scrape') {
    ordered = [...scrapeFiles];
    console.log(`Running scrape-only: ${ordered.length} script(s)`);
  } else if (flag === '--all') {
    ordered = [...extractFiles, ...scrapeFiles, ...otherFiles];
    console.log(`Running all scripts: ${ordered.length} script(s)`);
  } else {
    // default: extract then scrape
    ordered = [...extractFiles, ...scrapeFiles, ...otherFiles];
    console.log(`Running default (extract then scrape): ${ordered.length} script(s)`);
  }

  console.log(`Found ${allFiles.length} total script(s) in ${DATASETS_SCRIPTS_DIR}`);

  if (ordered.length === 0) {
    console.log('No scripts match the requested selection, exiting.');
    return;
  }

  ordered.forEach(runScript);

  console.log('\n✔ All requested dataset scripts completed successfully');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export default main;
