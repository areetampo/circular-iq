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
 *   - Backup folder and log management
 *
 * Follows DRY principle to eliminate boilerplate across all dataset scripts.
 */

/* global process */
import path from 'path';
import fs from 'fs';
import { stringify } from 'csv-stringify/sync';
import { fileURLToPath } from 'url';

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

// archived output files stored at root of archives/
export const DATASETS_ARCHIVES_DIR = path.join(DATASETS_DIR, 'archives');

export const DATASETS_SCRAPE_BACKUP_DIR = path.join(DATASETS_ARCHIVES_DIR, 'scrape_backup');
// subfolders are created within scrape_backup/ for specific datasets' backup,
// each containing a CSV file and a logs.txt file.

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
 *   scrape_backup_folder name of the folder inside archives/scrape_backup/ (or null if no backup)
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
    scrape_backup_folder: 'c2c_scrape_backup',
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
      input_file: 'cgr_2025.pdf',
    },
    scrape_backup_folder: null, // no scraping
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
    scrape_backup_folder: null,
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
    scrape_backup_folder: 'ecesp_good_practices_scrape_backup',
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
    scrape_backup_folder: 'emf_scrape_backup',
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
    scrape_backup_folder: null,
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
    scrape_backup_folder: null,
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
    scrape_backup_folder: null,
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
    scrape_backup_folder: null,
  },
  {
    key: 'fashion',
    name: 'Fashion Transparency Index',
    raw_folder: 'fashion_transparency_index',
    processed_csv: 'fashion_transparency.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_fashion_transparency.js'),
    source_url: null,
    urls: null,
    raw_folder_contents: {
      what_fuels_fashion_report: 'what_fuels_fashion_report.pdf',
      inputFile: 'Wikirate-2026_02_24_185804-Fashion_Transparency_Index_2025+Input Answer.csv',
      scoreFile: 'Wikirate-2026_02_24_190235-Fashion_Transparency_Index_2025+Answer.csv',
      answers_2: 'Wikirate-2026_02_24_190257-Fashion_Transparency_Index_2025+Answer.csv',
    },
    scrape_backup_folder: null,
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
    scrape_backup_folder: null,
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
    scrape_backup_folder: null,
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
    scrape_backup_folder: null,
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
    scrape_backup_folder: null,
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
    scrape_backup_folder: null,
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
    scrape_backup_folder: null,
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
    scrape_backup_folder: 'obf_scrape_backup',
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
    scrape_backup_folder: 'off_scrape_backup',
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
    scrape_backup_folder: 'opf_scrape_backup',
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
    scrape_backup_folder: null,
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
    scrape_backup_folder: null,
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
    scrape_backup_folder: null,
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
    scrape_backup_folder: null,
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
 * Get the full path to a dataset's processed CSV file.
 * Usage: const csvPath = getDatasetProcessedCsvPath('epa');
 * Returns null if the dataset doesn't have a processed CSV defined.
 */
export function getDatasetProcessedCsvPath(key) {
  const dataset = DATASET_LOOKUP[key];
  if (!dataset) throw new Error(`Dataset key not found: ${key}`);
  if (!dataset.processed_csv) return null;
  return path.join(DATASETS_PROCESSED_DIR, dataset.processed_csv);
}

// =============================================================================
// BACKUP FOLDER PATHS (new)
// =============================================================================

/**
 * Get the full path to a dataset's backup folder (inside archives/scrape_backup/).
 * Uses dataset.scrape_backup_folder if defined, otherwise returns null.
 */
export function getDatasetBackupFolderPath(key) {
  const dataset = DATASET_LOOKUP[key];
  if (!dataset) throw new Error(`Dataset key not found: ${key}`);
  if (!dataset.scrape_backup_folder) return null;
  return path.join(DATASETS_SCRAPE_BACKUP_DIR, dataset.scrape_backup_folder);
}

/**
 * Get the full path to a dataset's backup CSV file.
 * The CSV filename is the folder name + '.csv'.
 */
export function getDatasetBackupCsvPath(key) {
  const folder = getDatasetBackupFolderPath(key);
  if (!folder) return null;
  const folderName = path.basename(folder);
  return path.join(folder, `${folderName}.csv`);
}

