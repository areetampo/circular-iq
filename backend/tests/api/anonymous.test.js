import assert from 'node:assert/strict';
import test from 'node:test';

import { enforceAnonymousUsage } from '#controllers/scoring.controller.js';
import { ANON_SCORING_LIMIT } from '#utils/anonymousTracking.js';
import { logger } from '#utils/logger.js';

// The scoring controller expects `logger` to exist on the global scope.
// Server startup sets `globalThis.logger`; unit tests run this controller directly.
globalThis.logger = logger;

// Mock request factory
function makeReq({ ip = '127.0.0.1', ua = 'test-agent', authorization } = {}) {
  const headers = {
    'user-agent': ua,
  };
  if (authorization) headers.authorization = authorization;
  // simulate proxy header
  headers['x-forwarded-for'] = ip;

  return { headers };
}

test('anonymous usage allows up to ANON_SCORING_LIMIT then blocks', async () => {
  // create a closure-backed counter to simulate RPC increments
  let counter = 0;

  const serviceSupabase = {
    rpc: async () => {
      counter += 1;
      const current_count = counter;
      const is_allowed = current_count <= ANON_SCORING_LIMIT;
      return { data: [{ current_count, is_allowed }], error: null };
    },
  };

  // Provide a Bearer header (with a non-master token) so enforceAnonymousUsage
  // does not "skip anonymous check" in NODE_ENV=test.
  const req = makeReq({ authorization: 'Bearer anonymous-token' });

  // Mock supabase object to prevent null reference errors
  const supabase = {
    auth: {
      getUser: async () => ({ data: null, error: { message: 'Invalid token' } }),
    },
  };

  // Call ANON_SCORING_LIMIT times and expect null (allowed)
  for (let i = 1; i <= ANON_SCORING_LIMIT; i++) {
    const result = await enforceAnonymousUsage(req, supabase, serviceSupabase);
    assert.strictEqual(result, null, `Expected allowed on try ${i}`);
  }

  // Next call should be blocked
  const blocked = await enforceAnonymousUsage(req, supabase, serviceSupabase);
  assert.ok(blocked && blocked.blocked, 'Expected blocked after exceeding free tries');
  assert.strictEqual(blocked.status, 403);
});

test('authenticated users bypass anonymous usage tracking', async () => {
  const req = makeReq({ authorization: 'Bearer user-token' });

  const supabase = {
    auth: {
      getUser: async () => {
        return { data: { user: { id: 'user-1' } }, error: null };
      },
    },
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
  // Provide a Bearer header (with a non-master token) so enforceAnonymousUsage
  // does not "skip anonymous check" in NODE_ENV=test.
  const req = makeReq({ authorization: 'Bearer anonymous-token' });

  // Mock supabase object to prevent null reference errors
  const supabase = {
    auth: {
      getUser: async () => ({ data: null, error: { message: 'Invalid token' } }),
    },
  };

  const serviceSupabase = {
    rpc: async () => ({ data: null, error: { message: 'db error' } }),
  };

  const res = await enforceAnonymousUsage(req, supabase, serviceSupabase);
  assert.ok(res && res.blocked, 'Expected blocked response when tracking service returns error');
  assert.strictEqual(res.status, 503);
});
