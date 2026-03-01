/**
 * datasetsUtils.js
 *
 * Centralized utilities for dataset scripts:
 *   - filesystem paths
 *   - dataset registry (DATASETS, DATASET_LOOKUP)
 *   - CSV processing (columns, stringify options, ID formatting)
 *   - Text cleaning
 *   - Puppeteer browser configuration
 *   - User agent & HTTP headers
 *
 * Follows DRY principle to eliminate boilerplate across all dataset scripts.
 */

import path from 'path';
import fs from 'fs';
import { stringify } from 'csv-stringify/sync';
import { fileURLToPath } from 'url';
import { BACKEND_CONFIG } from '#config/backend.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// FILESYSTEM PATHS
// =============================================================================

// root of the backend project (one level up from utils/)
export const BACKEND_ROOT = path.resolve(__dirname, '..');
// dataset directory moved out of utils; reference via backend root
export const DATASETS_DIR = path.join(BACKEND_ROOT, 'datasets');
export const DATASETS_RAW_DIR = path.join(DATASETS_DIR, 'raw');
export const DATASETS_PROCESSED_DIR = path.join(DATASETS_DIR, 'processed');
export const DATASETS_MANUAL_ENTRIES_DIR = path.join(DATASETS_DIR, 'manual_entries');
export const DATASETS_SCRIPTS_DIR = path.join(DATASETS_DIR, 'scripts');

export const DATASETS_ARCHIVES_DIR = path.join(DATASETS_DIR, 'archives');
export const DATASETS_SCRAPE_BACKUP_DIR = path.join(DATASETS_ARCHIVES_DIR, 'scrape_backup');
// older name kept temporarily for backward compatibility pointing at same path
export const DATASETS_SCRAPE_ARCHIVES_DIR = DATASETS_SCRAPE_BACKUP_DIR;

// archived output files stored at root of archives/ alongside scrape_backup

export const ARCHIVES_COMBINED_INPUT_CSV = path.join(DATASETS_ARCHIVES_DIR, 'combined_input.csv');
export const ARCHIVES_CHUNKS_JSON = path.join(DATASETS_ARCHIVES_DIR, 'chunks.json');
export const ARCHIVES_EMBEDDED_CHUNKS_JSON = path.join(
  DATASETS_ARCHIVES_DIR,
  'embedded_chunks.json',
);

// NOTE: only scrape_backup is a directory within archives/; other dataset
// components live in the normal dataset directories. Only the root CSV files are
// placed directly inside archives/.

// output directory holds generated artifacts that are safe to regenerate
export const DATASETS_OUTPUT_DIR = path.join(DATASETS_DIR, 'out');

export const COMBINED_INPUT_CSV = path.join(DATASETS_OUTPUT_DIR, 'combined_input.csv');
export const CHUNKS_JSON = path.join(DATASETS_OUTPUT_DIR, 'chunks.json');
export const EMBEDDED_CHUNKS_JSON = path.join(DATASETS_OUTPUT_DIR, 'embedded_chunks.json');
export const STORED_DOCUMENTS_JSONL = path.join(DATASETS_OUTPUT_DIR, 'stored_documents.jsonl');

// archived stored documents (for dry-run in archive mode)
export const ARCHIVES_STORED_DOCUMENTS_JSONL = path.join(
  DATASETS_ARCHIVES_DIR,
  'stored_documents.jsonl',
);

// =============================================================================
// DATASET REGISTRY
// =============================================================================

// Number of digits for zero-padding IDs (e.g., 00001). Adjust as needed for expected dataset sizes.
// With 5 digits, we can handle up to 99,999 entries before switching to natural expansion (100000, 100001, etc.) without breaking the ID format.
export const ID_DIGITS = 5;

