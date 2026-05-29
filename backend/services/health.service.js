/**
 * Dependency health probes (DB, Aiven, OpenAI, system, config) for `/health` routes.
 */

import { performance } from 'perf_hooks';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { getDatabaseClient, getDatabaseType } from '#database/index.js';

/**
 * Verify the backend database connection and return a health result.
 * Supports Supabase and native PostgreSQL connections.
 *
 * @returns {Promise<{status:string,type:string,responseTime?:string,timestamp:string,error?:string}>} Database status with response time on success and error text on failure.
 */
async function checkDatabase() {
  const startTime = performance.now();
  const dbType = getDatabaseType();

  try {
    const client = getDatabaseClient();

    if (dbType === 'supabase') {
      // A tiny indexed read verifies Supabase connectivity without pulling row data.
      const { error } = await client.from('documents').select('count').limit(1);

      if (error) {
        throw error;
      }
    } else {
      // Native PostgreSQL only needs a simple round trip.
      await client.query('SELECT 1');
    }

    const responseTime = Math.round(performance.now() - startTime);
    logger.logOperation('checkDatabase', 'health/database', 'success', responseTime);

    return {
      status: 'healthy',
      type: dbType,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    logger.logOperation('checkDatabase', 'health/database', 'error', responseTime, {
      error,
    });

    return {
      status: 'unhealthy',
      type: dbType,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Verify Aiven PostgreSQL connectivity if Aiven is configured.
 * Returns disabled when the Aiven host/connection string is not present.
 *
 * @returns {Promise<{status:string,reason?:string,type?:string,responseTime?:string,timestamp:string,error?:string}>} Aiven status, disabled reason, or connectivity error details.
 */
async function checkAivenDatabase() {
  const startTime = performance.now();

  try {
    // Aiven checks are disabled unless either supported connection setting is present.
    const hasAivenConfig = BACKEND_CONFIG.aiven.host || BACKEND_CONFIG.aiven.connectionString;
    if (!hasAivenConfig) {
      const responseTime = Math.round(performance.now() - startTime);
      logger.logOperation('checkAivenDatabase', 'health/aiven', 'disabled', responseTime);

      return {
        status: 'disabled',
        reason: 'Aiven not configured (no host or connection string)',
        timestamp: new Date().toISOString(),
      };
    }

    // Import lazily so deployments without Aiven config do not initialize the pool.
    const { getAivenPgPool } = await import('#database/client.js');
    const pool = getAivenPgPool();
    await pool.query('SELECT 1');

    const responseTime = Math.round(performance.now() - startTime);
    logger.logOperation('checkAivenDatabase', 'health/aiven', 'success', responseTime);

    return {
      status: 'healthy',
      type: 'aiven',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    logger.logOperation('checkAivenDatabase', 'health/aiven', 'error', responseTime, {
      error,
    });

    return {
      status: 'unhealthy',
      type: 'aiven',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Verify OpenAI API accessibility using the configured key.
 * If the key is not configured, reports disabled rather than unhealthy.
 *
 * @returns {Promise<{status:string,reason?:string,responseTime?:string,timestamp:string,error?:string}>} OpenAI API status, disabled reason, or request error details.
 */
async function checkOpenAI() {
  const startTime = performance.now();

  try {
    if (!BACKEND_CONFIG.openai.apiKey) {
      const responseTime = Math.round(performance.now() - startTime);
      logger.logOperation('checkOpenAI', 'health/openai', 'disabled', responseTime);

      return {
        status: 'disabled',
        reason: 'API key not configured',
        timestamp: new Date().toISOString(),
      };
    }

    // Listing models is a lightweight authenticated request that validates the API key.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${BACKEND_CONFIG.openai.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const responseTime = Math.round(performance.now() - startTime);
    logger.logOperation('checkOpenAI', 'health/openai', 'success', responseTime);

    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    logger.logOperation('checkOpenAI', 'health/openai', 'error', responseTime, {
      error,
    });

    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Collect current process and runtime resource metrics for health reporting.
 *
 * @returns {{uptime:string,memory:{used:string,total:string,external:string,rss:string},nodeVersion:string,platform:string,timestamp:string}} Runtime resource snapshot formatted for health responses.
 */
function checkSystemResources() {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();

  // Health payloads use whole MB to keep responses compact and readable.
  const formatMemory = (bytes) => Math.round(bytes / 1024 / 1024);

  return {
    uptime: `${Math.round(uptime)}s`,
    memory: {
      used: `${formatMemory(memUsage.heapUsed)}MB`,
      total: `${formatMemory(memUsage.heapTotal)}MB`,
      external: `${formatMemory(memUsage.external)}MB`,
      rss: `${formatMemory(memUsage.rss)}MB`,
    },
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate critical backend configuration and return warning details if any values are missing.
 *
 * @returns {{status:string,issues:string[],environment:string,apiAuthEnabled:boolean,timestamp:string}} Configuration status plus any missing critical settings.
 */
function checkConfiguration() {
  const issues = [];

  // These settings are required before database-backed routes can work.
  if (!BACKEND_CONFIG.supabase.url) {
    issues.push('Supabase URL not configured');
  }

  if (!BACKEND_CONFIG.supabase.anonKey) {
    issues.push('Supabase anon key not configured');
  }

  if (BACKEND_CONFIG.app.apiAuthEnabled && !BACKEND_CONFIG.app.apiKey) {
    issues.push('API auth enabled but API key not configured');
  }

  return {
    status: issues.length === 0 ? 'healthy' : 'warning',
    issues,
    environment: BACKEND_CONFIG.nodeEnv,
    apiAuthEnabled: BACKEND_CONFIG.app.apiAuthEnabled,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get overall system health.
 *
 * @param {{ checks?: Array<'database'|'openai'|'system'|'config'> }} options - Selected health checks; defaults to all checks.
 * @returns {Promise<{ status: 'healthy'|'degraded'|'unhealthy', timestamp: string, version: string, uptime: number, checks: Record<string, unknown>, responseTime: string }>} Aggregated health payload with selected checks and overall status.
 */
async function getSystemHealth(options = {}) {
  const { checks = ['database', 'openai', 'system', 'config'] } = options;
  const startTime = performance.now();

  const results = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    checks: {},
  };

  const promises = [];

  if (checks.includes('database')) {
    promises.push(
      checkDatabase().then((result) => {
        results.checks.database = result;
        if (result.status === 'unhealthy') {
          results.status = 'unhealthy';
        }
      }),
    );
  }

  if (checks.includes('openai')) {
    promises.push(
      checkOpenAI().then((result) => {
        results.checks.openai = result;
        if (result.status === 'unhealthy') {
          results.status = 'degraded';
        }
      }),
    );
  }

  // Synchronous checks can fill the response while async probes run in parallel.
  if (checks.includes('system')) {
    results.checks.system = checkSystemResources();
  }

  if (checks.includes('config')) {
    const config = checkConfiguration();
    results.checks.configuration = config;
    if (config.status === 'warning') {
      results.status = results.status === 'healthy' ? 'degraded' : results.status;
    }
  }

  // Async checks may update the aggregate status before responseTime is added.
  await Promise.all(promises);

  const totalTime = Math.round(performance.now() - startTime);
  results.responseTime = `${totalTime}ms`;

  return results;
}

/**
 * Get minimal health status for load balancers.
 *
 * @returns {Promise<{ status: 'ok'|'error', timestamp: string }>} Minimal status payload for load balancers.
 */
async function getMinimalHealth() {
  try {
    // Load balancers only need the critical dependency signal.
    const dbHealth = await checkDatabase();

    return {
      status: dbHealth.status === 'healthy' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error({ error }, 'Minimal health check failed');
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
    };
  }
}

export {
  checkAivenDatabase,
  checkConfiguration,
  checkDatabase,
  checkOpenAI,
  checkSystemResources,
  getMinimalHealth,
  getSystemHealth,
};
