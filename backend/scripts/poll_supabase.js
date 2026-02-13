#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function poll(timeoutMs = 20*60*1000, intervalMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const { count, error } = await supabase.from('documents').select('*', { count: 'exact' });
      if (error) {
        console.error('Supabase error:', error.message);
      } else {
        console.log('CURRENT_COUNT:', count);
        if (count && count > 0) return process.exit(0);
      }
    } catch (e) {
      console.error('Poll error:', e.message);
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  console.error('Timeout waiting for Supabase vectors');
  process.exit(2);
}

poll();
