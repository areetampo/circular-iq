import { after, before } from 'node:test';

import { closeAllPools } from '#database/client.js';
import { stopServer } from '#server/index.js';

let app;

before(async () => {
  const mod = await import('#server/index.js');
  app = mod.default || mod.app || mod;
});

after(async () => {
  console.log('🧹 Starting test cleanup...');

  // Force cleanup with timeout
  const cleanupPromises = [];

  try {
    // Stop server with timeout
    const serverStop = Promise.race([
      stopServer(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Server stop timeout')), 5000)),
    ]);
    cleanupPromises.push(serverStop);
  } catch (err) {
    console.warn('⚠️  Server stop error:', err.message);
  }

  try {
    // Close database pools with timeout
    const dbClose = Promise.race([
      closeAllPools(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database close timeout')), 5000),
      ),
    ]);
    cleanupPromises.push(dbClose);
  } catch (err) {
    console.warn('⚠️  Database close error:', err.message);
  }

  // Wait for cleanup with timeout
  try {
    await Promise.race([
      Promise.allSettled(cleanupPromises),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Cleanup timeout')), 10000)),
    ]);
    console.log('✅ Test cleanup completed');
  } catch (err) {
    console.warn('⚠️  Cleanup timeout/error:', err.message);
  }

  // Force exit if still hanging
  setTimeout(() => {
    console.log('🚀 Force exiting test process');
    process.exit(0);
  }, 2000);
});