/**
 * Dataset registry
 * Each object represents a processed dataset and contains:
 *   key                unique short identifier (used for lookups/prefixes)
 *   name               human-readable title
 *   raw_folder         name of corresponding directory under `datasets/raw` or null
 *   processed_csv      filename of the processed CSV sitting in `datasets/processed`
 *   scrape_script      path to a scraping script under `datasets/scripts` (or null)
 *   extract_script     path to an extraction script under `datasets/scripts` (or null)
 *   source_url         main source/homepage URL for this dataset (or null if scraped)
 *   urls               object containing API/config URLs used by script (or null). Keys should be descriptive so scripts can reference them directly.
 *   raw_folder_contents object containing specific file references in raw folder (or null). This must enumerate **every** file actually present, with clear property names, allowing downstream scripts to access them by name rather than hardcoding filenames.
 *   prefix             auto-generated as key + '_'
 */
export const DATASETS = [
  {
    key: 'c2c',
    name: 'C2C Registry',
    raw_folder: null,
    processed_csv: 'c2c_registry.csv',
    scrape_script: path.join(DATASETS_SCRIPTS_DIR, 'scrape_c2c.js'),
    extract_script: null,
    source_url: null,
    urls: {
      homepage: 'https://c2ccertified.org/certified-products',
    },
    raw_folder_contents: null,
    archive_csv: 'c2c_scrape_backup.csv',
  },
  {
    key: 'cgr',
    name: 'Circularity Gap Report 2025',
    raw_folder: 'circularity_gap_report',
    processed_csv: 'cgr_2025_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_cgr_2025.js'),
    source_url: 'https://www.circularity-gap.world/2025',
    urls: {
      homepage: 'https://www.circularity-gap.world/2025',
    },
    raw_folder_contents: {
      report: 'cgr_2025.pdf',
      // the raw folder actually contains additional csv/pdf files but they are
      // not consumed by the current extraction logic; listed for completeness
    },
    archive_csv: null, // no scraping
  },
  {
    key: 'dataeu',
    name: 'Data Europa',
    raw_folder: 'data_europa',
    processed_csv: 'data_europa_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_data_europa.js'),
    source_url: 'https://data.europa.eu/',
    urls: {
      homepage: 'https://data.europa.eu/',
    },
    raw_folder_contents: {
      projects_csv: '234400034-close_data-projets-economie-circulaire-en-pays-de-la-loire.csv',
      recycling_csv: 'estat_cei_wm011_en.csv',
      hazardous_csv: 'estat_sdg_12_41_en.csv',
      pdf_1: 'KS-02-24-643-EN-N.pdf',
      pdf_2: 'KS-05-24-071-EN-N.pdf',
      pdf_3: '63329.pdf',
    },
    archive_csv: null,
  },
  {
    key: 'ecesp',
    name: 'ECESP Good Practices',
    raw_folder: null,
    processed_csv: 'ecesp_good_practices_processed.csv',
    scrape_script: path.join(DATASETS_SCRIPTS_DIR, 'scrape_ecesp.js'),
    extract_script: null,
    source_url: 'https://circulareconomy.europa.eu/platform/en/good-practices',
    urls: {
      homepage: 'https://circulareconomy.europa.eu/platform/en/good-practices',
      target: 'https://circulareconomy.europa.eu/platform/en/good-practices',
    },
    raw_folder_contents: null,
    archive_csv: 'ecesp_good_practices_scrape_backup.csv',
  },
  {
    key: 'emf',
    name: 'EMF Case Studies',
    raw_folder: null,
    processed_csv: 'emf_case_studies.csv',
    scrape_script: path.join(DATASETS_SCRIPTS_DIR, 'scrape_emf.js'),
    extract_script: null,
    source_url: null,
    urls: {
      target:
        'https://www.ellenmacarthurfoundation.org/explore?sortBy=dateDesc&contentType=CaseStudy',
    },
    raw_folder_contents: null,
    archive_csv: 'emf_scrape_backup.csv',
  },
  {
    key: 'env',
    name: 'Environmental Sustainability',
    raw_folder: 'environmental_sustainability',
    processed_csv: 'environmental_sustainability_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_environmental_sustainability.js'),
    source_url: null,
    urls: null,
    raw_folder_contents: {
      data: 'environmental_sustainability.csv',
    },
    archive_csv: null,
  },
  {
    key: 'epa',
    name: 'EPA TRI',
    raw_folder: 'epa_tri',
    processed_csv: 'epa_tri_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_epa_tri.js'),
    source_url: null,
    urls: null,
    raw_folder_contents: {
      us_data: '2024_us.csv',
      transfers: 'chemical_transfer.csv',
    },
    archive_csv: null,
  },
  {
    key: 'eulac',
    name: 'Eulac Case Studies',
    raw_folder: 'eulac_case_studies',
    processed_csv: 'eulac_case_studies_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_eulac_case_studies.js'),
    source_url: null,
    urls: null,
    raw_folder_contents: {
      cases: 'eulac_case_studies.pdf',
    },
    archive_csv: null,
  },
  {
    key: 'eurostat',
    name: 'Eurostat',
    raw_folder: 'eurostat',
    processed_csv: 'eurostat_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_eurostat.js'),
    source_url: null,
    urls: null,
    raw_folder_contents: {
      linear_1: 'cei_pc031_linear_2_0.csv',
      linear_2: 'cei_pc032_linear_2_0.csv',
      material_use: 'circular_material_use.csv',
      dmc_per_capita: 'eurostat_dmc_per_capita.csv',
      waste: 'waste_generation.csv',
    },
    archive_csv: null,
  },
  {
    key: 'fashion',
    name: 'Fashion Transparency Index',
    raw_folder: 'fashion_transparency_index',
    processed_csv: 'fashion_transparency_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_fashion_transparency.js'),
    source_url: null,
    urls: null,
    raw_folder_contents: {
      what_fuels_fashion_report: 'what_fuels_fashion_report.pdf',
      input_answers: 'Wikirate-2026_02_24_185804-Fashion_Transparency_Index_2025+Input Answer.csv',
      answers_1: 'Wikirate-2026_02_24_190235-Fashion_Transparency_Index_2025+Answer.csv',
      answers_2: 'Wikirate-2026_02_24_190257-Fashion_Transparency_Index_2025+Answer.csv',
    },
    archive_csv: null,
  },
  {
    key: 'ghg',
    name: 'GHG Emissions',
    raw_folder: 'ghg_emissions',
    processed_csv: 'ghg_emissions_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_ghg.js'),
    source_url: null,
    urls: null,
    raw_folder_contents: {
      ar5_ghg: 'EDGAR_AR5_GHG_1970_2024.csv',
      ch4: 'EDGAR_CH4_1970_2024.csv',
      co2_bio: 'EDGAR_CO2bio_1970_2024.csv',
      f_gases: 'EDGAR_F-gases_1990_2024.csv',
      n2o: 'EDGAR_N2O_1970_2024.csv',
      nox: 'EDGAR_NOx_1970_2024.csv',
      pm2_5: 'EDGAR_PM2.5_1970_2024.csv',
      iea_co2: 'IEA_EDGAR_CO2_1970_2024.csv',
    },
    archive_csv: null,
  },
  {
    key: 'gewm',
    name: 'Global E-Waste Monitor 2024',
    raw_folder: 'global_ewaste_monitor',
    processed_csv: 'global_ewaste_monitor_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_gewm.js'),
    source_url: null,
    urls: null,
    raw_folder_contents: {
      data: 'global_ewaste_monitor_raw.csv',
      report: 'global_ewaste_monitor_2024.pdf',
    },
    archive_csv: null,
  },
  {
    key: 'gtg',
    name: 'Greentech Guardians',
    raw_folder: 'greentechguardians',
    processed_csv: 'greentechguardians_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_greentechguardians.js'),
    source_url: null,
    urls: null,
    raw_folder_contents: {
      ai_dataset: 'AI_EarthHack_Dataset.csv',
      combined_sample: 'combined_data_first_200_rows.jsonl',
      extracted_sample: 'extracted_data_first_200_rows.jsonl',
      training: 'extracted_data_training_dataset.jsonl',
      validation: 'extracted_data_validation_dataset.jsonl',
    },
    archive_csv: null,
  },
  {
    key: 'kaggle',
    name: 'Kaggle LCA',
    raw_folder: 'kaggle_lca',
    processed_csv: 'kaggle_lca_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_kaggle_lca.js'),
    source_url: null,
    urls: null,
    raw_folder_contents: {
      product_lca:
        'PublicTablesForCarbonCatalogueDataDescriptor_v30Oct2021(Product Level Data).csv',
      livestock: 'GLEAM_LivestockEmissions.csv',
      supply_chain: 'green_supply_chain_dataset_1000.csv',
    },
    archive_csv: null,
  },
  {
    key: 'mnd',
    name: 'Mendeley Data',
    raw_folder: 'mendeley_downloads',
    processed_csv: 'mendeley_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_mendeley.js'),
    source_url: null,
    urls: null,
    raw_folder_contents: {
      mask_lca: 'lci surgical masks.xlsx',
      sme_practices:
        'Copy of sustainability practices in African SME supply chains_June 17, 2023_05.11.xlsx',
      bwm_scores: 'swara bwm data.xlsx',
      network_scores: 'Combined Network Centrality Scores.xlsx',
      business_model: 'sustainable business model dataset.csv',
    },
    archive_csv: null,
  },
  {
    key: 'oecd',
    name: 'OECD Stats',
    raw_folder: 'oecd',
    processed_csv: 'oecd_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_oecd.js'),
    source_url: 'https://data-explorer.oecd.org/',
    urls: null,
    raw_folder_contents: {
      municipal_waste: 'oecd_municipal_waste.csv',
      selected_streams: 'oecd_selected_streams.csv',
      capmf: 'oecd_capmf.csv',
    },
    archive_csv: null,
  },
  {
    key: 'obf',
    name: 'Open Beauty Facts',
    raw_folder: null,
    processed_csv: 'open_beauty_facts_processed.csv',
    scrape_script: path.join(DATASETS_SCRIPTS_DIR, 'scrape_open_beauty_facts.js'),
    extract_script: null,
    source_url: null,
    urls: {
      search: 'https://world.openbeautyfacts.org/cgi/search.pl',
      product: 'https://world.openbeautyfacts.org/product',
    },
    raw_folder_contents: null,
    archive_csv: 'obf_scrape_backup.csv',
  },
  {
    key: 'off',
    name: 'Open Food Facts',
    raw_folder: null,
    processed_csv: 'open_food_facts_processed.csv',
    scrape_script: path.join(DATASETS_SCRIPTS_DIR, 'scrape_open_food_facts.js'),
    extract_script: null,
    source_url: null,
    urls: {
      search: 'https://world.openfoodfacts.org/cgi/search.pl',
      product: 'https://world.openfoodfacts.org/product',
    },
    raw_folder_contents: null,
    archive_csv: 'off_scrape_backup.csv',
  },
  {
    key: 'opf',
    name: 'Open Products Facts',
    raw_folder: null,
    processed_csv: 'open_products_facts_processed.csv',
    scrape_script: path.join(DATASETS_SCRIPTS_DIR, 'scrape_open_products_facts.js'),
    extract_script: null,
    source_url: null,
    urls: {
      search: 'https://world.openproductsfacts.org/cgi/search.pl',
      product: 'https://world.openproductsfacts.org/product',
    },
    raw_folder_contents: null,
    archive_csv: 'opf_scrape_backup.csv',
  },
  {
    key: 'sei',
    name: 'SEI Construction',
    raw_folder: 'sei_construction',
    processed_csv: 'sei_construction_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_sei_construction.js'),
    source_url: 'https://www.wbcsd.org/',
    urls: null,
    raw_folder_contents: {
      chartwell: 'SEI-CE-WG-Circular-Economy-Case-Studies_1-Chartwell-School.pdf',
      boulder_hospital: 'SEI-CE-WG-Circular-Economy-Case-Studies_2-Boulder-Community-Hospital.pdf',
      green_valley: 'SEI-CE-WG-Circular-Economy-Case-Studies_3-Green-Valley-Road-Bridge.pdf',
      circulating_matters: 'SEI-CE-WG-Circular-Economy-Case-Studies_4-Circulating-Matters.pdf',
      villa_welpeloo: 'SEI-CE-WG-Circular-Economy-Case-Studies_5-Villa-Welpeloo.pdf',
      k118_kopfbau: 'SEI-CE-WG-Circular-Economy-Case-Studies_6-K118-Kopfbau-Halle.pdf',
      mountain_coop: 'SEI-CE-WG-Circular-Economy-Case-Studies_7-Mountain-Equipment-Coop.pdf',
      stadium_974: 'SEI-CE-WG-Circular-Economy-Case-Studies_8-Stadium-974.pdf',
      brasada_ranch: 'SEI-CE-WG-Circular-Economy-Case-Studies_9-Brasada-Ranch-Resort.pdf',
      lucie_breard: 'SEI-CE-WG-Circular-Economy-Case-Studies_10-Lucie-Breard-Footbridge_2025.pdf',
      saxum_vineyard: 'SEI-CE-WG-Circular-Economy-Case-Studies_11-Saxum-Vineyard_2025.pdf',
      buckner: 'SEI-CE-WG-Circular-Economy-Case-Studies_12-Buckner-Companies_2025.pdf',
      elementa: 'SEI-CE-WG-Circular-Economy-Case-Studies_13-Elementa_2025.pdf',
      kendeda: 'SEI-CE-WG-Circular-Economy-Case-Studies_14-Kendeda-Building_2025.pdf',
      boulder_fire: 'SEI-CE-WG-Circular-Economy-Case-Studies_15-Boulder-Fire-Station-3_2025.pdf',
      peoples_pavilion: 'SEI-CE-WG-Circular-Economy-Case-Studies_16-Peoples-Pavilion_2025.pdf',
      holbein_gardens: 'SEI-CE-WG-Circular-Economy-Case-Studies_17-Holbein-Gardens_2025.pdf',
    },
    archive_csv: null,
  },
  {
    key: 'unep',
    name: 'UNEP Material Flows',
    raw_folder: 'unep',
    processed_csv: 'unep_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_unep.js'),
    source_url: 'https://www.unep.org/resources/global-waste-management-outlook-2024',
    urls: {
      irp: 'https://unep-irp.fineprint.global/',
      gmwo: 'https://www.unep.org/resources/global-waste-management-outlook-2024',
      sdg: 'https://unstats.un.org/sdgs/dataportal',
    },
    raw_folder_contents: {
      material_footprint: 'material_footprint_per_capita.csv',
      global_flows: 'unep_global_material_flows.csv',
      gwmo: 'gwmo_consolidated_2024.csv',
      countries_msw: 'countries_msw.csv',
    },
    archive_csv: null,
  },
  {
    key: 'wbcsd',
    name: 'WBCSD Cases',
    raw_folder: 'wbcsd',
    processed_csv: 'wbcsd_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_wbcsd.js'),
    source_url: 'https://www.wbcsd.org/',
    urls: null,
    raw_folder_contents: {
      aptar: 'Aptar-Case-study.pdf',
      allnex: 'Allnex-Case-Study-final.pdf',
      business_cases: '8-Business-cases-for-the-circular-economy.pdf',
      ceo_guide: 'CEO_Guide_to_CE.pdf',
      cirfood: 'CIRFOOD-Case-Study.pdf',
      cti_auping: 'CTI-case-study-Auping.pdf',
      dsm_cti: 'DSM_CTI_Case_study.pdf',
      edp: 'EDP-case-study.pdf',
      efacec_1: 'Efacec-Case-Study-PDF.pdf',
      efacec_2: 'Efacec-Case-study.pdf',
      enovik: 'ENOVIK-Case-Study-final.pdf',
      factor10: 'Factor10.pdf',
      feralpi: 'Feralpi-Case-Study.pdf',
      galp: 'GALP-Case-study.pdf',
      hovione: 'Hovione-Case-study.pdf',
      lanxess: 'Lanxess-Case-Study_final.pdf',
      lipor: 'LIPOR-Case-study_final.pdf',
      measuring_buildings: 'Measuring-circular-buildings_key-considerations.pdf',
      microsoft: 'Microsoft-case-study.pdf',
      navigator: 'The-Navigator-case-study.pdf',
      plastics_protocol: 'Enabling-corporate-plastics-disclosure-Building-a-plastics-protocol.pdf',
      roteks: 'ROTEKS-Case-Study.pdf',
      secil: 'Secil-Case-study.pdf',
      sika: 'Sika_CTI_Case_Study.pdf',
      sovena: 'Sovena-Case-study.pdf',
      whirlpool: 'Whirlpool_CTI_Case_study.pdf',
      wbcsd_scoping: 'WBCSD_CDX_Scoping_White_Paper.pdf',
      // latest KPI report file included dynamically as needed by scripts
      fsg_kpi: 'FSG-KPI-Results_2025.pdf',
    },
    archive_csv: null,
  },
  {
    key: 'wbp',
    name: 'World Bank Projects',
    raw_folder: 'world_bank_projects',
    processed_csv: 'world_bank_projects_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_world_bank_projects.js'),
    source_url: 'https://search.worldbank.org/api/v2/projects',
    urls: {
      basic: 'https://search.worldbank.org/api/v2/projects?format=json&rows=500',
      detailed:
        'https://search.worldbank.org/api/v2/projects?format=json&fl=id,project_name,abstract,goal,sector,mjtheme_namecode,totalamt,lendinginstr,countryname,boardapprovaldate&rows=500&kw=waste+OR+circular+OR+recycling+OR+resource',
    },
    raw_folder_contents: {
      basic_json: 'world_bank_projects.json',
      detailed_json: 'world_bank_projects_detailed.json',
      taxonomy: 'wb_sector_taxonomy.json',
      taxonomy_pdf: 'wb_sector_taxonomy.pdf',
      report_laos_roads: 'reports/report_laos_roads.pdf',
      report_laos_finance: 'reports/report_laos_finance.pdf',
      report_iraq: 'reports/report_iraq_fiscal.pdf',
      report_comoros: 'reports/report_comoros_policy.pdf',
    },
    archive_csv: null,
  },
];

