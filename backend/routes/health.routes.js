/**
 * Health Check Routes
 * Provides comprehensive health monitoring endpoints
 */

import express from 'express';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import {
  checkConfiguration,
  checkDatabase,
  checkOpenAI,
  checkSystemResources,
  getMinimalHealth,
  getSystemHealth,
} from '#services/health.service.js';
import { logger } from '#utils/logger.js';

const router = express.Router();

/**
 * GET /health - Basic health check for load balancers
 * Returns minimal status with appropriate HTTP status codes
 */
router.get('/', async (req, res) => {
  try {
    const healthData = await getMinimalHealth();

    // Set appropriate HTTP status based on health
    const statusCode = healthData.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(healthData);
  } catch (error) {
    logger.error({ err: error }, 'Health check failed');
    res.status(503).json({
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/detailed - Comprehensive health check
 * Query parameters:
 * - checks: comma-separated list of checks (database,openai,system,config)
 * - timeout: timeout in milliseconds for each check (default: 5000)
 */
router.get('/detailed', async (req, res) => {
  try {
    const { checks, timeout = '5000' } = req.query;

    const healthData = await getSystemHealth({
      checks: checks ? checks.split(',') : ['database', 'openai', 'system', 'config'],
    });

    // Set appropriate HTTP status based on overall health
    const statusCode =
      healthData.status === 'healthy' ? 200 : healthData.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(healthData);
  } catch (error) {
    logger.error({ err: error }, 'Detailed health check failed');
    res.status(503).json({
      status: 'error',
      error: 'Detailed health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/database - Database health check
 */
router.get('/database', async (req, res) => {
  try {
    const dbHealth = await checkDatabase();
    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(dbHealth);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/openai - OpenAI API health check
 */
router.get('/openai', async (req, res) => {
  try {
    const openaiHealth = await checkOpenAI();
    const statusCode = openaiHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(openaiHealth);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/system - System resources health check
 */
router.get('/system', (req, res) => {
  try {
    const systemHealth = checkSystemResources();
    res.json(systemHealth);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/config - Configuration health check
 */
router.get('/config', (req, res) => {
  try {
    const configHealth = checkConfiguration();
    const statusCode = configHealth.status === 'healthy' ? 200 : 200; // Always 200 for config issues
    res.status(statusCode).json(configHealth);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/readiness - Kubernetes readiness probe
 * Checks if the application is ready to serve traffic
 */
router.get('/readiness', async (req, res) => {
  try {
    // Check critical dependencies
    const [dbHealth, configHealth] = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkConfiguration()),
    ]);

    const isReady = dbHealth.status === 'healthy' && configHealth.status === 'healthy';
    const statusCode = isReady ? 200 : 503;

    res.status(statusCode).json({
      status: isReady ? 'ready' : 'not-ready',
      checks: {
        database: dbHealth.status === 'healthy',
        configuration: configHealth.status === 'healthy',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not-ready',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/liveness - Kubernetes liveness probe
 * Checks if the application is still running
 */
router.get('/liveness', (req, res) => {
  // Basic liveness check - just verify the process is running
  res.status(200).json({
    status: 'alive',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/version - Version and build information
 */
router.get('/version', (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'Circular Economy API',
    description: 'RAG-powered evaluator for circular economy business evaluations',
    environment: BACKEND_CONFIG.nodeEnv,
    nodeVersion: process.version,
    buildTime: process.env.BUILD_TIME || 'unknown',
    gitCommit: process.env.GIT_COMMIT || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

// Error handler for health routes
router.use((err, req, res, next) => {
  logger.error({ err }, 'Health route error');
  res.status(503).json({
    status: 'error',
    error: 'Internal health check error',
    timestamp: new Date().toISOString(),
  });
});

export default router;
