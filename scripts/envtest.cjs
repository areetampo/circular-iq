// simple script to test backend config parsing
process.env.OPENAI_API_KEY = 'foo';
process.env.SUPABASE_URL = 'http://localhost';
process.env.SUPABASE_ANON_KEY = 'anon';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
process.env.AIVEN_HOST = 'host';
process.env.AIVEN_DATABASE = 'db';
process.env.AIVEN_USER = 'user';
process.env.AIVEN_PASSWORD = 'pass';
process.env.FRONTEND_URL = 'http://localhost';

const cfg = require('../backend/config/backend.config.js');
console.log('Aiven config', cfg.BACKEND_CONFIG.aiven);
console.log('Supabase config', cfg.BACKEND_CONFIG.supabase);
