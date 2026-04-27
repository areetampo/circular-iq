import fs from 'fs';

import OpenAI from 'openai';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import {
  DATASETS_TEST_INPUTS_GENERATED_INPUTS_JSON,
  prepareWrite,
  writeJson,
} from '#utils/datasetsUtils.js';
import { logger } from '#utils/logger.js';

const OUTPUT_FILE = DATASETS_TEST_INPUTS_GENERATED_INPUTS_JSON;
const TOTAL = 1000; // includes prexisting in OUTPUT_FILE
const CONCURRENCY = 5; // generate 5 in parallel (respects OpenAI rate limits)
const DELAY_MS = 1000; // between batches

const openai = new OpenAI({ apiKey: BACKEND_CONFIG.openai.apiKey });

const SYSTEM_PROMPT = `You are an expert in circular economy business models. Generate a realistic, detailed business case for a circular economy initiative.

Output **only** valid JSON in the following structure, with no extra text:

{
  "businessProblem": "string (minimum 200 characters, describing a real environmental or circular economy challenge, with specific data, location, or context)",
  "businessSolution": "string (minimum 200 characters, describing a concrete circular solution: materials, processes, R-strategy, business model, impact metrics)",
  "businessContext": {
    "business_model_type": "one of: product_as_a_service, take_back, remanufacturing, recycling, sharing_platform, material_substitution",
    "operational_stage": "one of: idea, prototype, pilot, scaling, mature_operation",
    "target_geography": "one of: local, regional, national, global",
    "annual_volume_estimate": "one of: <1 tonne, 1-10 tonnes, 10-100 tonnes, >100 tonnes",
    "material_complexity": "one of: single_material, multi_material, hazardous, electronics, biological",
    "existing_supply_chain_partnerships": "boolean (true/false)"
  },
  "evaluationParameters": {
    "public_participation": "integer 0-100",
    "infrastructure": "integer 0-100",
    "market_price": "integer 0-100",
    "maintenance": "integer 0-100",
    "uniqueness": "integer 0-100",
    "size_efficiency": "integer 0-100",
    "chemical_safety": "integer 0-100",
    "tech_readiness": "integer 0-100"
  }
}

Make each case distinct: vary industries (construction, electronics, textiles, food, packaging, automotive, chemicals, mining, logistics, etc.), geographies, scales, and R‑strategies (reduce, reuse, repair, refurbish, remanufacture, repurpose, recycle, recover). Ensure problem and solution are specific, plausible, and include quantitative elements (e.g., tonnes, percentages, costs). The evaluation parameters should be consistent with the case (e.g., high tech_readiness for a mature solution, low for an idea).`;

async function generateOne(index) {
  const userPrompt = `Generate a unique circular economy business case #${index}. Make it different from any typical example – be creative but realistic.`;
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.9,
    response_format: { type: 'json_object' },
  });
  const raw = response.choices[0].message.content;
  const parsed = JSON.parse(raw);
  // Validate required fields and lengths
  if (!parsed.businessProblem || parsed.businessProblem.length < 200) {
    throw new Error(`Problem too short for index ${index}`);
  }
  if (!parsed.businessSolution || parsed.businessSolution.length < 200) {
    throw new Error(`Solution too short for index ${index}`);
  }
  return parsed;
}

async function main() {
  logger.info({ count: TOTAL }, 'Generating high quality inputs');
  const inputs = [];
  let start = 0;

  // Check for existing partial file (resume)
  if (fs.existsSync(OUTPUT_FILE)) {
    // Use prepareWrite to unlock file for reading
    await prepareWrite(OUTPUT_FILE);

    const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    inputs.push(...existing);
    start = existing.length;
    logger.info(
      { alreadyGenerated: start },
      'Skipping existing items, resuming generation beyond checkpoint',
    );

    // Lock file back to read-only
    try {
      await fs.promises.chmod(OUTPUT_FILE, 0o444);
    } catch {
      // ignore errors on platforms that don't support chmod
    }
  }

  for (let i = start; i < TOTAL; i += CONCURRENCY) {
    const batch = [];
    for (let j = 0; j < CONCURRENCY && i + j < TOTAL; j++) {
      const idx = i + j + 1;
      batch.push(
        generateOne(idx).catch((err) => {
          logger.error({ index: idx, err }, 'Failed at index');
          return null;
        }),
      );
    }
    const results = await Promise.all(batch);
    for (const res of results) {
      if (res) inputs.push(res);
    }
    // Save incrementally using datasetsUtils writeJson (handles locking)
    await writeJson(OUTPUT_FILE, inputs);
    logger.info(
      {
        preExisting: start,
        newlyGeneratedSoFar: inputs.length - start,
        totalAvailable: inputs.length,
        totalRequired: TOTAL,
      },
      'Generation progress',
    );
    if (i + CONCURRENCY < TOTAL) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  logger.info({ OUTPUT_FILE }, 'Done and saved.');
}

main().catch((error) => logger.error(error));
