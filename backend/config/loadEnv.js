import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const IS_PROD = NODE_ENV === 'production';

// Do not override process.env during tests — tests set env vars programmatically
if (!IS_PROD && NODE_ENV !== 'test') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const rootEnvPath = path.resolve(__dirname, '..', '..', 'env');

  const backendPath = path.join(rootEnvPath, '.env.backend');

  if (fs.existsSync(backendPath)) {
    // Do not override existing process.env values to preserve test-set variables
    dotenv.config({ path: backendPath, override: false });
  }
}
