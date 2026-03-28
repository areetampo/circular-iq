import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractIPAddress,
  extractUserAgent,
  createIdentifierHash,
  getIdentifierFromRequest,
  MAX_FREE_TRIES,
} from '#utils/anonymousTracking.js';

test('MAX_FREE_TRIES constant', () => {
  assert.strictEqual(typeof MAX_FREE_TRIES, 'number');
  assert.ok(MAX_FREE_TRIES > 0);
});

test('extractIPAddress', () => {
  // Test with x-forwarded-for header
  const req1 = {
    headers: {
      'x-forwarded-for': '192.168.1.1, 10.0.0.1',
    },
  };
  assert.strictEqual(extractIPAddress(req1), '192.168.1.1');

  // Test with x-real-ip header
  const req2 = {
    headers: {
      'x-real-ip': '192.168.1.2',
    },
  };
  assert.strictEqual(extractIPAddress(req2), '192.168.1.2');

  // Test with cf-connecting-ip header
  const req3 = {
    headers: {
      'cf-connecting-ip': '192.168.1.3',
    },
  };
  assert.strictEqual(extractIPAddress(req3), '192.168.1.3');

  // Test with connection.remoteAddress
  const req4 = {
    connection: {
      remoteAddress: '192.168.1.4',
    },
  };
  assert.strictEqual(extractIPAddress(req4), '192.168.1.4');

  // Test with socket.remoteAddress
  const req5 = {
    socket: {
      remoteAddress: '192.168.1.5',
    },
  };
  assert.strictEqual(extractIPAddress(req5), '192.168.1.5');

  // Test fallback to unknown
  const req6 = {};
  assert.strictEqual(extractIPAddress(req6), 'unknown');
});

test('extractUserAgent', () => {
  // Test with user agent header
  const req1 = {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  };
  assert.strictEqual(
    extractUserAgent(req1),
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  );

  // Test fallback to unknown
  const req2 = {};
  assert.strictEqual(extractUserAgent(req2), 'unknown');
});

test('createIdentifierHash', () => {
  const ip = '192.168.1.1';
  const userAgent = 'Mozilla/5.0';

  const hash1 = createIdentifierHash(ip, userAgent);
  const hash2 = createIdentifierHash(ip, userAgent);

  // Same inputs should produce same hash
  assert.strictEqual(hash1, hash2);

  // Hash should be a string
  assert.strictEqual(typeof hash1, 'string');

  // Hash should be reasonable length (SHA256 hex)
  assert.strictEqual(hash1.length, 64);

  // Different inputs should produce different hashes
  const hash3 = createIdentifierHash('192.168.1.2', userAgent);
  const hash4 = createIdentifierHash(ip, 'Chrome/90.0');

  assert.notStrictEqual(hash1, hash3);
  assert.notStrictEqual(hash1, hash4);
});

test('getIdentifierFromRequest', () => {
  const req = {
    headers: {
      'x-forwarded-for': '192.168.1.1',
      'user-agent': 'Mozilla/5.0',
    },
  };

  const result = getIdentifierFromRequest(req);

  assert.strictEqual(typeof result, 'object');
  assert.strictEqual(typeof result.hash, 'string');
  assert.strictEqual(typeof result.ip, 'string');
  assert.strictEqual(typeof result.userAgent, 'string');

  assert.strictEqual(result.ip, '192.168.1.1');
  assert.strictEqual(result.userAgent, 'Mozilla/5.0');
  assert.strictEqual(result.hash.length, 64);

  // Hash should be consistent
  const result2 = getIdentifierFromRequest(req);
  assert.strictEqual(result.hash, result2.hash);
});

test('getIdentifierFromRequest with missing headers', () => {
  const req = {};

  const result = getIdentifierFromRequest(req);

  assert.strictEqual(result.ip, 'unknown');
  assert.strictEqual(result.userAgent, 'unknown');
  assert.strictEqual(typeof result.hash, 'string');
  assert.strictEqual(result.hash.length, 64);
});
