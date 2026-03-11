import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const IS_PROD = NODE_ENV === 'production';

// Load .env.backend in all non-production environments, including tests.
// We use override:false so that any environment variables explicitly set by
// test code take precedence.
if (!IS_PROD) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const rootEnvPath = path.resolve(__dirname, '..', '..', 'env');

  const backendPath = path.join(rootEnvPath, '.env.backend');

  if (fs.existsSync(backendPath)) {
    dotenv.config({ path: backendPath, override: false });
  }
}
