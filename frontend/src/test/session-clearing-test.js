/**
 * Test utility to verify session_evaluation_state clearing on auth events
 * This can be used in browser console to test the functionality
 */

import { clearEvaluationState } from '@/lib/storage';
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
  console.log('[TEST_SESSION_CREATED]', { saved, testData: testSession });

  return testSession;
}

/**
 * Check current session state
 */
export function checkCurrentSessionState() {
  const currentSession = getSession();
  const sessionId = getSessionId();

  console.log('[CURRENT_SESSION_STATE]', {
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
  console.log('\n=== TESTING MANUAL SESSION CLEARING ===');

  // 1. Check initial state
  const beforeState = checkCurrentSessionState();

  // 2. Create test data if session is empty
  if (!beforeState.hasInputs && !beforeState.hasResults) {
    console.log('[TEST] Creating test session data...');
    createTestSessionData();
  }

  // 3. Check state after creating test data
  const afterCreationState = checkCurrentSessionState();

  // 4. Clear session manually
  console.log('[TEST] Clearing session_evaluation_state manually...');
  const cleared = clearEvaluationState();
  console.log('[MANUAL_CLEAR_RESULT]', { cleared });

  // 5. Check final state
  const finalState = checkCurrentSessionState();

  // 6. Report results
  const testPassed = !finalState.hasInputs && !finalState.hasResults;
  console.log('\n=== MANUAL CLEARING TEST RESULTS ===');
  console.log('Test passed:', testPassed);
  console.log('Before clearing:', {
    hasInputs: afterCreationState.hasInputs,
    hasResults: afterCreationState.hasResults,
  });
  console.log('After clearing:', {
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
  console.log('\n=== PREPARING FOR AUTH TEST ===');

  // Clear any existing session first
  clearEvaluationState();

  // Create test session data
  const testData = createTestSessionData();

  // Verify data was created
  const state = checkCurrentSessionState();

  console.log('[AUTH_TEST_PREPARED]', {
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
  console.log('\n=== VERIFYING SESSION CLEARED AFTER AUTH ===');

  const state = checkCurrentSessionState();
  const cleared = !state.hasInputs && !state.hasResults;

  console.log('[AUTH_CLEAR_VERIFICATION]', {
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
  console.log('\n=== COMPLETE AUTH FLOW TEST ===');
  console.log('This test will guide you through the complete auth flow testing.');
  console.log('Follow these steps in order:');
  console.log('');
  console.log('1. Run: prepareForAuthTest() - Creates test session data');
  console.log('2. Reload the page - Session should REMAIN (not cleared)');
  console.log('3. Log in or create an account in the UI');
  console.log('4. Run: verifySessionClearedAfterAuth() - Checks if session was cleared on login');
  console.log('5. Log out in the UI');
  console.log('6. Run: verifySessionClearedAfterAuth() - Checks if session was cleared on logout');
  console.log('');
  console.log('Expected console logs:');
  console.log('- [SESSION_RESTORED] on page reload (session should remain)');
  console.log('- [SESSION_STATE_CLEARED_ON_LOGIN] when you log in');
  console.log('- [SESSION_STATE_CLEARED_ON_LOGOUT] when you log out');
  console.log('- Session data should persist on reload but clear on auth events');
}

/**
 * Test page reload behavior
 */
export function testPageReloadBehavior() {
  console.log('\n=== TESTING PAGE RELOAD BEHAVIOR ===');
  console.log('This test verifies that session_evaluation_state persists on page reload.');
  console.log('');
  console.log('1. Run: prepareForAuthTest() - Creates test session data');
  console.log('2. Check current session: checkCurrentSessionState()');
  console.log('3. Reload the page (F5)');
  console.log('4. Check session again: checkCurrentSessionState()');
  console.log('5. Session should be the same (not cleared)');
  console.log('');
  console.log('Expected: Session data should persist across page reloads');
  console.log('Look for [SESSION_RESTORED] log in console');
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

  console.log('[SESSION_CLEARING_TEST_UTILS_LOADED]');
  console.log('Available functions: window.testSessionClearing.*');
  console.log('Run: window.testSessionClearing.runCompleteTest() for auth flow test');
  console.log('Run: window.testSessionClearing.testReloadBehavior() for page reload test');
}
