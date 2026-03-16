import assert from 'node:assert/strict';
import test from 'node:test';

import { enforceAnonymousUsage } from '#controllers/scoring.controller.js';
import { MAX_FREE_TRIES } from '#utils/anonymousTracking.js';

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

test('anonymous usage allows up to MAX_FREE_TRIES then blocks', async (t) => {
  // create a closure-backed counter to simulate RPC increments
  let counter = 0;

  const serviceSupabase = {
    rpc: async (fnName, params) => {
      counter += 1;
      const current_count = counter;
      const is_allowed = current_count <= MAX_FREE_TRIES;
      return { data: [{ current_count, is_allowed }], error: null };
    },
  };

  const req = makeReq();

  // Call MAX_FREE_TRIES times and expect null (allowed)
  for (let i = 1; i <= MAX_FREE_TRIES; i++) {
    const result = await enforceAnonymousUsage(req, null, serviceSupabase);
    assert.strictEqual(result, null, `Expected allowed on try ${i}`);
  }

  // Next call should be blocked
  const blocked = await enforceAnonymousUsage(req, null, serviceSupabase);
  assert.ok(blocked && blocked.blocked, 'Expected blocked after exceeding free tries');
  assert.strictEqual(blocked.status, 403);
});

test('authenticated users bypass anonymous usage tracking', async (t) => {
  const req = makeReq({ authorization: 'Bearer user-token' });

  const supabase = {
    auth: {
      getUser: async (token) => {
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

test('tracking service error returns fail-closed response', async (t) => {
  const req = makeReq();
  const serviceSupabase = {
    rpc: async () => ({ data: null, error: { message: 'db error' } }),
  };

  const res = await enforceAnonymousUsage(req, null, serviceSupabase);
  assert.ok(res && res.blocked, 'Expected blocked response when tracking service returns error');
  assert.strictEqual(res.status, 503);
});
