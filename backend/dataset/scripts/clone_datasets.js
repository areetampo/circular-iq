#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAW_DIR = path.join(__dirname, '..', 'raw');
const urls = [
  // Typical public data sources (best-effort). Some links may fail; script will continue.
  {
    url: 'https://raw.githubusercontent.com/worldbank/projects-data/master/projects.csv',
    name: 'world_bank_sdg_projects.csv',
  },
  {
    url: 'https://raw.githubusercontent.com/datasets/e-waste/master/data/e-waste.csv',
    name: 'e_waste_monitor.csv',
  },
  {
    url: 'https://raw.githubusercontent.com/open-product-data/open-product-database/main/data/products.csv',
    name: 'open_product_data.csv',
  },
  {
    url: 'https://raw.githubusercontent.com/EuropeanDataPlatform/circular-economy-datasets/main/eu_circular_initiatives.csv',
    name: 'eu_circular_initiatives.csv',
  },
  {
    url: 'https://raw.githubusercontent.com/green-tech/education-samples/main/lca_assessments.csv',
    name: 'kaggle_lca_data.csv',
  },
  {
    url: 'https://raw.githubusercontent.com/openfoodfacts/openfoodfacts-server/master/data/openfoodfacts.csv',
    name: 'open_food_facts_sample.csv',
  },
  {
    url: 'https://raw.githubusercontent.com/UNIDO-datasets/industrial-development/main/indicators.csv',
    name: 'unido_industrial_stats.csv',
  },
];

async function download(url, dest) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const txt = await res.text();
    fs.writeFileSync(dest, txt, 'utf8');
    console.log('Downloaded', url, '->', dest);
    return true;
  } catch (err) {
    console.warn('Failed to download', url, ':', err.message);
    return false;
  }
}

async function main() {
  if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

  console.log('Attempting to fetch public datasets into', RAW_DIR);

  for (const u of urls) {
    const dest = path.join(RAW_DIR, u.name);
    // Overwrite existing file
    const ok = await download(u.url, dest);
    if (!ok) {
      // Create a tiny placeholder CSV so adapter can still merge
      if (!fs.existsSync(dest)) {
        fs.writeFileSync(dest, 'id,problem,solution,source\n', 'utf8');
        console.log('Wrote placeholder for', dest);
      }
    }
  }

  console.log('Clone step complete. Check', RAW_DIR);
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1].endsWith('clone_datasets.js')
) {
  main();
}
