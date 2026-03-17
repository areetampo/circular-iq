
/**
 * extract_ifixit.js - Extracts problem/solution pairs from iFixit repairability scores
 *
 * Processes multiple device categories and converts each bullet point in the "Summary"
 * field into a standardized row.
 *
 * Features:
 *   • Reads all CSV files from datasets/raw/ifixit/
 *   • Determines category from filename
 *   • Parses the Summary field (bullet list with +, -, •)
 *   • For each bullet, generates a problem and solution (with fallbacks)
 *   • Stores bullet type and original data in metadata_json
 *   • Scores each row based on text length, keyword density, bullet type, and repairability score extremity
 *   • Keeps only the top MAX_ROWS (default 300) highest-quality rows
 *   • Outputs standardized CSV to datasets/processed/ifixit_processed.csv
 *
 * Usage:
 *   node datasets/scripts/extract_ifixit.js
 *
 * Dependencies:
 *   - csv-parse/sync
 *   - #utils/datasetsUtils.js for path helpers, writeCsv, formatId, cleanText
 */

import {
    cleanText,
    DATASET_KEYS,
    DATASET_LOOKUP,
    getDatasetProcessedCsvPath,
    getDatasetRawDir,
    verifyPathsExist,
    writeCsv,
} from '#utils/datasetsUtils.js';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ===== CONFIGURATION =====
const DATASET_KEY = DATASET_KEYS.ifixit;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const RAW_DIR = getDatasetRawDir(DATASET_KEY);
const outputPath = getDatasetProcessedCsvPath(DATASET_KEY);
verifyPathsExist(RAW_DIR);

const inputFiles = Object.values(dataset.raw_folder_contents).map((file) =>
  path.join(RAW_DIR, file),
);
verifyPathsExist(inputFiles);

const MAX_ROWS = 300; // Number of highest‑quality rows to keep

const KEYWORDS = [
  'battery',
  'screen',
  'display',
  'port',
  'usb',
  'adhesive',
  'glue',
  'screw',
  'modular',
  'soldered',
];
const BULLET_WEIGHTS = {
  positive: 15, // explicit solution
  negative: 20, // explicit problem
  neutral: 5, // less informative
};
// ==========================

// Helper to generate a generic problem from a positive bullet
function generateProblemFromBullet(bullet) {
  const lower = bullet.toLowerCase();
  if (lower.includes('battery'))
    return 'Battery replacement is difficult or requires special tools.';
  if (lower.includes('screen') || lower.includes('display'))
    return 'Screen repair is often complex and risky.';
  if (lower.includes('port') || lower.includes('usb'))
    return 'Ports are common failure points and hard to replace.';
  if (lower.includes('screw')) return 'Proprietary or multiple screw types complicate disassembly.';
  if (lower.includes('adhesive') || lower.includes('glue'))
    return 'Excessive adhesive makes repairs difficult and increases risk of damage.';
  if (lower.includes('modular'))
    return 'Non-modular design forces replacement of expensive assemblies.';
  return 'Repairability is hindered by design choices.';
}

// Helper to generate a generic solution from a negative bullet
function generateSolutionFromBullet(bullet) {
  const lower = bullet.toLowerCase();
  if (lower.includes('battery'))
    return 'Design battery with easy removal (e.g., pull tabs, no adhesive).';
  if (lower.includes('screen') || lower.includes('display'))
    return 'Prioritize screen repair by making display the first component out and using minimal adhesive.';
  if (lower.includes('port') || lower.includes('usb'))
    return 'Use modular, socketed ports that can be replaced independently.';
  if (lower.includes('screw')) return 'Standardize screws (e.g., Phillips) and minimize types.';
  if (lower.includes('adhesive') || lower.includes('glue'))
    return 'Replace adhesives with mechanical fasteners or stretch-release adhesive.';
  if (lower.includes('modular'))
    return 'Adopt modular design so individual components can be replaced without discarding whole assemblies.';
  return 'Improve design to facilitate easier repair and part replacement.';
}

// Extract materials from bullet text (simple keyword matching)
function extractMaterials(bulletText) {
  const lower = bulletText.toLowerCase();
  const materials = [];
  if (lower.includes('glass')) materials.push('glass');
  if (lower.includes('adhesive') || lower.includes('glue')) materials.push('adhesive');
  if (lower.includes('screw')) materials.push('screws');
  if (lower.includes('battery')) materials.push('battery');
  if (lower.includes('screen') || lower.includes('display')) materials.push('display');
  return materials.join(', ');
}

