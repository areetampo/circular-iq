import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: [path.resolve(process.cwd(), '.env.local'), path.resolve(process.cwd(), '.env')],
});

console.log('✅ Environment variables pre-loaded (Local > Default)');
