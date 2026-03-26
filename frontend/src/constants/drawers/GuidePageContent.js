/**
 * Centralized content for GuidePage and related drawers
 * This file consolidates all shared textual content to eliminate duplication
 * and make maintenance easier across GuidePage and drawer components.
 */

import {
  ASSESSMENT_METHODOLOGY_CONTENT,
  BUSINESS_CONTEXT_HEADING_CONTENT,
  BUSINESS_PROBLEM_CONTENT,
  BUSINESS_SOLUTION_CONTENT,
  EVALUATION_CRITERIA_CONTENT,
  EVALUATION_PARAMETERS_HEADING_CONTENT,
  SAMPLE_TEST_CASES_HEADING_CONTENT,
  SPECIFIC_PARAMETER_CONTENT,
} from './index';
import { parameterGuidance } from './parameterGuidance';

// Assessment Methodology Content (shared with AssessmentMethodology drawer)
export const ASSESSMENT_METHODOLOGY = {
  ...ASSESSMENT_METHODOLOGY_CONTENT,
  // Transform drawer format to GuidePage format
  items: ASSESSMENT_METHODOLOGY_CONTENT.items.map((item) => ({
    icon: item.icon, // Keep the icon component reference
    title: item.title,
    description: item.description,
    borderColor:
      item.accentBorder === 'border-blue-400'
        ? 'var(--info)'
        : item.accentBorder === 'border-emerald-400'
          ? 'var(--success)'
          : item.accentBorder === 'border-orange-400'
            ? 'var(--warning)'
            : item.accentBorder === 'border-purple-400'
              ? 'var(--accent)'
              : 'var(--border)',
    bgColor:
      item.gradientFrom === 'from-blue-50'
        ? 'var(--info-soft)'
        : item.gradientFrom === 'from-emerald-50'
          ? 'var(--success-soft)'
          : item.gradientFrom === 'from-orange-50'
            ? 'var(--warning-soft)'
            : item.gradientFrom === 'from-purple-50'
              ? 'var(--accent-soft)'
              : 'var(--surface)',
  })),
};

// Business Problem Content (shared with BusinessProblem drawer)
export const BUSINESS_PROBLEM = {
  elements: BUSINESS_PROBLEM_CONTENT.elements,
  writingTips: BUSINESS_PROBLEM_CONTENT.writingTips,
  example: BUSINESS_PROBLEM_CONTENT.example,
};

// Business Solution Content (shared with BusinessSolution drawer)
export const BUSINESS_SOLUTION = {
  components: BUSINESS_SOLUTION_CONTENT?.components || [],
  pitfalls: BUSINESS_SOLUTION_CONTENT?.pitfalls || [],
  example: BUSINESS_SOLUTION_CONTENT?.example || '',
};

// Evaluation Criteria Content (shared with EvaluationCriteria drawer)
export const EVALUATION_CRITERIA = {
  ...EVALUATION_CRITERIA_CONTENT,
  // Transform color names to CSS variables for GuidePage
  valueSections: EVALUATION_CRITERIA_CONTENT.valueSections.map((section) => ({
    ...section,
    color:
      section.color === 'blue'
        ? 'var(--info)'
        : section.color === 'emerald'
          ? 'var(--success)'
          : section.color === 'teal'
            ? 'var(--accent)'
            : 'var(--foreground)',
    borderColor:
      section.borderColor === 'border-blue-500'
        ? 'var(--info)'
        : section.borderColor === 'border-emerald-600'
          ? 'var(--success)'
          : section.borderColor === 'border-teal-600'
            ? 'var(--accent)'
            : 'var(--border)',
  })),
  metrics: EVALUATION_CRITERIA_CONTENT.metrics.map((metric) => ({
    ...metric,
    color:
      metric.color === 'blue'
        ? 'var(--info)'
        : metric.color === 'emerald'
          ? 'var(--success)'
          : 'var(--foreground)',
  })),
};

// Evaluation Parameters Content (shared with EvaluationParametersHeading drawer)
export const EVALUATION_PARAMETERS = {
  ...EVALUATION_PARAMETERS_HEADING_CONTENT,
  factors: parameterGuidance.factors || [],
  metrics: parameterGuidance.metrics || [],
};

// Sample Test Cases Content (shared with SampleTestCases drawer)
export const SAMPLE_TEST_CASES = {
  ...SAMPLE_TEST_CASES_HEADING_CONTENT,
  // Add any additional GuidePage-specific content here
};

// Business Context Content (shared with BusinessContextHeading drawer)
export const BUSINESS_CONTEXT = {
  ...BUSINESS_CONTEXT_HEADING_CONTENT,
  // Add any additional GuidePage-specific content here
};

// Specific Evaluation Parameters Content (shared with SpecificEvaluationParameter drawer)
export const SPECIFIC_EVALUATION_PARAMETERS = {
  ...SPECIFIC_PARAMETER_CONTENT,
  // Add any additional GuidePage-specific content here
};

// Export all content as a single bundle for easy importing
export const GUIDE_PAGE_CONTENT = {
  assessmentMethodology: ASSESSMENT_METHODOLOGY,
  businessProblem: BUSINESS_PROBLEM,
  businessSolution: BUSINESS_SOLUTION,
  evaluationCriteria: EVALUATION_CRITERIA,
  evaluationParameters: EVALUATION_PARAMETERS,
  sampleTestCases: SAMPLE_TEST_CASES,
  businessContext: BUSINESS_CONTEXT,
  specificEvaluationParameters: SPECIFIC_EVALUATION_PARAMETERS,
};