/**
 * Get the full path to a dataset's backup log file.
 * The log filename is the folder name + '_logs.txt'.
 */
export function getDatasetBackupLogPath(key) {
  const folder = getDatasetBackupFolderPath(key);
  if (!folder) return null;
  const folderName = path.basename(folder);
  return path.join(folder, `${folderName}_logs.txt`);
}

// =============================================================================
// FILE UTILITIES (ensureDir, ensureFile, prepareWrite, writeCsv, etc.)
// =============================================================================

/**
 * Ensure a directory exists, creating it recursively if necessary.
 * Returns the path (for convenience).
 */
export async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true });
  return dirPath;
}

/**
 * Ensure that a filesystem path exists as a file.
 *
 * - Creates parent directory (using ensureDir) if it doesn't exist.
 * - If the file did not previously exist, an empty file is written.
 * - Returns `true` if the file already existed, `false` if we created it.
 *
 * This is useful for scripts that may toggle the read-only bit later or
 * append to the file; calling this guarantees the folder is present and the
 * first write will operate on an empty file.
 *
 * Example:
 *   await ensureFile(outputPath);
 *   now write/append freely, file is guaranteed to exist
 */
export async function ensureFile(filePath) {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  try {
    await fs.promises.access(filePath);
    return true; // already existed
  } catch {
    // create empty file
    await fs.promises.writeFile(filePath, '');
    return false;
  }
}

/**
 * Synchronous counterpart to `ensureFile` for scripts that prefer sync I/O.
 *
 * Mirrors the behaviour: create parent directory, touch empty file if missing.
 */
export function ensureFileSync(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(filePath)) {
    return true;
  }
  fs.writeFileSync(filePath, '');
  return false;
}
/**
 * Prepare a file for writing by ensuring its parent directory exists, touching
 * an empty placeholder on first use, and unlocking it if it is currently
 * read-only. The function accepts an optional `{clear:true}` flag which will
 * also wipe any existing contents (useful at the start of a batch-driven
 * script).
 *
 * This mirrors the logic used throughout the pipeline and dataset
 * scripts and centralizes permission management.
 *
 * Returns `true` if the file already existed prior to the call (note that
 * `{clear:true}` will still return `true` but will have emptied the file),
 * `false` if it was newly created.
 */
export async function prepareWrite(filePath, opts = {}) {
  const { clear = false } = opts;
  const dir = path.dirname(filePath);
  await ensureDir(dir);

  let existed = fs.existsSync(filePath);
  if (existed) {
    // unlock file so we can overwrite/append
    try {
      fs.chmodSync(filePath, 0o644);
    } catch {
      // ignore errors on platforms that don't support chmod
    }

    // optionally wipe the existing contents if the caller requests a fresh start
    if (clear) {
      try {
        await fs.promises.writeFile(filePath, '');
      } catch {
        // ignore
      }
      existed = false;
    }
  } else {
    // create an empty placeholder to guarantee the path exists
    fs.writeFileSync(filePath, '');
  }

  return existed;
}

/**
 * Helper for writing CSV data in a consistent manner. Rows are passed in as an
 * array of objects and will be stringified using the shared
 * `STRINGIFY_OPTIONS` constant. The output file is prepared with
 * `prepareWrite` and marked read-only once the write completes.
 */
export async function writeCsv(filePath, rows) {
  await prepareWrite(filePath);
  const csv = stringify(rows, STRINGIFY_OPTIONS);
  await fs.promises.writeFile(filePath, csv);
  try {
    fs.chmodSync(filePath, 0o444);
  } catch {
    // ignore
  }
}

/**
 * Write or append newline-delimited JSON (JSONL) entries to a file.
 *
 * @param {string} filePath
 * @param {Array<Object>} items
 * @param {Object} [opts]
 * @param {boolean} opts.append - if true, append lines; otherwise overwrite
 * @param {boolean} opts.clearOnFirst - if true, clear existing contents on first flush
 */
