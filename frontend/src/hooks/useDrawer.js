import { useRef, useState } from 'react';

import DRAWER_TYPES from '@/constants/drawerTypes';

/**
 * useDrawer
 * Local drawer stack: type, payload, open/close with animation timing.
 * @returns {Object}
 */

// Match the CSS transition duration used by Drawer (overlay/content)
// reduced from 320ms to match the faster CSS transitions + small buffer
const CLOSE_ANIMATION_MS = 200;

export default function useDrawer() {
  // drawerState.type === null => no drawer mounted
  // when mounted: { type, data, isOpen }
  const [drawerState, setDrawerState] = useState({ type: null, data: null, isOpen: false });
  const closeTimerRef = useRef(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openDrawer = (type, data = null) => {
    clearCloseTimer();
    setDrawerState({ type, data, isOpen: true });
  };

  const closeDrawer = () => {
    // Begin closing animation (set isOpen=false) but keep `type` so Drawer
    // component remains mounted until the animation finishes.
    setDrawerState((s) => (s.type ? { ...s, isOpen: false } : s));

    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setDrawerState({ type: null, data: null, isOpen: false });
      closeTimerRef.current = null;
    }, CLOSE_ANIMATION_MS);
  };

  return {
    drawer: drawerState,
    // Exposed boolean used by Drawer primitive to control open/closed state
    isDrawerOpen: Boolean(drawerState?.isOpen),
    // Caller-facing close function (initiates smooth close + delayed unmount)
    onClose: closeDrawer,

    openAssessmentMethodologyDrawer: () => openDrawer(DRAWER_TYPES.ASSESSMENT_METHODOLOGY),

    openEvaluationCriteriaDrawer: () => openDrawer(DRAWER_TYPES.EVALUATION_CRITERIA),

    openBusinessProblemInfoDrawer: () => openDrawer(DRAWER_TYPES.BUSINESS_PROBLEM_INFO),

    openBusinessSolutionInfoDrawer: () => openDrawer(DRAWER_TYPES.BUSINESS_SOLUTION_INFO),

    openBusinessContextHeadingInfoDrawer: () =>
      openDrawer(DRAWER_TYPES.BUSINESS_CONTEXT_HEADING_INFO),

    openEvaluationParametersHeadingInfoDrawer: () =>
      openDrawer(DRAWER_TYPES.EVALUATION_PARAMETERS_HEADING_INFO),

    openSpecificEvaluationParameterInfoDrawer: (paramKey) =>
      openDrawer(DRAWER_TYPES.SPECIFIC_EVALUATION_PARAMETER_INFO, { paramKey }),

    openSampleTestCasesHeadingInfoDrawer: () =>
      openDrawer(DRAWER_TYPES.SAMPLE_TEST_CASES_HEADING_INFO),

    openSpecificSampleTestCaseViewDetailsDrawer: (testCase) =>
      openDrawer(DRAWER_TYPES.SPECIFIC_SAMPLE_TEST_CASE_VIEW_DETAILS, { testCase }),

    openResultsDatabaseEvidenceDetailsDrawer: (evidenceData) =>
      openDrawer(DRAWER_TYPES.RESULTS_DATABASE_EVIDENCE_DETAILS, evidenceData),
  };
}
