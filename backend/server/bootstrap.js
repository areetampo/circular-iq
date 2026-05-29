/**
 * Side-effect import chain that must run before server and pipeline entry points.
 * Order: `loadEnv`, then `backend.config` for validated `BACKEND_CONFIG`, then `logger` for `globalThis.logger`.
 */
import '#config/loadEnv.js';
import '#config/backend.config.js';
import '#utils/logger.js';
