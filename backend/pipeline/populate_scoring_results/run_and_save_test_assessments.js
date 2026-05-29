/**
 * End-to-end test runner — scores generated inputs against the live API and saves assessments.
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
 * @throws {Error} If Supabase rejects the configured test credentials.
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
 *
 * @param {string} token - Supabase JWT.
 * @param {{ businessProblem: string, businessSolution: string, evaluationParameters?: Record<string, number>, businessContext?: Record<string, unknown> }} payload - Assessment inputs accepted by `/api/score`.
 * @returns {Promise<Record<string, unknown>>} Parsed scoring result object used as `result_json` when saving the assessment.
 * @throws {Error} If the request fails, the response body is invalid JSON, or the score API returns a non-2xx response.
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
    const error = await res.json();
    throw new Error(`Score API error (${res.status}): ${error.message || error.error}`);
  }
  return res.json();
}

/**
 * POSTs a scored assessment to `/api/assessments`.
 *
 * @param {string} token - Supabase JWT.
 * @param {{ name: string, result_json: Record<string, unknown>, [key: string]: unknown }} savePayload - Save payload including the assessment name and score result.
 * @returns {Promise<Record<string, unknown>>} Parsed saved-assessment response from the API.
 * @throws {Error} If the request fails, the response body is invalid JSON, or the save API returns a non-2xx response.
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
    const error = await res.json();
    throw new Error(`Save API error (${res.status}): ${error.message || error.error}`);
  }
  return res.json();
}

/**
 * Reads the resumable batch index from the checkpoint file.
 *
 * @returns {Promise<{ lastIndex: number }>} Last completed input index; returns `{ lastIndex: 0 }` when the checkpoint is missing or unreadable.
 */
async function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      await prepareWrite(CHECKPOINT_FILE);

      const data = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));

      try {
        await fs.promises.chmod(CHECKPOINT_FILE, 0o444);
      } catch {
        // Some platforms ignore POSIX-style read-only permissions.
      }

      return data;
    } catch (error) {
      logger.error({ error }, 'Failed to load checkpoint');
      return { lastIndex: 0 };
    }
  }
  return { lastIndex: 0 };
}

/**
 * Persists the last successfully processed input index.
 *
 * @param {number} index - Zero-based index to resume from next run.
 * @throws {Error} If the checkpoint file cannot be written.
 */
async function saveCheckpoint(index) {
  await writeJson(CHECKPOINT_FILE, { lastIndex: index });
}

/**
 * Loads cached Pokemon names or fetches them for random assessment titles.
 *
 * @returns {Promise<string[]>} Name list, or an empty array when PokeAPI fetch fails.
 * @throws {Error} If the cached names file cannot be read or parsed.
 */
async function getPokemonList() {
  if (fs.existsSync(POKEMON_NAMES_FILE)) {
    logger.info('Found cached pokemon_names.json, loading...');
    await prepareWrite(POKEMON_NAMES_FILE);

    const data = fs.readFileSync(POKEMON_NAMES_FILE, 'utf8');
    const pokemon = JSON.parse(data);

    try {
      await fs.promises.chmod(POKEMON_NAMES_FILE, 0o444);
    } catch {
      // Some platforms ignore POSIX-style read-only permissions.
    }

    return pokemon;
  }

  logger.info('File not found. Fetching from PokéAPI...');
  try {
    const pokeRes = await fetch('https://pokeapi.co/api/v2/pokemon?limit=2000');
    const pokeData = await pokeRes.json();

    // Drop form suffixes so generated assessment titles use base Pokemon names.
    const names = pokeData.results.map((p) => p.name.split('-')[0]);

    await writeJson(POKEMON_NAMES_FILE, names);
    logger.info('Successfully created pokemon_names.json');

    return names;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch Pokemon names');
    return [];
  }
}

/**
 * CLI entry that scores generated inputs via live APIs with rate limiting and checkpoint resume.
 *
 * @throws {Error} If setup, scoring, saving, checkpointing, or input parsing fails.
 */
async function main() {
  const pokemonNames = await getPokemonList();

  try {
    assertFileExists(INPUT_FILE, 'Input file');
  } catch (error) {
    logger.error(
      { INPUT_FILE, error },
      'Input file not found, run pipeline/rag/generate_test_inputs.js first.',
    );
    process.exit(1);
  }

  await prepareWrite(INPUT_FILE);

  const inputs = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  logger.info({ total: inputs.length }, 'Loaded inputs');

  try {
    await fs.promises.chmod(INPUT_FILE, 0o444);
  } catch {
    // Some platforms ignore POSIX-style read-only permissions.
  }

  const token = await getAuthToken();
  logger.info('Authenticated');

  const checkpoint = await loadCheckpoint();

  if (checkpointOverride !== null) {
    logger.info({ checkpointOverride }, 'Overriding checkpoint via --checkpoint= flag');
    checkpoint.lastIndex = checkpointOverride;
    await saveCheckpoint(checkpointOverride);
  }

  const start = checkpoint.lastIndex;

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
    } catch (error) {
      logger.error({ index: i, error }, 'Scoring failed');
      saveCheckpoint(i);
      throw error;
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
    } catch (error) {
      logger.error({ index: i, error }, 'Save failed');
      saveCheckpoint(i);
      throw error;
    }

    saveCheckpoint(i + 1);
    logger.info({ saved: i + 1, totalToSave: end }, 'Saved');
    if (i < end - 1) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  logger.info('All assessments completed!');
  // A fully completed run should not resume from a stale checkpoint next time.
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      fs.chmodSync(CHECKPOINT_FILE, 0o644);
      fs.unlinkSync(CHECKPOINT_FILE);
    } catch {
      // Leave the checkpoint in place if cleanup fails; the logged completion is still authoritative.
    }
  }
}

main().catch((error) => logger.error({ error }, 'Fatal error'));