export async function writeJsonl(filePath, items, opts = {}) {
  const { append = true, clearOnFirst = false } = opts;
  if (!items || items.length === 0) return;

  await prepareWrite(filePath);

  // If requested, clear the file on first use
  if (clearOnFirst) {
    try {
      await fs.promises.writeFile(filePath, '');
    } catch {
      /* ignore */
    }
  }

  const lines = items.map((it) => JSON.stringify(it)).join('\n') + '\n';

  if (append) {
    await fs.promises.appendFile(filePath, lines, 'utf8');
  } else {
    await fs.promises.writeFile(filePath, lines, 'utf8');
  }

  try {
    await fs.promises.chmod(filePath, 0o444);
  } catch {
    // ignore
  }
}

/**
 * Write a JSON array to a file (overwrites). Uses prepareWrite to ensure
 * directory exists and unlocks file before writing, then marks read-only.
 *
 * @param {string} filePath
 * @param {any} obj
 */
export async function writeJson(filePath, obj) {
  await prepareWrite(filePath);
  const json = JSON.stringify(obj, null, 2);
  await fs.promises.writeFile(filePath, json, 'utf8');
  try {
    fs.chmodSync(filePath, 0o444);
  } catch {
    // ignore
  }
}

// =============================================================================
// BACKUP CSV HANDLING (appendToArchive, readBackupCsv)
// =============================================================================

/**
 * Append rows to the dataset's backup CSV, creating or clearing as requested.
 * @param {string} key - dataset key
 * @param {Array<Object>} rows - rows ready for stringify
 * @param {Object} [opts]
 * @param {boolean} opts.clear - if true, delete existing contents first
 */
export async function appendToArchive(key, rows, opts = {}) {
  const { clear = false } = opts;
  const csvPath = getDatasetBackupCsvPath(key);
  if (!csvPath) return; // dataset has no backup folder defined

  // prepare file – this will also unlock it and optionally clear existing contents
  const hadBefore = await prepareWrite(csvPath, { clear });

  // if the file existed previously and we didn't clear it, omit header on append
  const options = hadBefore && !clear ? { ...STRINGIFY_OPTIONS, header: false } : STRINGIFY_OPTIONS;
  const csv = stringify(rows, options);

  if (hadBefore && !clear) {
    await fs.promises.appendFile(csvPath, csv);
  } else {
    await fs.promises.writeFile(csvPath, csv);
  }

  // lock file after writing
  await fs.promises.chmod(csvPath, 0o444).catch(() => {});
}

/**
 * Read backup CSV content for a dataset and parse rows.
 * Used in recovery mode to rebuild final CSV without re-scraping.
 *
 * @param {string} key - dataset key
 * @returns {Promise<Array<Object>>} - array of parsed CSV rows (empty array if no backup exists)
 */
export async function readBackupCsv(key) {
  const csvPath = getDatasetBackupCsvPath(key);
  if (!csvPath) return [];

  try {
    await fs.promises.access(csvPath);
  } catch {
    console.warn(`⚠️️️ Backup file not found: ${csvPath}`);
    return [];
  }

  try {
    const content = await fs.promises.readFile(csvPath, 'utf8');
    if (!content.trim()) {
      console.warn(`⚠️️️ Backup file is empty: ${csvPath}`);
      return [];
    }

    const lines = content.trim().split('\n');
    if (lines.length < 1) return [];

    const headerLine = lines[0];
    const headers = headerLine
      .split(',')
      .map((h) => h.trim().replace(/^"|"$/g, ''))
      .filter((h) => h);

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const row = {};
      let currentField = '';
      let inQuotes = false;
      let colIdx = 0;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const nextChar = line[j + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            currentField += '"';
            j++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          if (colIdx < headers.length) {
            row[headers[colIdx]] = currentField.trim();
          }
          currentField = '';
          colIdx++;
        } else {
          currentField += char;
        }
      }

      if (colIdx < headers.length) {
        row[headers[colIdx]] = currentField.trim();
      }

      rows.push(row);
    }

    console.log(`✅ Read ${rows.length} rows from backup: ${csvPath}`);
    return rows;
  } catch (err) {
    console.error(`❌ Error reading backup CSV: ${err.message}`);
    return [];
  }
}

