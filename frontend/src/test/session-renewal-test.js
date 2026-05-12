/**
 * Test utility to verify session_id renewal on login
 * This can be used in browser console to test the functionality
 */

import { logger } from '@/utils/logger';
import { getSessionId } from '@/utils/session';

/**
 * Test session ID renewal functionality
 * Call this in browser console before and after login to verify renewal
 */
export function testSessionIdRenewal() {
  const currentSessionId = getSessionId();
  logger.log('Current session_id:', currentSessionId);

  // Store current session ID for comparison
  window.testOldSessionId = currentSessionId;

  return {
    currentSessionId,
    message: 'Session ID captured. Log in and then call compareSessionIds() to verify renewal.',
  };
}

/**
 * Compare session IDs before and after login
 */
export function compareSessionIds() {
  const newSessionId = getSessionId();
  const oldSessionId = window.testOldSessionId;

  logger.log('Old session_id:', oldSessionId);
  logger.log('New session_id:', newSessionId);
  logger.log('Session ID renewed:', oldSessionId !== newSessionId);

  return {
    oldSessionId,
    newSessionId,
    renewed: oldSessionId !== newSessionId,
    message:
      oldSessionId !== newSessionId
        ? '✓ Session ID successfully renewed on login!'
        : '✕ Session ID was not renewed (same as before login)',
  };
}

/**
 * Force renew session ID manually (for testing)
 */
export function forceRenewSessionId() {
  const oldSessionId = getSessionId();
  const newSessionId = getSessionId(true); // Force renewal

  logger.log('Old session_id:', oldSessionId);
  logger.log('New session_id:', newSessionId);
  logger.log('Manual renewal successful:', oldSessionId !== newSessionId);

  return {
    oldSessionId,
    newSessionId,
    renewed: oldSessionId !== newSessionId,
  };
}

// Make functions available globally for easy console testing
if (typeof window !== 'undefined') {
  window.testSessionIdRenewal = testSessionIdRenewal;
  window.compareSessionIds = compareSessionIds;
  window.forceRenewSessionId = forceRenewSessionId;
}
