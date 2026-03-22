/**
 * Drawer constants index - exports all drawer content constants
 */

// Evaluation Criteria Drawer (already well-structured)
export { METRICS, VALUE_SECTIONS } from '../../components/drawers/EvaluationCriteriaDrawer';

// Assessment Methodology Drawer (already well-structured)
export { METHODOLOGY_ITEMS } from '../../components/drawers/AssessmentMethodologyDrawer';

// Business Context Heading Info Drawer (already well-structured)
export { CONTEXT_FIELDS } from '../../components/drawers/BusinessContextHeadingInfoDrawer';

// Business Problem Info Drawer (already well-structured)
export {
  PROBLEM_ELEMENTS,
  PROBLEM_EXAMPLE,
  PROBLEM_WRITING_TIPS,
} from '../../components/drawers/BusinessProblemInfoDrawer';

// Business Solution Info Drawer (already well-structured)
export {
  SOLUTION_COMPONENTS,
  SOLUTION_PITFALLS,
} from '../../components/drawers/BusinessSolutionInfoDrawer';

// New separated constants
export { EVALUATION_CRITERIA_CONTENT } from './evaluationCriteriaDrawer';
export { EVALUATION_PARAMETERS_HEADING_CONTENT } from './evaluationParametersHeading';
export { SAMPLE_TEST_CASES_HEADING_CONTENT } from './sampleTestCasesHeading';
export { SPECIFIC_PARAMETER_CONTENT } from './specificEvaluationParameter';
export {
  TEST_CASE_DETAIL_CONTENT,
  getContextFieldIcon,
  getContextFieldLabel,
  getContextValueLabel,
} from './specificSampleTestCase';