// =============================================================================
// BACKUP LOGGING (new)
// =============================================================================

/**
 * Append a timestamped message to the dataset's backup log file.
 * The log file is never cleared; messages are appended chronologically.
 * Follows the same file locking pattern: ensure dir, make writable, append, make read-only.
 *
 * @param {string} key - dataset key
 * @param {string} message - log message (without timestamp)
 */
export async function appendBackupLog(key, message) {
  const logPath = getDatasetBackupLogPath(key);
  if (!logPath) return; // no backup folder defined

  // Ensure directory exists
  await ensureDir(path.dirname(logPath));

  // Prepare file: unlock if exists, create if not (but never clear)
  let existed = fs.existsSync(logPath);
  if (existed) {
    try {
      fs.chmodSync(logPath, 0o644);
    } catch {
      // ignore
    }
  } else {
    // create empty file
    fs.writeFileSync(logPath, '');
  }

  const now = new Date();

  const day = now.getDate().toString().padStart(2, '0');

  const monthYear = now.toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  const logLine = `\n[🕰️ ${day} ${monthYear} — ${timeStr} IST]\n${message}\n`;

  await fs.promises.appendFile(logPath, logLine, 'utf8');

  // lock file
  try {
    await fs.promises.chmod(logPath, 0o444);
  } catch {
    // ignore
  }
}

// =============================================================================
// BACKUP HELPER (createBackupHelper)
// =============================================================================

/**
 * Helper to batch backup rows every `interval` calls and manage clearing.
 * @param {string} key dataset key
 * @param {number} interval number of calls/pages between writes
 * @param {boolean} clearOnFirst whether to clear file on first write
 * @param {number} MAX_PAGES_FALLBACK fallback limit to force flush when reached
 */
export function createBackupHelper(key, interval = 3, clearOnFirst = true, MAX_PAGES_FALLBACK = 1) {
  let counter = 0;
  let buffer = [];
  let firstFlush = true; // track first write to disk

  return {
    async add(rows) {
      if (!rows || rows.length === 0) return;
      buffer.push(...rows);
      counter++;

      // Flush when interval reached OR when we hit the fallback limit
      // Flush only when interval reached – NOT on fallback limit
      if (counter % interval === 0) {
        const rowsToWrite = buffer.length;
        await appendToArchive(key, buffer, { clear: firstFlush && clearOnFirst });
        await appendBackupLog(
          key,
          `💾 Backup flush (interval): wrote ${rowsToWrite} rows to disk.`,
        );
        firstFlush = false;
        buffer = [];
      }
    },
    async flush() {
      if (buffer.length > 0) {
        const rowsToWrite = buffer.length;
        await appendToArchive(key, buffer, { clear: false });
        await appendBackupLog(key, `💾 Backup flush (manual): wrote ${rowsToWrite} rows to disk.`);
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
    string: (value, context) => {
      // Preserve JSON structure in metadata_json – do NOT clean it
      if (context.column === 'metadata_json') return value;
      return cleanText(value);
    },
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
  //   node datasets/scripts/scrape_xyz.js            # headless (default)
  //   node datasets/scripts/scrape_xyz.js --show     # open browser window
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
export function getViewportOptions(size = 'lg') {
  const viewports = {
    xs: { width: 375, height: 667 },
    sm: { width: 768, height: 1024 },
    md: { width: 1280, height: 800 },
    lg: { width: 1920, height: 1080 },
  };
  //give each a deviceScaleFactor = 1
  Object.values(viewports).forEach((vp) => {
    vp.deviceScaleFactor = 1;
  });
  return viewports[size] || viewports['lg'];
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

// =============================================================================
// BACKUP RECOVERY MODE
// =============================================================================

/**
 * Check if the script is running in backup recovery mode.
 * Usage: node script.js --use-backup
 * If true, the script should skip web fetching and build the final CSV from
 * the backup scrape content instead.
 *
 * @returns {boolean} - true if --use-backup flag is present in process.argv
 */
export function isBackupRecoveryMode() {
  return process.argv.includes('--use-backup');
}