// Automatically add prefix field from key
DATASETS.forEach((ds) => {
  ds.prefix = `${ds.key}_`;
});

// Exported keys object for use in scripts (avoids literal strings)
export const DATASET_KEYS = DATASETS.reduce((acc, ds) => {
  acc[ds.key] = ds.key;
  return acc;
}, {});

/**
 * Lookup table generated from DATASETS.
 *
 * Usage:
 *   const ds = DATASET_LOOKUP['epa'];
 *   console.log(ds.processed_csv); // epa_tri_processed.csv
 *
 * The lookup makes it easy to convert a known dataset key into the full
 * metadata object without iterating over the array.
 */
export const DATASET_LOOKUP = DATASETS.reduce((acc, it) => {
  acc[it.key] = it;
  return acc;
}, {});

/**
 * Get the full path to a dataset's raw directory.
 * Usage: const rawDir = getDatasetRawDir('epa');
 */
export function getDatasetRawDir(key) {
  const dataset = DATASET_LOOKUP[key];
  if (!dataset) throw new Error(`Dataset key not found: ${key}`);
  if (!dataset.raw_folder) return null;
  return path.join(DATASETS_RAW_DIR, dataset.raw_folder);
}

/**
 * Get the full path to a dataset's processed CSV output.
 * Usage: const outPath = getDatasetOutputPath('epa');
 */
