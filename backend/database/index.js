import { getSupabaseClient } from '#database/client.js';
import { DocumentsRepository } from '#database/repositories/documents.repository.js';

// create a single repository instance and reuse it; it will determine
// type internally (honoring any overrides set for testing).
export const documentsRepository = new DocumentsRepository();

// export helpers in case other consumers need direct clients
export const supabase = getSupabaseClient();

export { createSupabaseAnonClient, createSupabaseClient } from '#database/supabase.client.js';

export {
  closeAllPools,
  getAivenPgPool,
  getDatabaseClient,
  getDatabaseType,
  getSupabaseClient,
  getSupabasePgPool,
  setDatabaseClientOverride,
} from '#database/client.js';

export * as ce_cases from '#database/repositories/ce_cases.repository.js';
