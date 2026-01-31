/**
 * Session utilities
 * Re-exports session management functions from storage
 */

export {
  getSessionId,
  saveEvaluationState,
  loadEvaluationState,
  clearEvaluationState,
} from '@/lib/storage';
