/**
 * @module session-clearing-test
 * @description Manual/integration checks for clearing session storage on sign-out.
 * Test utility to verify session_evaluation_state clearing on auth events
 * This can be used in browser console to test the functionality
 */

import { clearEvaluationState } from '@/lib/storage';
import { logger } from '@/utils/logger';
import { getSession, getSessionId, saveSession } from '@/utils/session';

/**
 * Create test session data (inputs and results)
 */
export function createTestSessionData() {
  const testSession = {
    inputs: {
      businessProblem: 'Test business problem for session clearing verification',
      businessSolution: 'Test business solution for session clearing verification',
      evaluationParameters: {
        industry: 'technology',
        companySize: 'small',
      },
      businessContext: {
        location: 'US',
        market: 'B2B',
      },
    },
    results: {
      overallScore: 85,
      circularityScore: 78,
      recommendations: ['Test recommendation 1', 'Test recommendation 2'],
      timestamp: new Date().toISOString(),
      businessProblem: 'Test business problem for session clearing verification',
      businessSolution: 'Test business solution for session clearing verification',
      evaluationParameters: {
        industry: 'technology',
        companySize: 'small',
      },
    },
    timestamp: new Date().toISOString(),
  };

  // Save test session data
  const saved = saveSession(testSession);
  logger.log('[TEST_SESSION_CREATED]', { saved, testData: testSession });

  return testSession;
}

/**
 * Check current session state
 */
export function checkCurrentSessionState() {
  const currentSession = getSession();
  const sessionId = getSessionId();

  logger.log('[CURRENT_SESSION_STATE]', {
    sessionId,
    hasSession: !!currentSession,
    hasInputs: !!currentSession?.inputs,
    hasResults: !!currentSession?.results,
    inputs: currentSession?.inputs ? 'present' : 'none',
    results: currentSession?.results ? 'present' : 'none',
    timestamp: currentSession?.timestamp || 'none',
  });

  return {
    sessionId,
    session: currentSession,
    hasInputs: !!currentSession?.inputs,
    hasResults: !!currentSession?.results,
  };
}

/**
 * Test session clearing manually
 */
export function testManualSessionClearing() {
  logger.log('\n=== TESTING MANUAL SESSION CLEARING ===');

  // 1. Check initial state
  const beforeState = checkCurrentSessionState();

  // 2. Create test data if session is empty
  if (!beforeState.hasInputs && !beforeState.hasResults) {
    logger.log('[TEST] Creating test session data...');
    createTestSessionData();
  }

  // 3. Check state after creating test data
  const afterCreationState = checkCurrentSessionState();

  // 4. Clear session manually
  logger.log('[TEST] Clearing session_evaluation_state manually...');
  const cleared = clearEvaluationState();
  logger.log('[MANUAL_CLEAR_RESULT]', { cleared });

  // 5. Check final state
  const finalState = checkCurrentSessionState();

  // 6. Report results
  const testPassed = !finalState.hasInputs && !finalState.hasResults;
  logger.log('\n=== MANUAL CLEARING TEST RESULTS ===');
  logger.log('Test passed:', testPassed);
  logger.log('Before clearing:', {
    hasInputs: afterCreationState.hasInputs,
    hasResults: afterCreationState.hasResults,
  });
  logger.log('After clearing:', {
    hasInputs: finalState.hasInputs,
    hasResults: finalState.hasResults,
  });

  return {
    testPassed,
    beforeState,
    afterCreationState,
    finalState,
  };
}

/**
 * Prepare for auth testing (creates test session data)
 */
export function prepareForAuthTest() {
  logger.log('\n=== PREPARING FOR AUTH TEST ===');

  // Clear any existing session first
  clearEvaluationState();

  // Create test session data
  const testData = createTestSessionData();

  // Verify data was created
  const state = checkCurrentSessionState();

  logger.log('[AUTH_TEST_PREPARED]', {
    hasInputs: state.hasInputs,
    hasResults: state.hasResults,
    readyForAuthTest: state.hasInputs && state.hasResults,
  });

  return {
    testData,
    sessionState: state,
    readyForAuthTest: state.hasInputs && state.hasResults,
  };
}

/**
 * Verify session was cleared after auth event
 */
export function verifySessionClearedAfterAuth() {
  logger.log('\n=== VERIFYING SESSION CLEARED AFTER AUTH ===');

  const state = checkCurrentSessionState();
  const cleared = !state.hasInputs && !state.hasResults;

  logger.log('[AUTH_CLEAR_VERIFICATION]', {
    cleared,
    hasInputs: state.hasInputs,
    hasResults: state.hasResults,
    sessionId: state.sessionId,
  });

  return {
    cleared,
    sessionState: state,
  };
}

/**
 * Complete auth flow test
 */
export function runCompleteAuthFlowTest() {
  logger.log('\n=== COMPLETE AUTH FLOW TEST ===');
  logger.log('This test will guide you through the complete auth flow testing.');
  logger.log('Follow these steps in order:');
  logger.log('');
  logger.log('1. Run: prepareForAuthTest() - Creates test session data');
  logger.log('2. Reload the page - Session should REMAIN (not cleared)');
  logger.log('3. Log in or create an account in the UI');
  logger.log('4. Run: verifySessionClearedAfterAuth() - Checks if session was cleared on login');
  logger.log('5. Log out in the UI');
  logger.log('6. Run: verifySessionClearedAfterAuth() - Checks if session was cleared on logout');
  logger.log('');
  logger.log('Expected console logs:');
  logger.log('- [SESSION_RESTORED] on page reload (session should remain)');
  logger.log('- [SESSION_STATE_CLEARED_ON_LOGIN] when you log in');
  logger.log('- [SESSION_STATE_CLEARED_ON_LOGOUT] when you log out');
  logger.log('- Session data should persist on reload but clear on auth events');
}

/**
 * Test page reload behavior
 */
export function testPageReloadBehavior() {
  logger.log('\n=== TESTING PAGE RELOAD BEHAVIOR ===');
  logger.log('This test verifies that session_evaluation_state persists on page reload.');
  logger.log('');
  logger.log('1. Run: prepareForAuthTest() - Creates test session data');
  logger.log('2. Check current session: checkCurrentSessionState()');
  logger.log('3. Reload the page (F5)');
  logger.log('4. Check session again: checkCurrentSessionState()');
  logger.log('5. Session should be the same (not cleared)');
  logger.log('');
  logger.log('Expected: Session data should persist across page reloads');
  logger.log('Look for [SESSION_RESTORED] log in console');
}

// Make functions available globally for easy console testing
if (typeof window !== 'undefined') {
  window.testSessionClearing = {
    createTestData: createTestSessionData,
    checkState: checkCurrentSessionState,
    testManualClearing: testManualSessionClearing,
    prepareForAuthTest: prepareForAuthTest,
    verifyCleared: verifySessionClearedAfterAuth,
    runCompleteTest: runCompleteAuthFlowTest,
    testReloadBehavior: testPageReloadBehavior,
  };

  logger.log('[SESSION_CLEARING_TEST_UTILS_LOADED]');
  logger.log('Available functions: window.testSessionClearing.*');
  logger.log('Run: window.testSessionClearing.runCompleteTest() for auth flow test');
  logger.log('Run: window.testSessionClearing.testReloadBehavior() for page reload test');
}
