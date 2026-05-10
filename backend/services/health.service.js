/**
 * Health Check Service
 * Provides comprehensive health monitoring for all backend services and dependencies
 */

import { performance } from 'perf_hooks';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { getDatabaseClient, getDatabaseType } from '#database/index.js';

/**
 * Check database connectivity and health
 * @returns {Promise<Object>} Database health status
 */
async function checkDatabase() {
  const startTime = performance.now();
  const dbType = getDatabaseType();

  try {
    const client = getDatabaseClient();

    if (dbType === 'supabase') {
      // Test Supabase connection with a simple query
      const { data, error } = await client.from('documents').select('count').limit(1);

      if (error) {
        throw error;
      }
    } else {
      // Test PostgreSQL connection
      await client.query('SELECT 1');
    }

    const responseTime = Math.round(performance.now() - startTime);

    return {
      status: 'healthy',
      type: dbType,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      type: dbType,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check Aiven PostgreSQL connectivity and health
 * @returns {Promise<Object>} Aiven database health status
 */
async function checkAivenDatabase() {
  const startTime = performance.now();

  try {
    // Check if Aiven is configured (has host or connection string)
    const hasAivenConfig = BACKEND_CONFIG.aiven.host || BACKEND_CONFIG.aiven.connectionString;
    if (!hasAivenConfig) {
      return {
        status: 'disabled',
        reason: 'Aiven not configured (no host or connection string)',
        timestamp: new Date().toISOString(),
      };
    }

    // Get Aiven pool and run a simple query
    const { getAivenPgPool } = await import('#database/client.js');
    const pool = getAivenPgPool();
    await pool.query('SELECT 1');

    const responseTime = Math.round(performance.now() - startTime);
    return {
      status: 'healthy',
      type: 'aiven',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      type: 'aiven',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check OpenAI API connectivity
 * @returns {Promise<Object>} OpenAI health status
 */
async function checkOpenAI() {
  const startTime = performance.now();

  try {
    if (!BACKEND_CONFIG.openai.apiKey) {
      return {
        status: 'disabled',
        reason: 'API key not configured',
        timestamp: new Date().toISOString(),
      };
    }

    // Simple API test - list models
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

    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check system resources
 * @returns {Object} System resource status
 */
function checkSystemResources() {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();

  // Convert bytes to MB
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
 * Check configuration integrity
 * @returns {Object} Configuration health status
 */
function checkConfiguration() {
  const issues = [];

  // Check critical configuration
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
 * Get overall system health
 * @param {Object} options - Health check options
 * @returns {Promise<Object>} Comprehensive health status
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

  // Synchronous checks
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

  // Wait for async checks
  await Promise.all(promises);

  const totalTime = Math.round(performance.now() - startTime);
  results.responseTime = `${totalTime}ms`;

  return results;
}

/**
 * Get minimal health status for load balancers
 * @returns {Promise<Object>} Minimal health status
 */
async function getMinimalHealth() {
  try {
    // Only check critical database connectivity
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
