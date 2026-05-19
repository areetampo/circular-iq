/**
 * @module datasetsUtils
 * @description Centralized dataset processing utilities for the ingestion pipeline.
 *
 * This module provides all shared utilities, configurations, and helpers needed
 * by dataset extraction and scraping scripts to maintain consistency across the pipeline.
 *
 * PRIMARY EXPORTS:
 *   • DATASETS & DATASET_LOOKUP: Complete dataset registry with metadata
 *   • getDatasetRawDir, getDatasetProcessedCsvPath: Path helpers
 *   • getDatasetBackupFolderPath, getDatasetBackupCsvPath: Backup storage paths
 *   • writeCsv, writeJsonl, writeJson: Centralized file writing with locking
 *   • appendToArchive, readBackupCsv: Backup management
 *   • appendLogs, clearLogs: Backup logging
 *   • createBackupHelper: Batched backup flushing during long scrapes
 *   • cleanText, formatId: Text sanitization and ID formatting
 *   • CSV_COLUMNS, STRINGIFY_OPTIONS: Standard CSV configuration
 *   • getBrowserLaunchOptions, getViewportOptions, getUserAgentOptions: Puppeteer config
 *   • getExtraHttpHeaders, randomDelay: HTTP utilities
 *
 * KEY PRINCIPLES:
 *   ✓ DRY: All common logic centralized, no duplication across scripts
 *   ✓ File Locking: All writes unlock, modify, then re-lock (chmod 0o644 → 0o444)
 *   ✓ Backup Management: Incremental saves with recovery mode (--use-backup)
 *   ✓ Logging: Timestamped backups with dataset-specific log files
 *   ✓ Consistency: All CSV processing uses shared columns and stringify options
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

import { logger } from '#utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// FILESYSTEM PATHS
// =============================================================================

//* root of the backend project (one level up from utils/)
const BACKEND_ROOT = path.resolve(__dirname, '..');
//* dataset directory moved out of utils; reference via backend root
const DATASETS_DIR = path.join(BACKEND_ROOT, 'datasets');
const DATASETS_RAW_DIR = path.join(DATASETS_DIR, 'raw');

/** @constant {string} Absolute path to `backend/datasets/processed`. */
export const DATASETS_PROCESSED_DIR = path.join(DATASETS_DIR, 'processed');

/** @constant {string} Absolute path to `backend/datasets/manual_entries`. */
export const DATASETS_MANUAL_ENTRIES_DIR = path.join(DATASETS_DIR, 'manual_entries');

/** @constant {string} Absolute path to `backend/datasets/scripts`. */
export const DATASETS_SCRIPTS_DIR = path.join(DATASETS_DIR, 'scripts');

//* archived output files stored at root of archives/
const DATASETS_ARCHIVES_DIR = path.join(DATASETS_DIR, 'archives');

const DATASETS_SCRAPE_BACKUP_DIR = path.join(DATASETS_ARCHIVES_DIR, 'scrape_backup');
//* subfolders are created within scrape_backup/ for specific datasets' backup,
//* each containing a CSV file and a logs.txt file.

/** @constant {string} Pipeline archive: merged raw dataset CSV before final normalisation. */
export const ARCHIVES_COMBINED_INPUT_CSV = path.join(DATASETS_ARCHIVES_DIR, 'combined_input.csv');

/** @constant {string} Pipeline archive: final merged input CSV ready for chunking. */
export const ARCHIVES_COMBINED_INPUT_FINAL_CSV = path.join(
  DATASETS_ARCHIVES_DIR,
  'combined_input_final.csv',
);

/** @constant {string} Pipeline archive: generated text chunks JSON. */
export const ARCHIVES_CHUNKS_JSON = path.join(DATASETS_ARCHIVES_DIR, 'chunks.json');

/** @constant {string} Pipeline archive: chunks with embedding vectors (JSONL). */
export const ARCHIVES_EMBEDDED_CHUNKS_JSONL = path.join(
  DATASETS_ARCHIVES_DIR,
  'embedded_chunks.jsonl',
);

/** @constant {string} Pipeline archive: documents written during store step (dry-run). */
export const ARCHIVES_STORED_DOCUMENTS_JSONL = path.join(
  DATASETS_ARCHIVES_DIR,
  'stored_documents.jsonl',
);

//* archives test files
const ARCHIVES_TEST_DIR = path.join(DATASETS_ARCHIVES_DIR, 'test_files');
export const ARCHIVES_TEST_COMBINED_INPUT_CSV = path.join(
  ARCHIVES_TEST_DIR,
  'combined_input_test.csv',
);
export const ARCHIVES_TEST_COMBINED_INPUT_FINAL_CSV = path.join(
  ARCHIVES_TEST_DIR,
  'combined_input_final_test.csv',
);

export const ARCHIVES_TEST_CHUNKS_JSON = path.join(ARCHIVES_TEST_DIR, 'chunks_test.json');
export const ARCHIVES_TEST_EMBEDDED_CHUNKS_JSONL = path.join(
  ARCHIVES_TEST_DIR,
  'embedded_chunks_test.jsonl',
);
export const ARCHIVES_TEST_STORED_DOCUMENTS_JSONL = path.join(
  ARCHIVES_TEST_DIR,
  'stored_documents_test.jsonl',
);

// NOTE: only scrape_backup is a directory within archives/; other dataset
// components live in the normal dataset directories. Only the root CSV files are
// placed directly inside archives/.

//* output directory holds generated artifacts that are safe to regenerate
const DATASETS_OUTPUT_DIR = path.join(DATASETS_DIR, 'out');

export const OUT_COMBINED_INPUT_CSV = path.join(DATASETS_OUTPUT_DIR, 'combined_input.csv');
export const OUT_COMBINED_INPUT_FINAL_CSV = path.join(
  DATASETS_OUTPUT_DIR,
  'combined_input_final.csv',
);
export const OUT_CHUNKS_JSON = path.join(DATASETS_OUTPUT_DIR, 'chunks.json');
export const OUT_EMBEDDED_CHUNKS_JSONL = path.join(DATASETS_OUTPUT_DIR, 'embedded_chunks.jsonl');
export const OUT_STORED_DOCUMENTS_JSONL = path.join(DATASETS_OUTPUT_DIR, 'stored_documents.jsonl');