export function getDatasetOutputPath(key) {
  const dataset = DATASET_LOOKUP[key];
  if (!dataset) throw new Error(`Dataset key not found: ${key}`);
  return path.join(DATASETS_PROCESSED_DIR, dataset.processed_csv);
}

/**
 * Get the path to the dataset's archive CSV (if defined).
 * Returns null if dataset.archive_csv is null.
 * Scrape backups are stored in DATASETS_SCRAPE_BACKUP_DIR (datasets/archives/scrape_backup/).
 */
export function getDatasetArchivePath(key) {
  const dataset = DATASET_LOOKUP[key];
  if (!dataset) throw new Error(`Dataset key not found: ${key}`);
  if (!dataset.archive_csv) return null;
  return path.join(DATASETS_SCRAPE_BACKUP_DIR, dataset.archive_csv);
}

/**
 * Ensure a directory exists, creating it recursively if necessary.
 * Returns the path (for convenience).
 */
export async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true });
  return dirPath;
}

/**
 * Append rows to the dataset's archive CSV, creating or clearing as requested.
 * @param {string} key - dataset key
 * @param {Array<Object>} rows - rows ready for stringify
 * @param {Object} [opts]
 * @param {boolean} opts.clear - if true, delete existing contents first
 */
export async function appendToArchive(key, rows, opts = {}) {
  const { clear = false } = opts;
  const archivePath = getDatasetArchivePath(key);
  if (!archivePath) return; // nothing to do for datasets without archive

  await ensureDir(DATASETS_ARCHIVES_DIR);
  let exists = true;
  try {
    await fs.promises.access(archivePath);
  } catch {
    exists = false;
  }

  if (clear && exists) {
    // unlock and wipe
    await fs.promises.chmod(archivePath, 0o666).catch(() => {});
    await fs.promises.writeFile(archivePath, '');
    exists = false;
  }

  const options = exists ? { ...STRINGIFY_OPTIONS, header: false } : STRINGIFY_OPTIONS;
  const csv = stringify(rows, options);

  if (exists) {
    await fs.promises.appendFile(archivePath, csv);
  } else {
    await fs.promises.writeFile(archivePath, csv);
  }

  // make read-only after write
  await fs.promises.chmod(archivePath, 0o444).catch(() => {});
}

