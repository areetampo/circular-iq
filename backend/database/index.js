import { DocumentsRepository } from '#database/repositories/documents.repository.js';
import { BACKEND_CONFIG } from '#config/backend.config.js';
import { getSupabaseClient, getPgPool } from '#database/client.js';

// create a single repository instance and reuse it; it will determine
// type internally (honoring any overrides set for testing).
export const documentsRepository = new DocumentsRepository();

// export helpers in case other consumers need direct clients
export const supabase = getSupabaseClient();
export const pgPool = getPgPool();
