import assert from 'node:assert/strict';
import test from 'node:test';

import { setDatabaseClientOverride } from '#database/client.js';
import { DocumentsRepository } from '#database/repositories/documents.repository.js';

// Helpers to reset overrides after each test
function clearOverride() {
  setDatabaseClientOverride(null);
}

test('countByCategory returns scalar from supabase and honors override', async () => {
  let rpcCalled = false;

  const mock = {
    rpc: async (fn, params) => {
      rpcCalled = true;
      assert.strictEqual(fn, 'count_documents_by_category');
      assert.deepStrictEqual(params, { category: 'foo' });
      return { data: 42, error: null };
    },
    query: async () => {
      throw new Error('query should not be called for supabase');
    },
  };

  setDatabaseClientOverride(mock, 'supabase');
  const repo = new DocumentsRepository();
  const count = await repo.countByCategory('foo');
  assert.strictEqual(rpcCalled, true);
  assert.strictEqual(count, 42);
  clearOverride();
});

test('countByCategory returns aliased count from postgres and honors override', async () => {
  let queryCalled = false;

  const mockPg = {
    query: async (sql, params) => {
      queryCalled = true;
      assert.ok(sql.includes('as count'));
      assert.deepStrictEqual(params, ['bar']);
      return { rows: [{ count: 5 }] };
    },
  };

  setDatabaseClientOverride(mockPg, 'postgres');
  const repo = new DocumentsRepository();
  const count = await repo.countByCategory('bar');
  assert.strictEqual(queryCalled, true);
  assert.strictEqual(count, 5);
  clearOverride();
});

test('matchDocuments uses rpc for supabase override', async () => {
  let rpcCalled = false;
  const expectedEmbedding = [0, 1, 2];

  const mock = {
    rpc: async (fn, params) => {
      rpcCalled = true;
      assert.strictEqual(fn, 'match_documents');
      assert.deepStrictEqual(params, { query_embedding: expectedEmbedding, match_count: 3 });
      return { data: [{ id: 1 }], error: null };
    },
  };

  setDatabaseClientOverride(mock, 'supabase');
  const repo = new DocumentsRepository();
  const rows = await repo.matchDocuments(expectedEmbedding, 3);
  assert(rpcCalled);
  assert.deepStrictEqual(rows, [{ id: 1 }]);
  clearOverride();
});

test('matchDocuments uses query for postgres override', async () => {
  let queryCalled = false;
  const expectedEmbedding = [5, 6, 7];

  const mockPg = {
    query: async (sql, params) => {
      queryCalled = true;
      assert.ok(sql.includes('match_documents')); // function name should appear
      assert.ok(sql.includes('::extensions.halfvec'), 'expected halfvec cast in SQL');
      assert.deepStrictEqual(params, [`[${expectedEmbedding.join(',')}]`, 2]);
      return { rows: [{ id: 2 }] };
    },
  };

  setDatabaseClientOverride(mockPg, 'postgres');
  const repo = new DocumentsRepository();
  const rows = await repo.matchDocuments(expectedEmbedding, 2);
  assert(queryCalled);
  assert.deepStrictEqual(rows, [{ id: 2 }]);
  clearOverride();
});
