import { before, test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.API_AUTH_ENABLED = 'true';
process.env.API_KEY = 'test-key';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-openai';

let app;

before(async () => {
  const mod = await import('../api/server.js');
  app = mod.default || mod.app || mod;
});

test('health endpoint remains open when auth is enabled', async () => {
  const res = await request(app).get('/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'ok');
});

test('protected routes reject missing API key', async () => {
  const res = await request(app).post('/score').send({});
  assert.strictEqual(res.status, 401);
});

test('protected routes reject wrong API key', async () => {
  const res = await request(app).post('/score').set('Authorization', 'Bearer wrong-key').send({});
  assert.strictEqual(res.status, 401);
});

test('protected routes allow correct API key then enforce validation', async () => {
  const res = await request(app).post('/score').set('Authorization', 'Bearer test-key').send({});
  assert.strictEqual(res.status, 400);
});

test('protected routes allow X-API-Key header then enforce validation', async () => {
  const res = await request(app).post('/score').set('X-API-Key', 'test-key').send({});
  assert.strictEqual(res.status, 400);
});
