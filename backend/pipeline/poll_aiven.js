import '#server/bootstrap.js';
import pg from 'pg';
import { BACKEND_CONFIG } from '#config/backend.config.js';

const { Pool } = pg;

if (!BACKEND_CONFIG.aiven?.connectionString) {
  console.warn('⚠️ Aiven connection string not configured. poll_aiven will exit.');
  process.exit(0);
}

const pool = new Pool({
  host: BACKEND_CONFIG.aiven.host,
  port: BACKEND_CONFIG.aiven.port,
  database: BACKEND_CONFIG.aiven.database,
  user: BACKEND_CONFIG.aiven.user,
  password: BACKEND_CONFIG.aiven.password,
  ssl: {
    rejectUnauthorized: true,
    ca: BACKEND_CONFIG.aiven.sslCA,
  },
});

async function poll(timeoutMs = 20 * 60 * 1000, intervalMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM ${BACKEND_CONFIG.db.tables.documents}`,
      );
      const count = parseInt(result.rows[0].count, 10);
      console.log('CURRENT_COUNT:', count);
      if (count && count > 0) {
        await pool.end();
        return process.exit(0);
      }
    } catch (e) {
      console.error('Poll error:', e.message);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  console.error('Timeout waiting for Aiven vectors');
  await pool.end();
  process.exit(2);
}

poll();
