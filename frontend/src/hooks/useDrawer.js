import { useRef, useState } from 'react';

import { DRAWER_TYPES } from '@/constants';

// Matches the Drawer CSS close transition plus a small buffer before unmount.
const CLOSE_ANIMATION_MS = 200;

/**
 * Manages the shared side-drawer state and delayed unmount after close animations.
 * Opening a new drawer clears any pending close timeout so rapid replacements remain mounted.
 *
 * @returns {{
 *   drawer: { type: string|null, data: Object|null, isOpen: boolean },
 *   isDrawerOpen: boolean,
 *   onClose: () => void,
 *   openAssessmentMethodologyDrawer: () => void,
 *   openEvaluationCriteriaDrawer: () => void,
 *   openBusinessProblemInfoDrawer: () => void,
 *   openBusinessSolutionInfoDrawer: () => void,
 *   openBusinessContextHeadingInfoDrawer: () => void,
 *   openEvaluationParametersHeadingInfoDrawer: () => void,
 *   openSpecificEvaluationParameterInfoDrawer: (paramKey: string) => void,
 *   openSampleTestCasesHeadingInfoDrawer: () => void,
 *   openSpecificSampleTestCaseViewDetailsDrawer: (testCase: Object) => void,
 *   openResultsDatabaseEvidenceDetailsDrawer: (caseItem: Object) => void
 * }} Drawer state plus typed opener callbacks for every drawer used by the app shell.
 */
export default function useDrawer() {
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
    // Keep `type` during the close transition so the Drawer content can animate out.
    setDrawerState((s) => (s.type ? { ...s, isOpen: false } : s));

    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setDrawerState({ type: null, data: null, isOpen: false });
      closeTimerRef.current = null;
    }, CLOSE_ANIMATION_MS);
  };

  return {
    drawer: drawerState,
    isDrawerOpen: Boolean(drawerState?.isOpen),
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

    openResultsDatabaseEvidenceDetailsDrawer: (caseItem) =>
      openDrawer(DRAWER_TYPES.RESULTS_DATABASE_EVIDENCE_DETAILS, { caseItem }),
  };
}
