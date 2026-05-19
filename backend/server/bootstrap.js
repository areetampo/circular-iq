/**
 * @module bootstrap
 * @description Pre-flight startup configuration loader.
 * Loads environment variables and backend configuration before server initialization.
 * This module should be imported as the first import in the server entry point
 * to guarantee all configuration and logging infrastructure is available before
 * any application code runs.
 *
 * Must be imported before any other backend modules — configuration and logger
 * are not available until this module's side effects have completed.
 *
 * Execution order (import sequence is intentional and must not be changed):
 * 1. {@link module:loadEnv} — populates `process.env` from the correct `.env` file
 * 2. {@link module:backend.config} — validates env vars via Zod and builds the frozen `BACKEND_CONFIG` object
 * 3. {@link module:logger} — creates the Pino logger instance (requires `BACKEND_CONFIG.nodeEnv`);
 *    assigns it to `globalThis.logger` for use without imports in server lifecycle modules
 *
 * @example
 * // In app.js or server entry point — must be first import
 * import '#server/bootstrap.js';
 * import express from 'express'; // all other imports follow
 */

// Import order is intentional — each module depends on the previous one.
// loadEnv must run before backend.config reads process.env,
// and logger must run after backend.config to access BACKEND_CONFIG.nodeEnv.
import '#config/loadEnv.js';
import '#config/backend.config.js';
import '#utils/logger.js';
