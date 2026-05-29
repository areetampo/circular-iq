/**
 * Global logger declarations for modules that use the app logger without importing it.
 */
// Using 'import type' prevents the ESLint "unused-imports" rule
// from deleting this line on save.
import type { logger as LoggerInstance } from '@/utils/logger';

declare global {
  const logger: typeof LoggerInstance;

  interface Window {
    logger: typeof LoggerInstance;
  }
}

// Crucial: This makes the file a module
export {};
