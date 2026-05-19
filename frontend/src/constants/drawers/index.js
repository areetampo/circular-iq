/**
 * @module drawers
 * @description Central export point for drawer content constants.
 * Re-exports all drawer-related content including evaluation criteria,
 * business context, parameter guidance, and sample test cases.
 */

// Separated constants files
export { EVALUATION_CRITERIA_CONTENT } from './evaluationCriteriaDrawer';
export { EVALUATION_PARAMETERS_HEADING_CONTENT } from './evaluationParametersHeading';
export { SAMPLE_TEST_CASES_HEADING_CONTENT } from './sampleTestCasesHeading';
export { SPECIFIC_PARAMETER_CONTENT } from './specificEvaluationParameter';
export {
  getContextFieldIcon,
  getContextFieldLabel,
  getContextValueLabel,
  TEST_CASE_DETAIL_CONTENT,
} from './specificSampleTestCase';

// Business context, problem, solution, and methodology content
export { ASSESSMENT_METHODOLOGY_CONTENT } from './assessmentMethodology';
export { BUSINESS_CONTEXT_HEADING_CONTENT } from './businessContextHeading';
export { BUSINESS_PROBLEM_CONTENT } from './businessProblem';
export { BUSINESS_SOLUTION_CONTENT } from './businessSolution';

// Parameter guidance
export { parameterGuidance } from './parameterGuidance';
