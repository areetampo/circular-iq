/** Barrel re-exports for database clients, pools, and repository singletons. */

import { CeCasesRepository } from '#database/repositories/ce_cases.repository.js';
import { DocumentsRepository } from '#database/repositories/documents.repository.js';

export const documentsRepository = new DocumentsRepository();
export const ceCasesRepository = new CeCasesRepository();

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