//* out test files
const OUT_TEST_DIR = path.join(DATASETS_OUTPUT_DIR, 'test_files');
export const OUT_TEST_COMBINED_INPUT_CSV = path.join(OUT_TEST_DIR, 'combined_input_test.csv');
export const OUT_TEST_COMBINED_INPUT_FINAL_CSV = path.join(
  OUT_TEST_DIR,
  'combined_input_final_test.csv',
);
export const OUT_TEST_CHUNKS_JSON = path.join(OUT_TEST_DIR, 'chunks_test.json');
export const OUT_TEST_EMBEDDED_CHUNKS_JSONL = path.join(OUT_TEST_DIR, 'embedded_chunks_test.jsonl');
export const OUT_TEST_STORED_DOCUMENTS_JSONL = path.join(
  OUT_TEST_DIR,
  'stored_documents_test.jsonl',
);

//* datasets/for_search
const DATASETS_FOR_SEARCH_DIR = path.join(DATASETS_DIR, 'for_search');
export const DATASETS_FOR_SEARCH_COMBINED_INPUT_CSV = path.join(
  DATASETS_FOR_SEARCH_DIR,
  'combined_input.csv',
);
export const DATASETS_FOR_SEARCH_COMBINED_INPUT_EMBEDDINGS_CACHE_JSON = path.join(
  DATASETS_FOR_SEARCH_DIR,
  'ce_cases_embeddings_cache.json',
);

//* datasets/test_inputs for storing sample inputs (pipeline/rag/generate_test_inputs) + running them through scoring and saving their results (pipeline/rag/run_and_save_test_assessments)
const DATASETS_TEST_INPUTS_DIR = path.join(DATASETS_DIR, 'test_inputs');
export const DATASETS_TEST_INPUTS_GENERATED_INPUTS_JSON = path.join(
  DATASETS_TEST_INPUTS_DIR,
  'generated_inputs.json',
);
export const DATASETS_TEST_INPUTS_CHECKPOINT_FILE_JSON = path.join(
  DATASETS_TEST_INPUTS_DIR,
  'run_checkpoint.json',
);
export const DATASETS_TEST_INPUTS_POKEMON_NAMES_JSON = path.join(
  DATASETS_TEST_INPUTS_DIR,
  'pokemon_names.json',
);

// =============================================================================
// DATASET REGISTRY
// =============================================================================

