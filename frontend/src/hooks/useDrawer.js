import { useState, useRef } from 'react';
import DRAWERS from '@/components/drawers/drawerTypes';

// Match the CSS transition duration used by Drawer (overlay/content)
// reduced from 320ms to match the faster 200ms CSS transitions + small buffer
const CLOSE_ANIMATION_MS = 260;

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

    openAssessmentMethodologyDrawer: () => openDrawer(DRAWERS.ASSESSMENT_METHODOLOGY),
    openEvaluationCriteriaDrawer: () => openDrawer(DRAWERS.EVALUATION_CRITERIA),
    openBusinessProblemInfoDrawer: () => openDrawer(DRAWERS.BUSINESS_PROBLEM_INFO),
    openBusinessSolutionInfoDrawer: () => openDrawer(DRAWERS.BUSINESS_SOLUTION_INFO),
    openEvaluationParametersHeadingInfoDrawer: () =>
      openDrawer(DRAWERS.EVALUATION_PARAMETERS_HEADING_INFO),

    openSpecificEvaluationParameterInfoDrawer: (paramKey) =>
      openDrawer(DRAWERS.SPECIFIC_EVALUATION_PARAMETER_INFO, { paramKey }),

    openTestCasesHeadingInfoDrawer: () => openDrawer(DRAWERS.SAMPLE_TEST_CASES_HEADING_INFO),
    openSampleTestCasesHeadingInfoDrawer: () => openDrawer(DRAWERS.SAMPLE_TEST_CASES_HEADING_INFO),

    openSpecificTestCaseDetailsDrawer: (testCase) =>
      openDrawer(DRAWERS.SPECIFIC_SAMPLE_TEST_CASE_VIEW_DETAILS, { testCase }),
    openSpecificSampleTestCaseViewDetailsDrawer: (testCase) =>
      openDrawer(DRAWERS.SPECIFIC_SAMPLE_TEST_CASE_VIEW_DETAILS, { testCase }),

    openResultsDatabaseEvidenceDetailsDrawer: (evidenceData) =>
      openDrawer(DRAWERS.RESULTS_DATABASE_EVIDENCE_DETAILS, evidenceData),

    openDashboardFeaturedSolutionsDrawer: (data) =>
      openDrawer(DRAWERS.DASHBOARD_FEATURED_SOLUTIONS, data),
  };
}
