/**
 * @module tests/api/anonymous.test
 * @description Unit tests for anonymous scoring limits (`enforceAnonymousUsage`).
 */

import assert from 'node:assert/strict';
import { after, test } from 'node:test';

import { enforceAnonymousUsage } from '#controllers/scoring.controller.js';
import { ANON_SCORING_LIMIT } from '#utils/anonymousTracking.js';

// scoring.controller.js imports #database/index.js at module level, which opens
// Supabase clients that have no public close() API. process.exit(0) in after()
// is required to release those handles once all tests are complete.
after(async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  process.exit(0);
});

function makeReq({ ip = '127.0.0.1', ua = 'test-agent', authorization } = {}) {
  const headers = { 'user-agent': ua };
  if (authorization) headers.authorization = authorization;
  headers['x-forwarded-for'] = ip;
  return { headers };
}

test('anonymous usage allows up to ANON_SCORING_LIMIT then blocks', async () => {
  let counter = 0;

  const serviceSupabase = {
    rpc: async () => {
      counter += 1;
      const current_count = counter;
      const is_allowed = current_count <= ANON_SCORING_LIMIT;
      return { data: [{ current_count, is_allowed }], error: null };
    },
  };

  const req = makeReq({ authorization: 'Bearer anonymous-token' });
  const supabase = {
    auth: { getUser: async () => ({ data: null, error: { message: 'Invalid token' } }) },
  };

  for (let i = 1; i <= ANON_SCORING_LIMIT; i++) {
    const result = await enforceAnonymousUsage(req, supabase, serviceSupabase);
    assert.strictEqual(result, null, `Expected allowed on try ${i}`);
  }

  const blocked = await enforceAnonymousUsage(req, supabase, serviceSupabase);
  assert.ok(blocked && blocked.blocked, 'Expected blocked after exceeding free tries');
  assert.strictEqual(blocked.status, 403);
});

test('authenticated users bypass anonymous usage tracking', async () => {
  const req = makeReq({ authorization: 'Bearer user-token' });
  const supabase = {
    auth: { getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }) },
  };

  let rpcCalled = false;
  const serviceSupabase = {
    rpc: async () => {
      rpcCalled = true;
      return { data: [{ current_count: 1, is_allowed: true }], error: null };
    },
  };

  const result = await enforceAnonymousUsage(req, supabase, serviceSupabase);
  assert.strictEqual(result, null);
  assert.strictEqual(rpcCalled, false, 'Service RPC should not be called for authenticated users');
});

test('tracking service error returns fail-closed response', async () => {
  const req = makeReq({ authorization: 'Bearer anonymous-token' });
  const supabase = {
    auth: { getUser: async () => ({ data: null, error: { message: 'Invalid token' } }) },
  };
  const serviceSupabase = {
    rpc: async () => ({ data: null, error: { message: 'db error' } }),
  };

  const res = await enforceAnonymousUsage(req, supabase, serviceSupabase);
  assert.ok(res && res.blocked, 'Expected blocked response when tracking service returns error');
  assert.strictEqual(res.status, 503);
});