// Number of digits for zero-padding IDs (e.g., 00001). Adjust as needed for expected dataset sizes.
// With 5 digits, we can handle up to 99,999 entries before switching to natural expansion (100000, 100001, etc.) without breaking the ID format.
const ID_DIGITS = 5;

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
const DATASETS = [
  {
    key: 'c2c',
    name: 'C2C Registry',
    raw_folder: null,
    processed_csv: 'c2c_registry.csv',
    scrape_script: path.join(DATASETS_SCRIPTS_DIR, 'scrape_c2c.js'),
    extract_script: null,
    source_url: 'https://c2ccertified.org/certified-products',
    urls: {
      homepage: 'https://c2ccertified.org/certified-products',
      // note: doesnt use url parameters for pagination, going to https://c2ccertified.org/certified-products?certified_products_by_date_asc%5Bpage%5D=2,3,.. simply chnages the url to page 1
      listings:
        'https://c2ccertified.org/certified-products?certified_products_by_date_asc%5Bpage%5D=', //0,1,...
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
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_cgr.js'),
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
    key: 'circle_knowledge_hub',
    name: 'Circle Economy Knowledge Hub Cases',
    raw_folder: null,
    processed_csv: 'circle_knowledge_hub_processed.csv',
    scrape_script: path.join(DATASETS_SCRIPTS_DIR, 'scrape_circle_knowledge_hub.js'),
    extract_script: null,
    source_url: 'https://knowledge-hub.circle-economy.com/cases',
    urls: {
      listings: 'https://knowledge-hub.circle-economy.com/cases?_sort=3&_start=', //0,10,20,...
      base: 'https://knowledge-hub.circle-economy.com',
    },
    raw_folder_contents: null,
    scrape_backup_folder: 'circle_knowledge_hub_scrape_backup',
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
    key: 'eippcb',
    name: 'EIPPCB BAT Conclusions and BREFs',
    raw_folder: 'eippcb', // points to datasets/raw/eippcb/
    processed_csv: 'eippcb_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_eippcb.js'),
    source_url: 'https://bureau-industrial-transformation.jrc.ec.europa.eu/reference',
    urls: {
      iron_and_steel: {
        sector: 'Iron and Steel',
        type: 'BAT Conclusion',
        sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32012D0135',
      },
      glass: {
        sector: 'Glass',
        type: 'BAT Conclusion',
        sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32012D0134',
      },
      non_ferrous_metals: {
        sector: 'Non-ferrous Metals',
        type: 'BAT Conclusion',
        sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016D1032',
      },
      cement_lime_mgo: {
        sector: 'Cement, Lime, Magnesium Oxide',
        type: 'BAT Conclusion',
        sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32013D0163',
      },
      pulp_paper_board: {
        sector: 'Pulp, Paper, Board',
        type: 'BAT Conclusion',
        sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32014D0687',
      },
      textiles: {
        sector: 'Textiles',
        type: 'BAT Conclusion',
        sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022D2508',
      },
      waste_treatment: {
        sector: 'Waste Treatment',
        type: 'BAT Conclusion',
        sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32018D1147',
      },
      ceramic_manufacturing: {
        sector: 'Ceramic Manufacturing',
        type: 'BREF',
        sourceUrl: 'https://eippcb.jrc.ec.europa.eu/reference/ceramic-manufacturing',
      },
      surface_treatment: {
        sector: 'Surface Treatment of Metals and Plastics',
        type: 'BREF',
        sourceUrl:
          'https://eippcb.jrc.ec.europa.eu/reference/surface-treatment-metals-and-plastics',
      },
    },
    raw_folder_contents: {
      iron_and_steel_production_2012: 'bat_conclusions/iron_and_steel_production_2012.pdf',
      manufacture_of_glass_2012: 'bat_conclusions/manufacture_of_glass_2012.pdf',
      non_ferrous_metals_industries_2016: 'bat_conclusions/non_ferrous_metals_industries_2016.pdf',
      production_of_cement_lime_and_magnesium_oxide_2013:
        'bat_conclusions/production_of_cement_lime_and_magnesium_oxide_2013.pdf',
      production_of_pulp_paper_and_board_2014:
        'bat_conclusions/production_of_pulp_paper_and_board_2014.pdf',
      textiles_industry_2022: 'bat_conclusions/textiles_industry_2022.pdf',
      waste_treatment_2018: 'bat_conclusions/waste_treatment_2018.pdf',
      ceramic_manufacturing_bref_2007: 'bref/ceramic_manufacturing_bref_2007.pdf',
      surface_treatment_bref_2006: 'bref/surface_treatment_bref_2006.pdf',
    },
    scrape_backup_folder: null,
  },
  {
    key: 'emf',
    name: 'EMF Case Studies',
    raw_folder: null,
    processed_csv: 'emf_case_studies.csv',
    scrape_script: path.join(DATASETS_SCRIPTS_DIR, 'scrape_emf.js'),
    extract_script: null,
    source_url: 'https://www.ellenmacarthurfoundation.org/explore',
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
    source_url: 'https://eulacfoundation.org/en',
    urls: 'https://eulacfoundation.org/en/system/files/case_studies_circular_economy_eu_lac.pdf',
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
    source_url: 'https://ec.europa.eu/eurostat',
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
    key: 'fashion_innovation',
    name: 'Fashion for Good Innovation Programme',
    raw_folder: null,
    processed_csv: 'fashion_innovation_processed.csv',
    scrape_script: path.join(DATASETS_SCRIPTS_DIR, 'scrape_fashion_innovation.js'),
    extract_script: null,
    source_url: 'https://www.fashionforgood.com/innovation-platform-2/innovators/',
    urls: {
      listing: 'https://www.fashionforgood.com/innovation-platform-2/innovators/',
      base: 'https://www.fashionforgood.com',
    },
    raw_folder_contents: null,
    scrape_backup_folder: 'fashion_innovation_scrape_backup',
  },
  {
    key: 'fashion_transparency',
    name: 'Fashion Transparency Index',
    raw_folder: 'fashion_transparency_index',
    processed_csv: 'fashion_transparency.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_fashion_transparency.js'),
    source_url: 'https://www.fashionrevolution.org/transparency/',
    urls: 'https://issuu.com/fashionrevolution/docs/what_fuels_fashion_2025?fr=sMTlkZjgzOTk5OTc',
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
    source_url: 'https://edgar.jrc.ec.europa.eu/',
    urls: 'https://edgar.jrc.ec.europa.eu/dataset_ghg2025',
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
    source_url: 'https://ewastemonitor.info/',
    urls: 'https://ewastemonitor.info/the-global-e-waste-monitor-2024/',
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
    source_url: 'https://github.com/techandy42/GreenTechGuardians',
    urls: null,
    raw_folder_contents: {
      ai_earthhack_dataset: 'AI_EarthHack_Dataset.csv',
      combined_sample: 'combined_data_first_200_rows.jsonl',
      extracted_sample: 'extracted_data_first_200_rows.jsonl',
      training: 'extracted_data_training_dataset.jsonl',
      validation: 'extracted_data_validation_dataset.jsonl',
    },
    scrape_backup_folder: null,
  },
  {
    key: 'ifixit',
    name: 'iFixit Repairability Scores',
    raw_folder: 'ifixit',
    processed_csv: 'ifixit_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_ifixit.js'),
    source_url: 'https://www.ifixit.com/repairability',
    urls: {
      homepage: 'https://www.ifixit.com/repairability',
    },
    raw_folder_contents: {
      e_readers: 'e_readers.csv',
      handheld_game_consoles: 'handheld_game_consoles.csv',
      laptops: 'laptops.csv',
      mini_pcs: 'mini_pcs.csv',
      smartphones: 'smartphones.csv',
      smartwatches: 'smartwatches.csv',
      tablets: 'tablets.csv',
      wireless_earbuds: 'wireless_earbuds.csv',
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
    source_url: 'https://www.kaggle.com/',
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
    key: 'kalundborg',
    name: 'Kalundborg Symbiosis Case Studies',
    raw_folder: null,
    processed_csv: 'kalundborg_processed.csv',
    scrape_script: path.join(DATASETS_SCRIPTS_DIR, 'scrape_kalundborg.js'),
    extract_script: null,
    source_url: 'https://www.symbiosis.dk/en',
    urls: {
      listing: 'https://www.symbiosis.dk/en/category/case/',
    },
    raw_folder_contents: null,
    scrape_backup_folder: 'kalundborg_scrape_backup',
  },
  {
    key: 'metabolic',
    name: 'Metabolic Open Reports',
    raw_folder: 'metabolic',
    processed_csv: 'metabolic_processed.csv',
    scrape_script: path.join(DATASETS_SCRIPTS_DIR, 'scrape_metabolic.js'),
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_metabolic.js'),
    source_url: 'https://www.metabolic.nl',
    urls: {
      publications: 'https://www.metabolic.nl/publications/',
    },
    raw_folder_contents: {
      // filename (saved in raw folder) -> detail page URL
      'circular_agrifood.pdf': 'https://www.metabolic.nl/publications/circular-agrifood/',
      'circular_electronics_landscape_assessment.pdf':
        'https://www.metabolic.nl/publications/circular-electronics-landscape-assessment-executive-summary/',
      'circular_cities_program_executive_summary.pdf':
        'https://www.metabolic.nl/publications/circular-cities-program-executive-summary/',
      'circular_cities_program_lublin.pdf':
        'https://www.metabolic.nl/publications/circular-cities-program-lublin/',
      'circular_cities_program_krakow.pdf':
        'https://www.metabolic.nl/publications/circular-cities-program-krakow/',
      'circular_cities_program_gdansk.pdf':
        'https://www.metabolic.nl/publications/circular-cities-program-gdansk/',
      'circularity_in_the_built_environment_in_europe.pdf':
        'https://www.metabolic.nl/publications/circularity-in-the-built-environment-in-europe/',
      'framework_for_circular_buildings_breeam.pdf':
        'https://www.metabolic.nl/publications/a-framework-for-circular-buildings-breeam/',
      'rotterdams_urban_mine.pdf': 'https://www.metabolic.nl/publications/rotterdams-urban-mine/',
      'circular_boulder.pdf': 'https://www.metabolic.nl/publications/circular-boulder/',
      'circular_charlotte.pdf': 'https://www.metabolic.nl/publications/circular-charlotte-pdf/',
      'circular_rotterdam.pdf': 'https://www.metabolic.nl/publications/circular-rotterdam/',
      'circular_amsterdam_spatial_implications.pdf':
        'https://www.metabolic.nl/publications/circular-amsterdam-spatial-implications/',
      // 'city_of_amsterdam_roadmap_circular_land_tendering.pdf': 'https://www.metabolic.nl/publications/city-of-amsterdam-roadmap-circular-land-tendering/',
      'circular_buiksloterham_roadmap_amsterdam.pdf':
        'https://www.metabolic.nl/publications/circular-buiksloterham-roadmap-amsterdams-first-circular-neighborhood/',
      'circular_fryslan.pdf':
        'https://www.metabolic.nl/publications/circular-fryslan-a-vision-and-strategy-for-circular-regional-development/',
      'circular_opportunities_waste_system_capital_region_denmark.pdf':
        'https://www.metabolic.nl/publications/circular-opportunities-in-the-waste-system-in-the-capital-region-of-denmark/',
      'zero_plastic_waste_thailand.pdf':
        'https://www.metabolic.nl/publications/zero-plastic-waste-thailand/',
      'nature_based_solutions_policy_tracker_report.pdf':
        'https://www.metabolic.nl/publications/nature-based-solutions-policy-tracker-report/',
      'financing_circular_economy_innovation_netherlands.pdf':
        'https://www.metabolic.nl/publications/financing-circular-economy-innovation-netherlands/',
      'towards_climate_neutral_and_circular_procurement.pdf':
        'https://www.metabolic.nl/publications/towards-climate-neutral-and-circular-procurement/',
      'metal_demand_for_electric_vehicles.pdf':
        'https://www.metabolic.nl/publications/metal-demand-for-electric-vehicles-pdf/',
      'prospecting_urban_mines_of_amsterdam.pdf':
        'https://www.metabolic.nl/publications/prospecting_the_urban_mines_of_amsterdam_15082019-pdf/',
      'vang_opportunities_circular_economy_cities_regions_nl.pdf':
        'https://www.metabolic.nl/publications/vang-opportunities-for-the-circular-economy-in-cities-and-regions-nl/',
      'handboek_circulaire_gebiedsontwikkeling.pdf':
        'https://www.metabolic.nl/publications/handboek-circulaire-gebiedsontwikkeling/',
      'framework_voor_circulaire_bestaande_gebouwen.pdf':
        'https://www.metabolic.nl/publications/framework-voor-circulaire-bestaande-gebouwen/',
      'circular_building_hubs.pdf': 'https://www.metabolic.nl/publications/circular-building-hubs/',
      'circular_demolition.pdf': 'https://www.metabolic.nl/publications/circular-demolition/',
      'biobased_renovation.pdf': 'https://www.metabolic.nl/publications/biobased-renovation/',
      'using_timber_in_construction.pdf':
        'https://www.metabolic.nl/publications/using-timber-in-construction/',
      'circular_revenue_models.pdf':
        'https://www.metabolic.nl/publications/circular-revenue-models/',
      'materials_passports.pdf': 'https://www.metabolic.nl/publications/materials-passports/',
      'circular_design_of_buildings.pdf':
        'https://www.metabolic.nl/publications/the-circular-design-of-buildings/',
      'building_with_recycled_building_materials.pdf':
        'https://www.metabolic.nl/publications/building-with-recycled-building-materials/',
      'environmental_impact_of_building_materials_eci_epb.pdf':
        'https://www.metabolic.nl/publications/the-environmental-impact-of-building-materials-eci-and-epb/',
      'digitization_within_circular_built_environment.pdf':
        'https://www.metabolic.nl/publications/digitization-within-the-circular-built-environment/',
      'determining_ecological_thresholds_for_dairy.pdf':
        'https://www.metabolic.nl/publications/determining-ecological-thresholds-for-dairy/',
      'alpro_regenerative_agriculture_journey.pdf':
        'https://www.metabolic.nl/publications/alpros-regenerative-agriculture-journey/',
      'portland_clean_industry_study.pdf':
        'https://www.metabolic.nl/publications/portland-clean-industry-study/',
      'circular_intensive_care_unit.pdf':
        'https://www.metabolic.nl/publications/circular-intensive-care-unit/',
      'e_waste_metropoolregio_amsterdam.pdf':
        'https://www.metabolic.nl/publications/e-waste-in-de-metropoolregio-amsterdam/',
      'milieustraten_provincie_utrecht.pdf':
        'https://www.metabolic.nl/publications/milieustraten-provincie-utrecht/',
      'gemeente_amsterdam_portfolio_scan.pdf':
        'https://www.metabolic.nl/publications/gemeente-amsterdam-portfolio-scan/',
      'impact_scan_gemeente_amsterdam.pdf':
        'https://www.metabolic.nl/publications/impact-scan-gemeente-amsterdam/',
      'urban_mining_scan.pdf': 'https://www.metabolic.nl/publications/urban-mining-scan/',
      'waddeneilanden_circulair.pdf':
        'https://www.metabolic.nl/publications/waddeneilanden-circulair/',
      'carbon_footprint_erasmus_mc.pdf':
        'https://www.metabolic.nl/publications/carbon-footprint-of-erasmus-mc/',
      'analysing_waste_material_flows_in_port_areas.pdf':
        'https://www.metabolic.nl/publications/analysing-waste-material-flows-in-port-areas/',
      'our_food_future_wp1_food_waste_flow_study.pdf':
        'https://www.metabolic.nl/publications/our-food-future-wp1-food-food-waste-flow-study/',
      'handboek_voor_een_afvalvrij_festival.pdf':
        'https://www.metabolic.nl/publications/handboek-voor-een-afvalvrij-festival/',
      'coresym_carbon_monoxide_reuse_industrial_symbiosis.pdf':
        'https://www.metabolic.nl/publications/coresym-carbon-monoxide-re-use-through-industrial-symbiosis/',
      'delfland_circulair_nl.pdf': 'https://www.metabolic.nl/publications/delfland-circulair-nl/',
      'welcome_to_the_circular_village.pdf':
        'https://www.metabolic.nl/publications/welcome-to-the-circular-village/',
      'afvalvrij_dgtl.pdf': 'https://www.metabolic.nl/publications/afvalvrij-dgtl/',
      'roadmap_circulaire_gronduitgifte.pdf':
        'https://www.metabolic.nl/publications/roadmap-circulaire-gronduitgifte/',
      'notitie_rijk_van_nijmegen_circulair.pdf':
        'https://www.metabolic.nl/publications/notitie-rijk-van-nijmegen-circulair/',
      'circulair_voedsel_system_noordoost_brabant.pdf':
        'https://www.metabolic.nl/publications/circulair-voedsel-system-noordoost-brabant/',
      'circular_economy_indicators_infrastructure_spaarndammertunnel_amsterdam_nl.pdf':
        'https://www.metabolic.nl/publications/circular-economy-indicators-infrastructure-spaarndammertunnel-amsterdam/',
      'cleantech_playground.pdf': 'https://www.metabolic.nl/publications/cleantech-playground/',
    },
    scrape_backup_folder: 'metabolic_scrape_backup',
  },
  {
    key: 'mnd',
    name: 'Mendeley Data',
    raw_folder: 'mendeley_downloads',
    processed_csv: 'mendeley_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_mendeley.js'),
    source_url: 'https://data.mendeley.com/',
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
    source_url: 'https://world.openbeautyfacts.org',
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
    source_url: 'https://world.openfoodfacts.org',
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
    source_url: 'https://world.openproductsfacts.org',
    urls: {
      // The web search interface
      search: 'https://world.openproductsfacts.org/cgi/search.pl',
      // The v2 Search API endpoint
      apiBase: 'https://world.openproductsfacts.org/api/v2/search',
      // The base URL for individual product pages
      productUrlBase: 'https://world.openproductsfacts.org/product',
    },
    raw_folder_contents: null,
    scrape_backup_folder: 'opf_scrape_backup',
  },
  {
    key: 'refed',
    name: 'ReFED Food Waste Solutions',
    raw_folder: null, // No raw files needed; fetched via API
    processed_csv: 'refed_processed.csv', // Output CSV filename
    scrape_script: path.join(DATASETS_SCRIPTS_DIR, 'scrape_refed.js'), // API fetch script
    extract_script: null,
    source_url: 'https://insights.refed.org/solution-database', // Main website
    urls: {
      site: 'https://insights.refed.org/',
      apiBase: 'https://api.refed.org/v2', // Direct API endpoint
      solutions: 'https://api.refed.org/v2/solution_database/solutions', // Direct API endpoint
      groups: 'https://api.refed.org/v2/solution_database/groups', // Direct API endpoint
      categories: 'https://api.refed.org/v2/solution_database/categories', // Direct API endpoint
      sectors: 'https://api.refed.org/v2/sectors', // Direct API endpoint
      foodTypes: 'https://api.refed.org/v2/solution_database/food_types', // Direct API endpoint
    },
    raw_folder_contents: null, // No raw files
    // Optional: if you want to explicitly document the backup location
    scrape_backup_folder: 'refed_scrape_backup', // Backup CSV will be stored here
  },
  {
    key: 'rema', // Short, unique key for 'Remanufacturing EU'
    name: 'Remanufacturing EU Case Studies',
    raw_folder: 'remanufacturing_eu', // PDFs will be saved here
    processed_csv: 'rema_processed.csv', // Final CSV after extraction
    scrape_script: path.join(DATASETS_SCRIPTS_DIR, 'scrape_remanufacturing_eu.js'),
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_remanufacturing_eu.js'),
    source_url: 'https://www.remanufacturing.eu',
    urls: {
      case_studies: 'https://www.remanufacturing.eu/case-study-tool.php',
    },
    raw_folder_contents: {
      // everything will be downloaded by the scraper, so we don't have specific filenames yet. The scraper will need to handle naming and saving these files appropriately.
      // This will be populated dynamically by the scraper. We don't know filenames yet.
      // We'll leave it null or as an empty object, as the scraper will handle file naming.
      pdf_files: 'to_be_downloaded',
    },
    scrape_backup_folder: 'rema_scrape_backup', // For backing up progress during scrape
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
    processed_csv: 'wbp_processed.csv',
    scrape_script: null,
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_wbp.js'),
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
  {
    key: 'wrap',
    name: 'WRAP Case Studies + Reports/Guides PDF links (scrape) + Reports/Guides PDF (extract)',
    raw_folder: 'wrap_resources',
    processed_csv_scraped: 'wrap_scraped.csv',
    processed_csv_extracted: 'wrap_extracted.csv', // separate CSV for extracted PDF data
    scrape_script: path.join(DATASETS_SCRIPTS_DIR, 'scrape_wrap.js'),
    extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_wrap.js'),
    source_url: 'https://www.wrap.ngo',
    urls: {
      homepage: 'https://www.wrap.ngo/resources',
      case_studies:
        'https://www.wrap.ngo/resources?field_initiatives_target_id=All&type=1500&sectors=All&page=', // 21 pages total (0..20)
      guides:
        'https://www.wrap.ngo/resources?field_initiatives_target_id=All&type=1499&sectors=All&page=', // 21 pages total (0..20)
      reports:
        'https://www.wrap.ngo/resources?field_initiatives_target_id=All&type=1498&sectors=All&page=', // 29 pages total (0..28)
    },
    raw_folder_contents: {
      guides_folder: 'guides',
      reports_folder: 'reports',
    },
    scrape_backup_folder: 'wrap_scrape_backup',
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
 *   logger.info(ds.processed_csv); // epa_tri_processed.csv
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

  // ensure the raw directory exists so callers can safely read/write files
  const dir = path.join(DATASETS_RAW_DIR, dataset.raw_folder);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    // if we cannot create the directory (permissions etc.) we'll let the
    // caller handle the resulting errors when they actually try to use it.
  }
  return dir;
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
function getDatasetBackupCsvPath(key) {
  const folder = getDatasetBackupFolderPath(key);
  if (!folder) return null;
  const folderName = path.basename(folder);
  return path.join(folder, `${folderName}.csv`);
}

/**
 * Get the full path to a dataset's backup log file.
 * The log filename is the folder name - 'backup' + 'logs.txt'.
 */
export function getDatasetScrapeLogsPath(key) {
  const folder = getDatasetBackupFolderPath(key);
  if (!folder) return null;
  const folderName = path.basename(folder);
  //remove backup from folder name and add logs.txt
  return path.join(folder, `${folderName.replace('backup', 'logs')}.txt`);
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
 * Assert that a file exists. Throws an Error if the path is missing.
 * @param {string} filePath
 * @param {string} [description] - optional description of the file's purpose
 */
export function assertFileExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${description || 'Required file'} not found: ${filePath}`);
  }
}

/**
 * Assert that a directory exists. Throws an Error if the path is missing or not a directory.
 * @param {string} dirPath
 * @param {string} [description] - optional description of the directory's purpose
 */
export function assertDirExists(dirPath, description) {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    throw new Error(`${description || 'Required directory'} not found: ${dirPath}`);
  }
}

/**
 * Verify that one or more filesystem paths (files or directories) actually exist.
 *
 * - Accepts a string or an array of strings.
 * - If any entry is missing (or falsy) the function prints an error for each
 *   missing path and then terminates the process with code 1.
 *
 * This is intended for dataset scripts that need to ensure their input files
 * are present before doing expensive work. It mirrors the behaviour of the
 * old ad‑hoc `if (!fs.existsSync(path))` checks but centralises the logic and
 * provides a consistent error message.
 *
 * Example:
 *   const rawDir = getDatasetRawDir(key);
 *   verifyPathsExist(rawDir);
 *   later: verifyPathsExist([rawCsv, rawPdf]);
 *
 * @param {string|string[]} paths
 */
export function verifyPathsExist(paths) {
  if (!Array.isArray(paths)) {
    paths = [paths];
  }
  const missing = paths.filter((p) => !p || !fs.existsSync(p));
  if (missing.length > 0) {
    logger.error({ missing }, 'Error: the following required folder(s) & file(s) are missing');
    process.exit(1);
  }
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
async function ensureFile(filePath) {
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
function ensureFileSync(filePath) {
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
export function hasAppendProcessedFlag() {
  return process.argv.includes('--append-processed');
}

export function hasAppendBackupFlag() {
  return process.argv.includes('--append-backup');
}

/**
 * Write rows to a CSV file, with optional append and deduplication.
 *
 * @param {string} datasetKey - Dataset key (e.g. 'c2c') used for ID prefix.
 * @param {string} filePath - Full path to the CSV file.
 * @param {Array<Object>} rows - Array of row objects (each must contain the CSV_COLUMNS keys).
 * @param {Object} [options] - Configuration options.
 * @param {boolean} [options.append=false] - If true, append rows; otherwise overwrite.
 * @param {string[]} [options.dedupFields] - Fields used to build a content key for deduplication.
 *   Defaults to ['problem','solution','materials','circular_strategy','category','impact','source_url'].
 * @param {boolean} [options.strict=false] - If true, throw an error when the existing file cannot be read/parsed.
 * @param {boolean} [options.skipDedupe=false] - If true, skip deduplication entirely (faster, assumes unique rows).
 * @param {boolean} [options.validateColumns=false] - If true, check that the existing file contains all CSV_COLUMNS.
 * @param {boolean} [options.lock=true] - If true, set the file to read‑only (chmod 444) after writing.
 *
 * @returns {Promise<{writtenCount: number, duplicateCount: number, firstID: string|null, lastID: string|null}>}
 *   Metadata about the operation.
 */
export async function writeCsv(datasetKey, filePath, rows, options = {}) {
  // convenience: support legacy signature where last argument was boolean append
  if (typeof options === 'boolean') {
    options = { append: options };
  }
  const {
    append = false,
    dedupFields = [
      'problem',
      'solution',
      'materials',
      'circular_strategy',
      'category',
      'impact',
      'source_url',
      'metadata_json',
    ],
    strict = false,
    skipDedupe = false,
    validateColumns = false,
    lock = true,
  } = options;

  // -------------------------------------------------------------------------
  // 1. Non‑append mode (simple overwrite)
  // -------------------------------------------------------------------------
  if (!append) {
    await prepareWrite(filePath, { clear: true });

    const rowsWithIds = rows.map((row, idx) => {
      // Preserve existing ID/ id field if provided, otherwise generate one
      if (row.ID || row.id) {
        return { ...row, ID: row.ID || row.id };
      }
      return { ...row, ID: formatId(datasetKey, idx + 1) };
    });

    const csv = stringify(rowsWithIds, STRINGIFY_OPTIONS);
    await fs.promises.writeFile(filePath, csv);
    if (lock) {
      try {
        await fs.promises.chmod(filePath, 0o444);
      } catch {
        // ignore errors on platforms that don't support chmod
      }
    }
    return {
      writtenCount: rowsWithIds.length,
      duplicateCount: 0,
      firstID: rowsWithIds[0]?.ID || 'null',
      lastID: rowsWithIds[rowsWithIds.length - 1]?.ID || 'null',
    };
  }

  // -------------------------------------------------------------------------
  // 2. Append mode
  // -------------------------------------------------------------------------
  await prepareWrite(filePath); // ensure directory exists and file is writable

  let existingRows = [];
  let lastSuffix = 0;
  const contentKeySet = new Set();

  // 2a. Try to read existing file
  try {
    const content = await fs.promises.readFile(filePath, 'utf8').catch(() => null);
    if (content && content.trim()) {
      const records = parse(content, { columns: true, skip_empty_lines: true });
      existingRows = records;

      // Optional column validation
      if (validateColumns && records.length > 0) {
        const headers = Object.keys(records[0]);
        const missing = CSV_COLUMNS.filter((col) => !headers.includes(col));
        if (missing.length) {
          throw new Error(`Existing CSV missing required columns: ${missing.join(', ')}`);
        }
      }

      // Build deduplication set from existing rows
      if (!skipDedupe) {
        existingRows.forEach((row) => {
          const key = dedupFields
            .map((f) => row[f] || '')
            .join('|')
            .trim();
          contentKeySet.add(key);
        });
      }

      // Find the highest numeric suffix from existing IDs
      existingRows.forEach((row) => {
        const id = row.ID;
        // ID must start with datasetKey + '_'
        if (id && id.startsWith(datasetKey + '_')) {
          const suffixPart = id.substring(datasetKey.length + 1); // after "key_"
          const match = suffixPart.match(/\d+$/); // trailing digits
          if (match) {
            const num = parseInt(match[0], 10);
            if (!isNaN(num) && num > lastSuffix) {
              lastSuffix = num;
            }
          }
        }
      });
    }
  } catch (err) {
    if (strict) {
      throw new Error(`Failed to read existing file for append: ${err.message}`);
    }
    logger.warn(
      { err },
      'Could not read existing file for append, proceeding without deduplication',
    );
    // Continue with empty state
  }

  // 2b. Deduplicate new rows (if not skipped)
  let newRows = rows;
  if (!skipDedupe) {
    const uniqueNewRows = [];
    for (const row of rows) {
      const key = dedupFields
        .map((f) => row[f] || '')
        .join('|')
        .trim();
      if (!contentKeySet.has(key)) {
        uniqueNewRows.push(row);
        contentKeySet.add(key); // also prevent duplicates within the batch
      }
    }
    newRows = uniqueNewRows;
  }

  const duplicateCount = rows.length - newRows.length;

  // 2c. Assign sequential IDs
  const rowsWithIds = newRows.map((row, idx) => ({
    ...row,
    ID: formatId(datasetKey, lastSuffix + idx + 1),
  }));

  if (rowsWithIds.length === 0) {
    return { writtenCount: 0, duplicateCount, firstID: 'null', lastID: 'null' };
  }

  // 2d. Stringify (omit header if file already existed)
  const stringifyOptions = { ...STRINGIFY_OPTIONS, header: existingRows.length === 0 };
  const csv = stringify(rowsWithIds, stringifyOptions);

  if (existingRows.length > 0) {
    await fs.promises.appendFile(filePath, csv);
  } else {
    await fs.promises.writeFile(filePath, csv);
  }

  if (lock) {
    try {
      await fs.promises.chmod(filePath, 0o444);
    } catch {
      // ignore errors on platforms that don't support chmod
    }
  }

  return {
    writtenCount: rowsWithIds.length,
    duplicateCount,
    firstID: rowsWithIds[0]?.ID || 'null',
    lastID: rowsWithIds[rowsWithIds.length - 1]?.ID || 'null',
  };
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
async function appendToArchive(key, rows, opts = {}) {
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
    logger.warn({ csvPath }, 'Backup file not found');
    return [];
  }

  try {
    const content = await fs.promises.readFile(csvPath, 'utf8');
    if (!content.trim()) {
      logger.warn({ csvPath }, 'Backup file is empty');
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

    logger.info({ rowCount: rows.length, csvPath }, 'Read rows from backup');
    return rows;
  } catch (err) {
    logger.error({ err }, 'Error reading backup CSV');
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
export async function appendLogs(key, message) {
  const logPath = getDatasetScrapeLogsPath(key);
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

  const logLine = `\n[~ ${day} ${monthYear} — ${timeStr} IST]\n${message}\n`;

  await fs.promises.appendFile(logPath, logLine, 'utf8');

  // lock file
  try {
    await fs.promises.chmod(logPath, 0o444);
  } catch {
    // ignore
  }
}

/**
 * Clear the backup log file for a dataset.
 * If the file exists, it is truncated (emptied). If it doesn't exist, nothing happens.
 * @param {string} key - dataset key
 */
export async function clearLogs(key) {
  if (!process.argv.includes('--clear-logs')) return;

  const logPath = getDatasetScrapeLogsPath(key);
  if (!logPath) return;

  // This one line does: ensureDir, chmod 644, and wipes the file!
  await prepareWrite(logPath, { clear: true });

  // Optional: Lock it back to read-only
  await fs.promises.chmod(logPath, 0o444).catch(() => {});

  const ds = DATASET_LOOKUP[key];
  await appendLogs(
    key,
    `🧹 Backup log cleared for ${ds.processed_csv} (${ds.name})\nThis message confirms that the log was successfully cleared.`,
  );
}

// =============================================================================
// BACKUP HELPER (createBackupHelper)
// =============================================================================

/**
 * Helper to batch backup rows every `interval` calls and manage clearing.
 * @param {string} key dataset key
 * @param {number} interval number of calls/pages between writes
 * @param {boolean} clearOnFirst whether to clear file on first write
 * @param {number} MAX_PAGES_TO_FETCH fallback limit to force flush when reached
 */
export function createBackupHelper(key, interval = 3, clearOnFirst = true, MAX_PAGES_TO_FETCH = 1) {
  let counter = 0;
  let buffer = [];
  let overallFirstRow = null;
  let overallLastRow = null;
  let totalRowsWritten = 0;
  let firstFlush = true;

  const flushMsg = (flushReason, rowsToWrite, counter, batchFirst, batchLast) =>
    `💾 Backup flush (${flushReason}):\n` +
    `Wrote ${rowsToWrite} rows to scrape backup file.\n` +
    `Calls/pages processed since last flush: ${counter}\n` +
    `First row in this batch: ${JSON.stringify(batchFirst)}\n\n` +
    `Last row in this batch: ${JSON.stringify(batchLast)}`;

  const endMsg = (overallFirstRow, overallLastRow, totalRowsWritten) =>
    `✓ FINALLY:\n` +
    `Overall first row of entire scrape: ${JSON.stringify(overallFirstRow)}\n\n` +
    `Overall last row of entire scrape: ${JSON.stringify(overallLastRow)}\n\n` +
    `TOTAL ROWS WRITTEN THIS SCRAPE: ${totalRowsWritten}`;

  return {
    async add(rows) {
      if (!rows || rows.length === 0) return;
      buffer.push(...rows);
      counter++;

      // Update overall first/last across the entire scrape
      if (overallFirstRow === null) {
        overallFirstRow = rows[0];
      }
      overallLastRow = rows[rows.length - 1];

      // Determine flush reason
      const isIntervalFlush = counter % interval === 0;
      const isFallbackFlush = counter >= MAX_PAGES_TO_FETCH;

      if (isIntervalFlush || isFallbackFlush) {
        const flushReason = isFallbackFlush
          ? `fallback limit (
          counter reached ${counter} calls, exceeding fallback threshold of ${MAX_PAGES_TO_FETCH})`
          : `interval (${interval})`;
        const rowsToWrite = buffer.length;
        totalRowsWritten += rowsToWrite;

        // Per‑flush first/last rows (current buffer)
        const batchFirst = buffer[0];
        const batchLast = buffer[rowsToWrite - 1];

        await appendToArchive(key, buffer, { clear: firstFlush && clearOnFirst });
        await appendLogs(key, flushMsg(flushReason, rowsToWrite, counter, batchFirst, batchLast));
        firstFlush = false;
        buffer = [];
      }
    },
    async flush() {
      if (buffer.length === 0) {
        await appendLogs(
          key,
          `(No final flush needed, buffer is empty)\n${endMsg(overallFirstRow, overallLastRow, totalRowsWritten)}`,
        );
        return;
      }
      const rowsToWrite = buffer.length;
      totalRowsWritten += rowsToWrite;

      // Per‑flush first/last rows (remaining buffer)
      const batchFirst = buffer[0];
      const batchLast = buffer[rowsToWrite - 1];

      await appendToArchive(key, buffer, { clear: false });
      await appendLogs(key, flushMsg('manual', rowsToWrite, counter, batchFirst, batchLast));
      await appendLogs(key, endMsg(overallFirstRow, overallLastRow, totalRowsWritten));
      buffer = [];
    },
  };
}

// =============================================================================
// CSV PROCESSING
// =============================================================================

// =============================================================================
// CSV PROCESSING & STANDARDIZATION
// =============================================================================

/**
 * Standard columns for all processed dataset CSVs.
 * Every script must output these columns in this order.
 *
 * Column descriptions:
 *   - ID:                 unique dataset-prefixed identifier (e.g. cgr_00001)
 *   - problem:            the initiative/challenge/area of focus
 *   - solution:           the intervention/strategy/approach taken
 *   - materials:          materials/resources involved or addressed
 *   - circular_strategy:  category of circular economy strategy (e.g "Reverse Logistics")
 *   - category:           thematic categorization (e.g "Construction", "EIPPCB BAT Conclusions")
 *   - impact:             quantified or qualitative impact/outcome metrics
 *   - source_url:         URL to the original source or document
 *   - metadata_json:      JSON-encoded metadata specific to extraction (never cleaned)
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
 * Sanitize text for CSV cells:
 *   • Remove all line breaks (CR/LF)
 *   • Convert "smart" quotes ("") and standard double quotes to single quotes (')
 *   • Collapse multiple single quotes to one
 *   • Compress all whitespace (tabs, spaces, etc.) to single spaces
 *   • Trim leading/trailing whitespace
 *
 * NOTE: This function is imported by all scripts from datasetsUtils.
 * Do NOT define cleanText locally in individual scripts.
 *
 * @param {any} str - any value; coerced to string if needed
 * @returns {string} cleaned string ready for CSV output
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
 * Standard CSV stringify options for all dataset processing scripts.
 *
 * Properties:
 *   - header:            Include CSV header row
 *   - columns:           Use CSV_COLUMNS for consistent column order
 *   - quoted:            Quote all fields for safety
 *   - delimiter:         Use standard comma delimiter
 *   - record_delimiter:  Use standard newline record separator
 *   - cast:              Custom string handler to preserve JSON in metadata_json field
 *
 * To override while preserving cleanText behavior in string columns:
 *   const options = { ...STRINGIFY_OPTIONS, header: false };
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
 * Format ID with automatic overflow handling.
 *
 * Pads the numeric suffix with leading zeros up to ID_DIGITS (5 by default),
 * then expands naturally when the maximum is exceeded (100000+ instead of 00000).
 *
 * Examples:
 *   formatId('epa_', 1)      => 'epa_00001'
 *   formatId('epa_', 99999)  => 'epa_99999'
 *   formatId('epa_', 100000) => 'epa_100000'  (natural expansion on overflow)
 *
 * @param {string} DATASET_KEY - dataset key with underscore suffix (e.g. 'cgr_')
 * @param {number} index - sequential numeric ID
 * @returns {string} formatted ID ready for CSV output
 */
function formatId(DATASET_KEY, index) {
  const baseLimit = Math.pow(10, ID_DIGITS) - 1;

  if (index <= baseLimit) {
    return `${DATASET_KEY}_${String(index).padStart(ID_DIGITS, '0')}`;
  }

  // Overflow → expand digits naturally
  return `${DATASET_KEY}_${String(index)}`;
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
 * Returns a random user agent string from the USER_AGENTS list.
 * Useful for rotating user agents to avoid bot detection.
 */
export function getUserAgentOptions() {
  /**
   * List of realistic user agent strings for rotation.
   * Includes various Chrome versions on Windows and macOS.
   */
  const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ];

  return {
    userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
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

/**
 * Generates a random delay between min and max (inclusive).
 * @param {number} min - The minimum delay in milliseconds.
 * @param {number} max - The maximum delay in milliseconds.
 * @returns {Promise<void>} A promise that resolves after the random delay.
 */
export const randomDelay = (min, max) =>
  new Promise((r) => setTimeout(r, Math.floor(Math.random() * (max - min + 1) + min)));