/**
 * Helper to batch backup rows every `interval` calls and manage clearing.
 * @param {string} key dataset key
 * @param {number} interval number of calls/pages between writes
 * @param {boolean} clearOnFirst whether to clear file on first write
 */
export function createBackupHelper(key, interval = 3, clearOnFirst = false) {
  let counter = 0;
  let buffer = [];
  return {
    async add(rows) {
      if (!rows || rows.length === 0) return;
      buffer.push(...rows);
      counter++;
      if (counter % interval === 0) {
        await appendToArchive(key, buffer, { clear: counter === interval && clearOnFirst });
        buffer = [];
      }
    },
    async flush() {
      if (buffer.length > 0) {
        await appendToArchive(key, buffer, { clear: false });
        buffer = [];
      }
    },
  };
}

// =============================================================================
// CSV PROCESSING
// =============================================================================

/**
 * Standard columns for all processed dataset CSVs.
 * Used by stringify() in all scripts.
 */
export const CSV_COLUMNS = [
  'ID',
  'problem',
  'solution',
  'materials',
  'circular_strategy',
  'category',
  'impact',
  'source_url',
  'metadata_json',
];

/**
 * Clean text for CSV cells: remove line breaks, compress whitespace, convert quotes.
 * Used in stringify() cast method to sanitize all string values.
 */
