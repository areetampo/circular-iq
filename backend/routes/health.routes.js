/**
 * @module health.routes
 * @description Express router for health monitoring endpoints.
 * Provides comprehensive health checks for database, OpenAI, system resources,
 * configuration, readiness, and liveness probes. Supports both minimal checks
 * for load balancers and detailed checks for monitoring dashboards.
 *
 * Routes:
 *   GET /                           — Basic health check for load balancers
 *   GET /detailed                   — Comprehensive multi-component health check
 *   GET /database                   — Database connectivity check
 *   GET /database/aiven             — Aiven PostgreSQL specific check
 *   GET /openai                     — OpenAI API connectivity check
 *   GET /system                     — System resources check (memory, CPU, disk)
 *   GET /config                     — Configuration integrity check
 */

import express from 'express';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import {
  checkAivenDatabase,
  checkConfiguration,
  checkDatabase,
  checkOpenAI,
  checkSystemResources,
  getMinimalHealth,
  getSystemHealth,
} from '#services/health.service.js';

/**
 * Creates the health check router.
 *
 * @returns {express.Router} Configured Express router with health endpoints.
 */
export default function createHealthRouter() {
  const router = express.Router();

  /**
   * GET /health - Basic health check for load balancers
   * Returns minimal status with appropriate HTTP status codes
   */
  router.get('/', async (req, res) => {
    const startTime = Date.now();
    try {
      const healthData = await getMinimalHealth();
      const statusCode = healthData.status === 'ok' ? 200 : 503;

      // const duration = Date.now() - startTime;
      // logger.logOperation('health_check', '/health', 'success', duration);

      res.status(statusCode).json(healthData);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('health_check', '/health', 'error', duration, { error });
      logger.error({ error, path: '/health' }, 'Basic health check failed');

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
    const startTime = Date.now();
    try {
      const { checks } = req.query;
      const healthData = await getSystemHealth({
        checks: checks ? checks.split(',') : ['database', 'openai', 'system', 'config'],
      });
      const statusCode =
        healthData.status === 'healthy' ? 200 : healthData.status === 'degraded' ? 200 : 503;

      // const duration = Date.now() - startTime;
      // logger.logOperation('health_detailed', '/health/detailed', 'success', duration, {
      //   checks: checks || 'default',
      // });

      res.status(statusCode).json(healthData);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('health_detailed', '/health/detailed', 'error', duration, {
        error,
      });
      logger.error({ error, path: '/health/detailed' }, 'Detailed health check failed');

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
    const startTime = Date.now();
    try {
      const dbHealth = await checkDatabase();
      const statusCode = dbHealth.status === 'healthy' ? 200 : 503;

      // const duration = Date.now() - startTime;
      // logger.logOperation('health_database', '/health/database', 'success', duration);

      res.status(statusCode).json(dbHealth);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('health_database', '/health/database', 'error', duration, {
        error,
      });
      logger.error({ error, path: '/health/database' }, 'Database health check failed');

      res.status(503).json({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /health/database/aiven - Aiven PostgreSQL health check
   */
  router.get('/database/aiven', async (req, res) => {
    const startTime = Date.now();
    try {
      const aivenHealth = await checkAivenDatabase();
      const statusCode = aivenHealth.status === 'healthy' ? 200 : 503;

      // const duration = Date.now() - startTime;
      // logger.logOperation('health_aiven', '/health/database/aiven', 'success', duration);

      res.status(statusCode).json(aivenHealth);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('health_aiven', '/health/database/aiven', 'error', duration, {
        error,
      });
      logger.error({ error, path: '/health/database/aiven' }, 'Aiven database health check failed');

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
    const startTime = Date.now();
    try {
      const openaiHealth = await checkOpenAI();
      const statusCode = openaiHealth.status === 'healthy' ? 200 : 503;

      // const duration = Date.now() - startTime;
      // logger.logOperation('health_openai', '/health/openai', 'success', duration);

      res.status(statusCode).json(openaiHealth);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('health_openai', '/health/openai', 'error', duration, {
        error,
      });
      logger.error({ error, path: '/health/openai' }, 'OpenAI health check failed');

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
    const startTime = Date.now();
    try {
      const systemHealth = checkSystemResources();
      // const duration = Date.now() - startTime;
      // logger.logOperation('health_system', '/health/system', 'success', duration);

      res.json(systemHealth);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('health_system', '/health/system', 'error', duration, {
        error,
      });
      logger.error({ error, path: '/health/system' }, 'System resources health check failed');

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
    const startTime = Date.now();
    try {
      const configHealth = checkConfiguration();
      // const duration = Date.now() - startTime;
      // logger.logOperation('health_config', '/health/config', 'success', duration);

      res.status(200).json(configHealth);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('health_config', '/health/config', 'error', duration, {
        error,
      });
      logger.error({ error, path: '/health/config' }, 'Configuration health check failed');

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
    const startTime = Date.now();
    try {
      const [dbHealth, configHealth] = await Promise.all([
        checkDatabase(),
        Promise.resolve(checkConfiguration()),
      ]);
      const isReady = dbHealth.status === 'healthy' && configHealth.status === 'healthy';
      const statusCode = isReady ? 200 : 503;

      // const duration = Date.now() - startTime;
      // logger.logOperation('health_readiness', '/health/readiness', 'success', duration, {
      //   ready: isReady,
      // });

      res.status(statusCode).json({
        status: isReady ? 'ready' : 'not-ready',
        checks: {
          database: dbHealth.status === 'healthy',
          configuration: configHealth.status === 'healthy',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('health_readiness', '/health/readiness', 'error', duration, {
        error,
      });
      logger.error({ error, path: '/health/readiness' }, 'Readiness probe failed');

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
    const startTime = Date.now();
    try {
      const uptime = process.uptime();

      // const duration = Date.now() - startTime;
      // logger.logOperation('health_liveness', '/health/liveness', 'success', duration, { uptime });

      res.status(200).json({
        status: 'alive',
        uptime,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('health_liveness', '/health/liveness', 'error', duration, {
        error,
      });
      logger.error({ error, path: '/health/liveness' }, 'Liveness probe failed');

      res.status(500).json({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /health/version - Version and build information
   */
  router.get('/version', (req, res) => {
    const startTime = Date.now();
    try {
      const versionInfo = {
        version: '1.0.0',
        name: 'Circular Economy API',
        description: 'RAG-powered evaluator for circular economy business evaluations',
        environment: BACKEND_CONFIG.nodeEnv,
        nodeVersion: process.version,
        buildTime: process.env.BUILD_TIME || 'unknown',
        gitCommit: process.env.GIT_COMMIT || 'unknown',
        timestamp: new Date().toISOString(),
      };

      // const duration = Date.now() - startTime;
      // logger.logOperation('health_version', '/health/version', 'success', duration, {
      //   version: versionInfo.version,
      // });

      res.json(versionInfo);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('health_version', '/health/version', 'error', duration, {
        error,
      });
      logger.error({ error, path: '/health/version' }, 'Version endpoint failed');

      res.status(500).json({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Error handler for health routes
  router.use((err, req, res, _next) => {
    logger.logOperation('health_error', req.path, 'error', 0, { err });

    res.status(503).json({
      status: 'error',
      error: 'Internal health check error',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
