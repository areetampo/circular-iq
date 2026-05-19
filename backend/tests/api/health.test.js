/**
 * @module tests/api/health.test
 * @description Integration tests for `/health` and nested health probe routes.
 */

import { closeAllPools } from '#database/index.js';
import assert from 'node:assert';
import test from 'node:test';
import request from 'supertest';

let app;

test.before(async () => {
  // Import app after environment is set up
  const { default: appModule } = await import('#server/app.js');
  app = appModule;
});

test.after(async () => {
  // Close all database pools and connections to prevent hanging
  await closeAllPools();
});

// Basic health endpoint tests
test('GET /health returns minimal health status', async () => {
  const res = await request(app).get('/health');

  assert.strictEqual(res.status, 200);
  assert(res.body.status);
  assert(res.body.timestamp);
  assert(typeof res.body.timestamp === 'string');
});

test('GET /health returns 503 when database is unhealthy', async () => {
  // Mock database failure
  const { setDatabaseClientOverride } = await import('#database/client.js');
  const mockClient = {
    from: () => ({
      select: () => ({
        limit: () => Promise.resolve({ data: null, error: new Error('Connection failed') }),
      }),
    }),
  };

  setDatabaseClientOverride(mockClient, 'supabase');

  const res = await request(app).get('/health');

  assert.strictEqual(res.status, 503);
  assert.strictEqual(res.body.status, 'error');

  // Clear override
  setDatabaseClientOverride(null);
});

test('GET /health?detailed=true returns comprehensive health check', async () => {
  const res = await request(app).get('/health?detailed=true');

  assert.strictEqual(res.status, 200);
  assert(res.body.checks);
  assert(res.body.checks.database);
  assert(res.body.checks.openai);
  assert(res.body.checks.system);
  assert(res.body.checks.configuration);
  assert(res.body.responseTime);
});

test('GET /health?detailed=true&checks=database,openai returns specific checks', async () => {
  const res = await request(app).get('/health?detailed=true&checks=database,openai');

  assert.strictEqual(res.status, 200);
  assert(res.body.checks.database);
  assert(res.body.checks.openai);
  // Should not include system or config checks
  assert(!res.body.checks.system);
  assert(!res.body.checks.configuration);
});

// Health routes tests
test('GET /health/ returns minimal health status', async () => {
  const res = await request(app).get('/health/');

  assert.strictEqual(res.status, 200);
  assert(res.body.status);
  assert(res.body.timestamp);
});

test('GET /health/detailed returns comprehensive health status', async () => {
  const res = await request(app).get('/health/detailed');

  assert.strictEqual(res.status, 200);
  assert(res.body.checks);
  assert(res.body.checks.database);
  assert(res.body.checks.openai);
  assert(res.body.checks.system);
  assert(res.body.checks.configuration);
});

test('GET /health/database returns database health', async () => {
  const res = await request(app).get('/health/database');

  assert.strictEqual(res.status, 200);
  assert(res.body.status);
  assert(res.body.type);
  assert(res.body.timestamp);
});

test('GET /health/database/aiven returns Aiven database health', async () => {
  const res = await request(app).get('/health/database/aiven');

  assert(res.status === 200 || res.status === 503); // May be disabled or unhealthy
  assert(res.body.status);
  assert(res.body.type);
  assert(res.body.timestamp);
});

test('GET /health/openai returns OpenAI health status', async () => {
  const res = await request(app).get('/health/openai');

  assert(res.status === 200 || res.status === 503); // May be disabled or unhealthy
  assert(res.body.status);
  assert(res.body.timestamp);
});

test('GET /health/system returns system resources', async () => {
  const res = await request(app).get('/health/system');

  assert.strictEqual(res.status, 200);
  assert(res.body.uptime);
  assert(res.body.memory);
  assert(res.body.nodeVersion);
  assert(res.body.platform);
  assert(res.body.timestamp);

  // Check memory structure
  assert(typeof res.body.memory.used === 'string');
  assert(typeof res.body.memory.total === 'string');
  assert(res.body.memory.used.includes('MB'));
  assert(res.body.memory.total.includes('MB'));
});

test('GET /health/config returns configuration status', async () => {
  const res = await request(app).get('/health/config');

  assert.strictEqual(res.status, 200);
  assert(res.body.status);
  assert(res.body.environment);
  assert(res.body.apiAuthEnabled !== undefined);
  assert(Array.isArray(res.body.publicRoutes));
  assert(res.body.timestamp);
});

test('GET /health/readiness returns readiness status', async () => {
  const res = await request(app).get('/health/readiness');

  assert(res.status === 200 || res.status === 503);
  assert(res.body.status === 'ready' || res.body.status === 'not-ready');
  assert(res.body.checks);
  assert(typeof res.body.checks.database === 'boolean');
  assert(typeof res.body.checks.configuration === 'boolean');
  assert(res.body.timestamp);
});

test('GET /health/liveness returns liveness status', async () => {
  const res = await request(app).get('/health/liveness');

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'alive');
  assert(typeof res.body.uptime === 'number');
  assert(res.body.timestamp);
});

test('GET /health/version returns version information', async () => {
  const res = await request(app).get('/health/version');

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.version, '1.0.0');
  assert.strictEqual(res.body.name, 'Circular Economy API');
  assert(res.body.description);
  assert(res.body.environment);
  assert(res.body.nodeVersion);
  assert(res.body.timestamp);
});

// Error handling tests
test('Health endpoints handle errors gracefully', async () => {
  // Test with invalid database client
  const { setDatabaseClientOverride } = await import('#database/client.js');
  const mockClient = {
    from: () => {
      throw new Error('Unexpected error');
    },
  };

  setDatabaseClientOverride(mockClient, 'supabase');

  const res = await request(app).get('/health/database');

  assert.strictEqual(res.status, 503);
  assert.strictEqual(res.body.status, 'error');
  assert(res.body.error);

  // Clear override
  setDatabaseClientOverride(null);
});

// Performance tests
test('Health endpoints respond quickly', async () => {
  const start = Date.now();
  const res = await request(app).get('/health');
  const duration = Date.now() - start;

  assert.strictEqual(res.status, 200);
  assert(duration < 1000, 'Health check should respond within 1 second');
});

test('Detailed health check includes response time', async () => {
  const res = await request(app).get('/health/detailed');

  assert.strictEqual(res.status, 200);
  assert(res.body.responseTime);
  assert(typeof res.body.responseTime === 'string');
  assert(res.body.responseTime.includes('ms'));
});
