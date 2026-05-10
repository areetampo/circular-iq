/**
 * Drawer Type Constants
 * Defines all available drawer types in the application
 * Used for centralized dialog state management via DrawerManager
 *
 * Location: src/constants/drawerTypes.js
 *
 * @example
 * import DRAWER_TYPES from '@/constants/drawerTypes';
 * const { openAssessmentMethodologyDrawer } = useGlobalDrawer();
 * onClick={() => openAssessmentMethodologyDrawer()};
 */

const DRAWER_TYPES = {
  ASSESSMENT_METHODOLOGY: 'assessment-methodology',
  EVALUATION_CRITERIA: 'evaluation-criteria',
  BUSINESS_PROBLEM_INFO: 'business-problem',
  BUSINESS_SOLUTION_INFO: 'business-solution',
  BUSINESS_CONTEXT_HEADING_INFO: 'business-context',
  EVALUATION_PARAMETERS_HEADING_INFO: 'evaluation-parameters',
  SPECIFIC_EVALUATION_PARAMETER_INFO: 'parameter-info',
  SAMPLE_TEST_CASES_HEADING_INFO: 'test-cases-heading',
  SPECIFIC_SAMPLE_TEST_CASE_VIEW_DETAILS: 'test-case',
  RESULTS_DATABASE_EVIDENCE_DETAILS: 'evidence-details',
};

export default DRAWER_TYPES;
