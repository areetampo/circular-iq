/**
 * @module run_and_save_test_assessments
 * @description End-to-end test runner — scores generated inputs against the live API and saves assessments.
 * Uses test Supabase credentials and checkpoint files for resumable batch runs.
 */

import fs from 'fs';

import { createClient } from '@supabase/supabase-js';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import {
  assertFileExists,
  DATASETS_TEST_INPUTS_CHECKPOINT_FILE_JSON,
  DATASETS_TEST_INPUTS_GENERATED_INPUTS_JSON,
  DATASETS_TEST_INPUTS_POKEMON_NAMES_JSON,
  prepareWrite,
  writeJson,
} from '#utils/datasetsUtils.js';
import { formatTimestamp } from '#utils/formatting.js';
import { logger } from '#utils/logger.js';

const INPUT_FILE = DATASETS_TEST_INPUTS_GENERATED_INPUTS_JSON;
const CHECKPOINT_FILE = DATASETS_TEST_INPUTS_CHECKPOINT_FILE_JSON;
const POKEMON_NAMES_FILE = DATASETS_TEST_INPUTS_POKEMON_NAMES_JSON;

const API_URL = BACKEND_CONFIG.app.apiUrl;
const SUPABASE_URL = BACKEND_CONFIG.supabase.url;
const SUPABASE_ANON_KEY = BACKEND_CONFIG.supabase.anonKey;
const TEST_USER = `${BACKEND_CONFIG.testCredentials.username}${BACKEND_CONFIG.testCredentials.usernameExt}`;
const TEST_USER_PASSWORD = BACKEND_CONFIG.testCredentials.password;

const RATE_LIMIT_PER_MINUTE = 10;
const DELAY_MS = (60 * 1000) / RATE_LIMIT_PER_MINUTE; // 6000 ms

// --- CLI flag parsing ---
const args = process.argv.slice(2);

/**
 * Parses `--prefix=value` style CLI flags.
 * @param {string} prefix - Flag prefix including `=` (e.g. `'--checkpoint='`).
 * @returns {string|null} Value after the prefix, or `null` when absent.
 */
function getFlagValue(prefix) {
  const arg = args.find((a) => a.startsWith(prefix));
  if (!arg) return null;
  const value = arg.slice(prefix.length);
  return value.length > 0 ? value : null;
}

const checkpointFlagRaw = getFlagValue('--checkpoint=');
const checkpointOverride =
  checkpointFlagRaw !== null && !isNaN(Number(checkpointFlagRaw))
    ? Math.max(0, Number(checkpointFlagRaw))
    : null;

const totalFlagRaw = getFlagValue('--total=');
const totalOverride =
  totalFlagRaw !== null && !isNaN(Number(totalFlagRaw)) ? Number(totalFlagRaw) : null;

/**
 * Signs in the configured test user and returns a Supabase access token.
 * @returns {Promise<string>} Bearer token for API calls.
 */
async function getAuthToken() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_USER,
    password: TEST_USER_PASSWORD,
  });
  if (error) throw new Error(`Login failed: ${error.message}`);
  return data.session.access_token;
}

/**
 * POSTs one assessment payload to `/api/score`.
 * @param {string} token - Supabase JWT.
 * @param {Object} payload - Assessment inputs.
 * @returns {Promise<Object>} Scoring API JSON response.
 */
async function callScoreAPI(token, payload) {
  const res = await fetch(`${API_URL}/api/score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Score API error (${res.status}): ${err.message || err.error}`);
  }
  return res.json();
}

/**
 * POSTs a scored assessment to `/api/assessments`.
 * @param {string} token - Supabase JWT.
 * @param {Object} savePayload - Save payload including `name` and `result`.
 * @returns {Promise<Object>} Save API JSON response.
 */
async function callSaveAPI(token, savePayload) {
  const res = await fetch(`${API_URL}/api/assessments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(savePayload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Save API error (${res.status}): ${err.message || err.error}`);
  }
  return res.json();
}

/**
 * Reads the resumable batch index from the checkpoint file.
 * @returns {Promise<{ lastIndex: number }>}
 */
async function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    // Use prepareWrite to unlock file for reading
    try {
      await prepareWrite(CHECKPOINT_FILE);

      const data = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));

      // Lock file back to read-only
      try {
        await fs.promises.chmod(CHECKPOINT_FILE, 0o444);
      } catch {
        // ignore errors on platforms that don't support chmod
      }

      return data;
    } catch (err) {
      logger.error({ err }, 'Failed to load checkpoint');
      return { lastIndex: 0 };
    }
  }
  return { lastIndex: 0 };
}

/**
 * Persists the last successfully processed input index.
 * @param {number} index - Zero-based index to resume from next run.
 * @returns {Promise<void>}
 */
async function saveCheckpoint(index) {
  await writeJson(CHECKPOINT_FILE, { lastIndex: index });
}