export const cleanText = (str) => {
  if (typeof str !== 'string' || !str) return '';

  return str
    .replace(/\r?\n|\r/g, ' ') // Remove line breaks
    .replace(/[\u201C\u201D"]/g, "'") // Convert "smart" and standard double quotes to single
    .replace(/'{2,}/g, "'") // Flatten ''x'' or '''x''' to 'x'
    .replace(/\s+/g, ' ') // Collapse all whitespace (tabs/multiple spaces) to one space
    .trim(); // Remove leading/trailing junk
};

/**
 * Standard CSV stringify options.
 * Uses cleanText in the cast method to sanitize all string values.
 * In case of overrides, use destructuring to maintain cleanText:
 * eg: const options = { ...STRINGIFY_OPTIONS, header: false };
 */
export const STRINGIFY_OPTIONS = {
  header: true,
  columns: CSV_COLUMNS,
  quoted: true,
  delimiter: ',',
  record_delimiter: '\n',
  cast: {
    string: (value) => cleanText(value),
  },
};

/**
 * Format ID with overflow handling.
 * Pads ID with zeros up to ID_DIGITS, then expands naturally on overflow.
 *
 * Example:
 *   formatId('epa_', 1) => 'epa_00001'
 *   formatId('epa_', 99999) => 'epa_99999'
 *   formatId('epa_', 100000) => 'epa_100000'
 */
export function formatId(prefix, index) {
  const baseLimit = Math.pow(10, ID_DIGITS) - 1;

  if (index <= baseLimit) {
    return `${prefix}${String(index).padStart(ID_DIGITS, '0')}`;
  }

  // Overflow → expand digits naturally
  return `${prefix}${String(index)}`;
}

// =============================================================================
// PUPPETEER / BROWSER CONFIGURATION
// =============================================================================

/**
 * Get standard Puppeteer browser launch options used by scraper scripts.
 *
 * Historically the behaviour differed between production and development,
 * but in our repo scraping never runs in production.  Instead the default is
 * always headless; pass `--show` on the command line if you want a visible
 * browser window for troubleshooting.
 */
export function getBrowserLaunchOptions() {
  // Most scraping runs happen locally during development.  By default we
  // keep Puppeteer in headless mode so that the browser window does **not**
  // open whenever a script is executed.  This makes automated runs faster
  // and avoids cluttering the desktop.  A simple command‑line flag can be
  // used when debugging.
  //
  // Usage:
  //   node datasets/scripts/scrape_ecesp.js            # headless (default)
  //   node datasets/scripts/scrape_ecesp.js --show     # open browser window
  const showUi = process.argv.includes('--show');

  if (showUi) {
    // visible window, maximise for easier inspection
    return {
      headless: false,
      args: ['--start-maximized'],
    };
  }

  // headless mode with sandbox restrictions (safe and fast)
  return {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
}

/**
 * Get standard viewport settings for Puppeteer.
 * Ensures consistent element rendering across all scripts.
 */
export function getViewportOptions() {
  return {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  };
}

/**
 * Get standard user agent settings for Puppeteer.
 * Mimics a modern Chrome browser to avoid detection as a bot.
 */
export function getUserAgentOptions() {
  return {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    userAgentMetadata: {
      brands: [
        { brand: 'Not_A Brand', version: '8' },
        { brand: 'Chromium', version: '120' },
        { brand: 'Google Chrome', version: '120' },
      ],
      platform: 'Windows',
      platformVersion: '10.0.0',
      architecture: 'x86',
      model: '',
      mobile: false,
    },
  };
}

/**
 * Get standard HTTP headers for Puppeteer requests.
 * Helps avoid blocking by websites that detect bots.
 */
export function getExtraHttpHeaders() {
  return {
    'accept-language': 'en-US,en;q=0.9',
  };
}
