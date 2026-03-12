import '#server/bootstrap.js';
import { createSupabaseClient } from '#database/supabase.client.js';
import { BACKEND_CONFIG } from '#config/backend.config.js';

if (!BACKEND_CONFIG.supabase.serviceKey) {
  console.warn('⚠️️️  Supabase service key not configured. poll_supabase will exit.');
  process.exit(0);
}

const supabase = createSupabaseClient();

async function poll(timeoutMs = 20 * 60 * 1000, intervalMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const { count, error } = await supabase
        .from(BACKEND_CONFIG.db.tables.documents)
        .select('*', { count: 'exact' });
      if (error) {
        console.error('Supabase error:', error.message);
      } else {
        console.log('CURRENT_COUNT:', count);
        if (count && count > 0) return process.exit(0);
      }
    } catch (e) {
      console.error('Poll error:', e.message);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  console.error('Timeout waiting for Supabase vectors');
  process.exit(2);
}

poll();
