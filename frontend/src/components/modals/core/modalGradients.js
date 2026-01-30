import { HEADER_MODALS, LANDING_MODALS, RESULTS_MODALS } from '@/components/modals/modalTypes';

export const MODAL_GRADIENTS = {
  [HEADER_MODALS.ASSESSMENT_METHODOLOGY]: 'from-blue-600 to-indigo-700',
  [HEADER_MODALS.EVALUATION_CRITERIA]: 'from-cyan-500 to-blue-600',

  [LANDING_MODALS.BUSINESS_PROBLEM_INFO]: 'from-rose-500 to-pink-600',
  [LANDING_MODALS.BUSINESS_SOLUTION_INFO]: 'from-amber-500 to-orange-600',
  [LANDING_MODALS.EVALUATION_PARAMETERS_INFO]: 'from-indigo-500 to-purple-600',
  [LANDING_MODALS.PARAMETER_INFO]: 'from-violet-500 to-purple-600',
  [LANDING_MODALS.SAMPLE_TEST_CASES_HEADING_INFO]: 'from-sky-500 to-blue-600',
  [LANDING_MODALS.TEST_CASE_INFO]: 'from-blue-500 to-indigo-600',

  [RESULTS_MODALS.DATABASE_EVIDENCE_DETAILS]: 'from-emerald-500 to-teal-600',
  [RESULTS_MODALS.MARKET_ANALYSIS]: 'from-teal-500 to-emerald-600',

  default: 'from-emerald-500 to-teal-600',
};
