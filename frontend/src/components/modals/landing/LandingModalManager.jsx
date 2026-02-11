import React from 'react';
import PropTypes from 'prop-types';
import { LANDING_MODALS } from '@/components/modals/modalTypes';
import {
  AssessmentMethodologyModal,
  EvaluationCriteriaModal,
  BusinessProblemInfoModal,
  BusinessSolutionInfoModal,
  EvaluationParametersInfoModal,
  ParameterInfoModal,
  SampleTestCasesHeadingInfoModal,
  SampleTestCaseInfoModal,
} from '@/components/modals/landing';

export default function LandingModalManager({ modal, isModalOpen, onClose }) {
  if (!modal) return null;

  switch (modal.type) {
    case LANDING_MODALS.ASSESSMENT_METHODOLOGY:
      return <AssessmentMethodologyModal isModalOpen={isModalOpen} onClose={onClose} />;

    case LANDING_MODALS.EVALUATION_CRITERIA:
      return <EvaluationCriteriaModal isModalOpen={isModalOpen} onClose={onClose} />;

    case LANDING_MODALS.BUSINESS_PROBLEM_INFO:
      return <BusinessProblemInfoModal isModalOpen={isModalOpen} onClose={onClose} />;

    case LANDING_MODALS.BUSINESS_SOLUTION_INFO:
      return <BusinessSolutionInfoModal isModalOpen={isModalOpen} onClose={onClose} />;

    case LANDING_MODALS.EVALUATION_PARAMETERS_INFO:
      return <EvaluationParametersInfoModal isModalOpen={isModalOpen} onClose={onClose} />;

    case LANDING_MODALS.PARAMETER_INFO:
      return (
        <ParameterInfoModal
          isModalOpen={isModalOpen}
          onClose={onClose}
          paramKey={modal.data.paramKey}
        />
      );

    case LANDING_MODALS.SAMPLE_TEST_CASES_HEADING_INFO:
      return <SampleTestCasesHeadingInfoModal isModalOpen={isModalOpen} onClose={onClose} />;

    case LANDING_MODALS.TEST_CASE_INFO:
      return (
        <SampleTestCaseInfoModal
          isModalOpen={isModalOpen}
          onClose={onClose}
          testCase={modal.data.testCase}
        />
      );

    case LANDING_MODALS.FEATURED_SOLUTIONS:
      return (
        <FeaturedSolutionsModal isModalOpen={isModalOpen} onClose={onClose} data={modal.data} />
      );

    default:
      return null;
  }
}

LandingModalManager.propTypes = {
  modal: PropTypes.shape({
    type: PropTypes.string.isRequired,
    data: PropTypes.any,
  }),
  isModalOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