/**
 * Loads or fetches Pokémon names used as random assessment titles.
 * @returns {Promise<string[]>} Name list (empty array when PokéAPI fetch fails).
 */
async function getPokemonList() {
  // Check if the file exists
  if (fs.existsSync(POKEMON_NAMES_FILE)) {
    logger.info('Found cached pokemon_names.json, loading...');
    // Use prepareWrite to unlock file for reading
    await prepareWrite(POKEMON_NAMES_FILE);

    const data = fs.readFileSync(POKEMON_NAMES_FILE, 'utf8');
    const pokemon = JSON.parse(data);

    // Lock file back to read-only (writeJson will do this, but we need to lock now)
    try {
      await fs.promises.chmod(POKEMON_NAMES_FILE, 0o444);
    } catch {
      // ignore errors on platforms that don't support chmod
    }

    return pokemon;
  }

  // If not, call the API
  logger.info('File not found. Fetching from PokéAPI...');
  try {
    // Using the standard PokéAPI for names:
    const pokeRes = await fetch('https://pokeapi.co/api/v2/pokemon?limit=2000');
    const pokeData = await pokeRes.json();

    // Clean names (split at first hyphen)
    const names = pokeData.results.map((p) => p.name.split('-')[0]);

    // Save the file using datasetsUtils writeJson (handles locking)
    await writeJson(POKEMON_NAMES_FILE, names);
    logger.info('Successfully created pokemon_names.json');

    return names;
  } catch (err) {
    logger.error({ err }, 'Failed to fetch Pokemon names');
    return [];
  }
}

/**
 * CLI entry: scores generated inputs via live APIs with rate limiting and checkpoint resume.
 * @returns {Promise<void>}
 */
async function main() {
  const pokemonNames = await getPokemonList();

  // Use assertFileExists for better error handling
  try {
    assertFileExists(INPUT_FILE, 'Input file');
  } catch (err) {
    logger.error(
      { INPUT_FILE, err },
      'Input file not found, run pipeline/rag/generate_test_inputs.js first.',
    );
    process.exit(1);
  }

  // Use prepareWrite to unlock input file for reading
  await prepareWrite(INPUT_FILE);

  const inputs = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  logger.info({ total: inputs.length }, 'Loaded inputs');

  // Lock input file back to read-only
  try {
    await fs.promises.chmod(INPUT_FILE, 0o444);
  } catch {
    // ignore errors on platforms that don't support chmod
  }

  const token = await getAuthToken();
  logger.info('Authenticated');

  const checkpoint = await loadCheckpoint();

  // If --checkpoint= flag provided, override and persist it before starting
  if (checkpointOverride !== null) {
    logger.info({ checkpointOverride }, 'Overriding checkpoint via --checkpoint= flag');
    checkpoint.lastIndex = checkpointOverride;
    await saveCheckpoint(checkpointOverride);
  }

  const start = checkpoint.lastIndex;

  // Determine the end index: honour --total= if provided
  const end =
    totalOverride !== null ? Math.min(start + totalOverride, inputs.length) : inputs.length;

  if (totalOverride !== null) {
    logger.info({ start, end, totalOverride }, 'Running with --total= limit');
  }

  for (let i = start; i < end; i++) {
    const input = inputs[i];
    const scorePayload = {
      businessProblem: input.businessProblem,
      businessSolution: input.businessSolution,
      businessContext: input.businessContext,
      evaluationParameters: input.evaluationParameters,
    };

    logger.info({ current: i + 1, totalToScore: end }, 'Scoring...');
    let scoringResult;
    try {
      scoringResult = await callScoreAPI(token, scorePayload);
    } catch (err) {
      logger.error({ index: i, err }, 'Scoring failed');
      saveCheckpoint(i);
      throw err;
    }

    const savePayload = {
      name: `${pokemonNames[Math.floor(Math.random() * pokemonNames.length)]} - ${formatTimestamp(new Date(), { showSeconds: true, showMs: true })}`,
      result_json: scoringResult,
      industry: scoringResult.metadata?.industry || 'Unknown',
      is_public: false,
      contribute_to_global_benchmarks: false,
      businessProblem: input.businessProblem,
      businessSolution: input.businessSolution,
      parameters: input.evaluationParameters,
    };

    logger.info({ currentlySaving: i + 1, totalToSave: end }, 'Saving...');
    try {
      await callSaveAPI(token, savePayload);
    } catch (err) {
      logger.error({ index: i, err }, 'Save failed');
      saveCheckpoint(i);
      throw err;
    }

    saveCheckpoint(i + 1);
    logger.info({ saved: i + 1, totalToSave: end }, 'Saved');
    if (i < end - 1) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  logger.info('All assessments completed!');
  // Clean up checkpoint file by unlocking and removing it
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      fs.chmodSync(CHECKPOINT_FILE, 0o644);
      fs.unlinkSync(CHECKPOINT_FILE);
    } catch {
      // ignore errors
    }
  }
}

main().catch((err) => logger.error({ err }, 'Fatal error'));
