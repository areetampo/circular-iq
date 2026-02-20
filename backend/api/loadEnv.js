import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const localPath = path.resolve(process.cwd(), '.env.local');

if (fs.existsSync(localPath)) {
  dotenv.config({ path: localPath });
  console.log('✅ Environment: Loaded from .env.local');
} else {
  // On Railway, this will load nothing (which is fine,
  // as Railway variables are already in the environment)
  dotenv.config();
  console.log('ℹ️  Environment: Using system/dashboard variables');
}

// --- Environment Verification ---
const requiredKeys = [
  'OPENAI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];
const otherKeys = ['PORT', 'NODE_ENV', 'FRONTEND_URL', 'MAX_FREE_TRIES', 'LOG_LEVEL'];

const missingKeys = requiredKeys.filter((key) => !process.env[key]);

console.log('🔍 Verifying environment variables...');
otherKeys.forEach((key) => {
  if (process.env[key]) {
    console.log(`   - ${key}: ${process.env[key]}`);
  } else {
    console.warn(`   - ${key}: Not set (using default)`);
  }
});

if (missingKeys.length > 0) {
  console.error(`❌ MISSING CRITICAL KEYS: ${missingKeys.join(', ')}`);

  if (process.env.NODE_ENV === 'production') {
    console.error('Shutting down due to missing configuration.');
    process.exit(1);
  }
} else {
  const mask = (val) => `${val.substring(0, 4)}...${val.substring(val.length - 4)}`;

  console.log('✅ All API keys loaded:');
  console.log(`   - OpenAI Key: ${mask(process.env.OPENAI_API_KEY)}`);
  console.log(`   - Supabase URL: ${process.env.SUPABASE_URL}`);
  console.log(`   - Supabase Anon Key: ${mask(process.env.SUPABASE_ANON_KEY)}`);
  console.log(`   - Supabase Service Key: ${mask(process.env.SUPABASE_SERVICE_ROLE_KEY)}`);
}

console.log('-'.repeat(20));