// Determine circular strategy based on bullet text
function determineStrategy(bulletText) {
  const lower = bulletText.toLowerCase();
  if (lower.includes('modular')) return 'Modular design';
  if (lower.includes('recycl')) return 'Recyclable materials';
  if (lower.includes('disassembl')) return 'Design for disassembly';
  return 'Repair';
}

// Compute a quality score for a row (higher is better)
function computeScore(row, bulletType, repairabilityScore) {
  let score = 0;

  // 1. Text length (longer is better)
  const problemLen = row.problem?.length || 0;
  const solutionLen = row.solution?.length || 0;
  score += (problemLen + solutionLen) / 100;

  // 2. Keyword matches in combined problem+solution
  const combined = (row.problem + ' ' + row.solution).toLowerCase();
  let keywordCount = 0;
  KEYWORDS.forEach((kw) => {
    if (combined.includes(kw)) keywordCount++;
  });
  score += keywordCount * 10;

  // 3. Bullet type weight
  score += BULLET_WEIGHTS[bulletType] || 5;

  // 4. Repairability score extremity (extreme scores are more interesting)
  if (!isNaN(repairabilityScore)) {
    score += Math.abs(repairabilityScore - 5) * 2;
  }

  return score;
}

async function main() {
  console.log(`Reading CSV files from: ${RAW_DIR}`);
  const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.csv'));
  if (files.length === 0) {
    console.warn('No CSV files found.');
    return;
  }

  const allRows = []; // will hold objects: { row, bulletType, repairabilityScore }

  for (const file of files) {
    const category = path
      .basename(file, '.csv')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    const filePath = path.join(RAW_DIR, file);
    console.log(`Processing ${file} (category: ${category})`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });

    for (const record of records) {
      const {
        OEM,
        Device,
        Date: releaseDate,
        Summary,
        Score,
        Note,
        'Scorecard Version': scorecardVersion,
      } = record;
      const repairabilityScore = parseFloat(Score);

      // Split Summary into bullet lines
      const bullets = Summary.split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      for (const bullet of bullets) {
        let bulletText = bullet;
        let type = 'neutral'; // default

        if (bullet.startsWith('+')) {
          type = 'positive';
          bulletText = bullet.substring(1).trim();
        } else if (bullet.startsWith('-')) {
          type = 'negative';
          bulletText = bullet.substring(1).trim();
        } else if (bullet.startsWith('•')) {
          type = 'neutral';
          bulletText = bullet.substring(1).trim();
        }

        bulletText = cleanText(bulletText);
        if (!bulletText) continue;

        let problem, solution;

        if (type === 'positive') {
          solution = bulletText;
          problem = generateProblemFromBullet(bulletText);
        } else if (type === 'negative') {
          problem = bulletText;
          solution = generateSolutionFromBullet(bulletText);
        } else {
          // neutral – both fields same
          problem = bulletText;
          solution = bulletText;
        }

        const materials = extractMaterials(bulletText);
        const strategy = determineStrategy(bulletText);
        const impact = Score ? `Repairability score: ${Score}/10` : '';

        // Construct source URL (simplified slug)
        const deviceSlug = Device.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const sourceUrl = `https://www.ifixit.com/repairability/${deviceSlug}`;

        // Metadata – include bullet type for scoring traceability
        const metadata = {
          oem: OEM,
          device: Device,
          release_date: releaseDate,
          repairability_score: Score,
          note: Note || '',
          scorecard_version: scorecardVersion,
          category,
          source_file: file,
          bullet_type: type,
          original_bullet: bullet, // optional, can be removed if too verbose
        };

        const row = {
          problem: cleanText(problem),
          solution: cleanText(solution),
          materials,
          circular_strategy: strategy,
          category,
          impact,
          source_url: sourceUrl,
          metadata_json: JSON.stringify(metadata),
        };

        // Compute quality score now (needs bulletType and repairabilityScore)
        const score = computeScore(row, type, repairabilityScore);
        allRows.push({ row, score });
      }
    }
  }

  console.log(`Total raw rows generated: ${allRows.length}`);

  // Sort by score descending and keep top MAX_ROWS
  allRows.sort((a, b) => b.score - a.score);
  const topRows = allRows.slice(0, MAX_ROWS).map((item) => item.row);

  console.log(
    `Keeping top ${topRows.length} rows (score range: ${allRows[0].score.toFixed(2)} – ${allRows[MAX_ROWS - 1]?.score.toFixed(2)})`,
  );

  const writeResult = await writeCsv(DATASET_KEY, outputPath, topRows);
  console.log(
    `✓ Written ${writeResult.writtenCount} rows to ${outputPath} (duplicate rows removed: ${writeResult.duplicateCount})`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Error processing iFixit dataset:', err);
    process.exit(1);
  });
}
