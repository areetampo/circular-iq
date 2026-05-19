/**
 * @module database
 * @description Central export point for database clients and repositories.
 * Provides singleton instances of repositories and re-exports database client
 * utilities for convenient importing throughout the application.
 *
 * Exports:
 * - documentsRepository: Singleton DocumentsRepository instance
 * - ceCasesRepository:   Singleton CeCasesRepository instance
 * - Client utilities:    getSupabaseClient, getSupabasePgPool, getAivenPgPool,
 *                        getDatabaseClient, getDatabaseType,
 *                        setDatabaseClientOverride, closeAllPools
 * - Supabase factories:  createSupabaseClient, createSupabaseAnonClient
 */

import { CeCasesRepository } from '#database/repositories/ce_cases.repository.js';
import { DocumentsRepository } from '#database/repositories/documents.repository.js';

/** Singleton DocumentsRepository — honours test client overrides via client.js. */
export const documentsRepository = new DocumentsRepository();

/** Singleton CeCasesRepository — always backed by the Supabase service-role client. */
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
