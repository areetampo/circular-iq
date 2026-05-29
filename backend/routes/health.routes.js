/**
 * Health router mounted at `/health`; all endpoints are public.
 *
 * | Method | Path | Auth | Notes |
 * |--------|------|------|-------|
 * | GET | `/` | None | Minimal probe for load balancers |
 * | GET | `/detailed` | None | Optional `checks` query; degraded status still returns 200 |
 * | GET | `/database` | None | Primary database connection |
 * | GET | `/database/aiven` | None | Aiven PostgreSQL pool |
 * | GET | `/openai` | None | OpenAI API key and connectivity probe |
 * | GET | `/system` | None | Memory and uptime |
 * | GET | `/config` | None | Required environment keys |
 * | GET | `/readiness` | None | Database and configuration readiness |
 * | GET | `/liveness` | None | Process liveness |
 * | GET | `/version` | None | Build and runtime metadata |
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
import { toClientError } from '#utils/errors.js';

/**
 * Creates public health and Kubernetes probe endpoints.
 *
 * @returns {express.Router} Router mounted under `/health`.
 */
export default function createHealthRouter() {
  const router = express.Router();

  /**
   * GET /
   * Accepts no path or query parameters. Runs the minimal load-balancer probe and returns 200 for
   * `status: "ok"` or 503 for unhealthy checks and thrown failures.
   */
  router.get('/', async (req, res) => {
    const startTime = Date.now();
    try {
      const healthData = await getMinimalHealth();
      const statusCode = healthData.status === 'ok' ? 200 : 503;
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
   * GET /detailed?checks=
   * Query arg `checks` is an optional comma-separated list from `database`, `openai`, `system`,
   * and `config`; defaults to all four. Degraded checks return 200, unhealthy checks and thrown
   * failures return 503.
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

      res.status(statusCode).json(healthData);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('health_detailed', '/health/detailed', 'error', duration, { error });
      logger.error({ error, path: '/health/detailed' }, 'Detailed health check failed');

      res.status(503).json({
        status: 'error',
        error: 'Detailed health check failed',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /database
   * Accepts no path or query parameters. Checks the primary configured database connection and
   * returns 503 when the service reports anything other than `healthy` or throws.
   */
  router.get('/database', async (req, res) => {
    const startTime = Date.now();
    try {
      const dbHealth = await checkDatabase();
      const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(dbHealth);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('health_database', '/health/database', 'error', duration, { error });
      logger.error({ error, path: '/health/database' }, 'Database health check failed');

      res.status(503).json({
        status: 'error',
        ...toClientError(error, 'Database health check failed'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /database/aiven
   * Accepts no path or query parameters. Checks the Aiven PostgreSQL pool independently of
   * Supabase and returns 503 when the pool is unhealthy or throws.
   */
  router.get('/database/aiven', async (req, res) => {
    const startTime = Date.now();
    try {
      const aivenHealth = await checkAivenDatabase();
      const statusCode = aivenHealth.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(aivenHealth);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('health_aiven', '/health/database/aiven', 'error', duration, { error });
      logger.error({ error, path: '/health/database/aiven' }, 'Aiven database health check failed');

      res.status(503).json({
        status: 'error',
        ...toClientError(error, 'Aiven database health check failed'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /openai
   * Accepts no path or query parameters. Checks OpenAI API connectivity without exposing secrets
   * and returns 503 when connectivity is not `healthy` or the probe throws.
   */
  router.get('/openai', async (req, res) => {
    const startTime = Date.now();
    try {
      const openaiHealth = await checkOpenAI();
      const statusCode = openaiHealth.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(openaiHealth);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('health_openai', '/health/openai', 'error', duration, { error });
      logger.error({ error, path: '/health/openai' }, 'OpenAI health check failed');

      res.status(503).json({
        status: 'error',
        ...toClientError(error, 'OpenAI health check failed'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /system
   * Accepts no path or query parameters. Returns process and resource health including memory and
   * uptime information; unexpected resource-check failures map to 500.
   */
  router.get('/system', (req, res) => {
    const startTime = Date.now();
    try {
      const systemHealth = checkSystemResources();
      res.json(systemHealth);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('health_system', '/health/system', 'error', duration, { error });
      logger.error({ error, path: '/health/system' }, 'System resources health check failed');

      res.status(500).json({
        status: 'error',
        ...toClientError(error, 'System resources check failed'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /config
   * Accepts no path or query parameters. Verifies required environment configuration and reports
   * missing keys; unexpected configuration-check failures map to 500.
   */
  router.get('/config', (req, res) => {
    const startTime = Date.now();
    try {
      const configHealth = checkConfiguration();
      res.status(200).json(configHealth);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('health_config', '/health/config', 'error', duration, { error });
      logger.error({ error, path: '/health/config' }, 'Configuration health check failed');

      res.status(500).json({
        status: 'error',
        ...toClientError(error, 'Configuration check failed'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /readiness
   * Accepts no path or query parameters. Combines database and configuration checks for Kubernetes
   * readiness; failed dependencies or thrown probe errors return 503.
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
      logger.logOperation('health_readiness', '/health/readiness', 'error', duration, { error });
      logger.error({ error, path: '/health/readiness' }, 'Readiness probe failed');

      res.status(503).json({
        status: 'not-ready',
        ...toClientError(error, 'Readiness check failed'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /liveness
   * Accepts no path or query parameters. Confirms the process is running and reports uptime;
   * unexpected failures map to 500.
   */
  router.get('/liveness', (req, res) => {
    const startTime = Date.now();
    try {
      const uptime = process.uptime();
      res.status(200).json({
        status: 'alive',
        uptime,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('health_liveness', '/health/liveness', 'error', duration, { error });
      logger.error({ error, path: '/health/liveness' }, 'Liveness probe failed');

      res.status(500).json({
        status: 'error',
        ...toClientError(error, 'Liveness check failed'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /version
   * Accepts no path or query parameters. Returns package version, environment, runtime, build,
   * commit, and timestamp metadata; unexpected failures map to 500.
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
      res.json(versionInfo);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('health_version', '/health/version', 'error', duration, { error });
      logger.error({ error, path: '/health/version' }, 'Version endpoint failed');

      res.status(500).json({
        status: 'error',
        ...toClientError(error, 'Version check failed'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Any unexpected route-layer error should look like a failed health check to callers.
  router.use((error, req, res, _next) => {
    logger.logOperation('health_error', req.path, 'error', 0, { error });

    res.status(503).json({
      status: 'error',
      error: 'Internal health check error',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
