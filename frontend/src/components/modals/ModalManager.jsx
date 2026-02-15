import React from 'react';
import PropTypes from 'prop-types';
import MODALS from '@/components/modals/modalTypes';
import {
  AssessmentMethodologyModal,
  EvaluationCriteriaModal,
  BusinessProblemInfoModal,
  BusinessSolutionInfoModal,
  EvaluationParametersHeadingInfoModal,
  SpecificEvaluationParameterInfoModal,
  SampleTestCasesHeadingInfoModal,
  SpecificSampleTestCaseViewDetailsModal,
  ResultsDatabaseEvidenceDetailsModal,
  DashboardFeaturedSolutionsModal,
} from '@/components/modals';

export default function ModalManager({ modal, isModalOpen, onClose }) {
  if (!modal || !modal.type) return null;

  const { type, data } = modal;

  console.log('ModalManager rendering:', { type, data });

  switch (type) {
    case MODALS.ASSESSMENT_METHODOLOGY:
      return <AssessmentMethodologyModal isModalOpen={isModalOpen} onClose={onClose} />;

    case MODALS.EVALUATION_CRITERIA:
      return <EvaluationCriteriaModal isModalOpen={isModalOpen} onClose={onClose} />;

    case MODALS.BUSINESS_PROBLEM_INFO:
      return <BusinessProblemInfoModal isModalOpen={isModalOpen} onClose={onClose} />;

    case MODALS.BUSINESS_SOLUTION_INFO:
      return <BusinessSolutionInfoModal isModalOpen={isModalOpen} onClose={onClose} />;

    case MODALS.EVALUATION_PARAMETERS_HEADING_INFO:
      return <EvaluationParametersHeadingInfoModal isModalOpen={isModalOpen} onClose={onClose} />;

    case MODALS.SPECIFIC_EVALUATION_PARAMETER_INFO:
      console.log('Rendering SpecificEvaluationParameterInfoModal with data:', data);
      return (
        <SpecificEvaluationParameterInfoModal
          isModalOpen={isModalOpen}
          onClose={onClose}
          paramKey={data?.paramKey}
        />
      );

    case MODALS.SAMPLE_TEST_CASES_HEADING_INFO:
      return <SampleTestCasesHeadingInfoModal isModalOpen={isModalOpen} onClose={onClose} />;

    case MODALS.SPECIFIC_SAMPLE_TEST_CASE_VIEW_DETAILS: {
      return (
        <SpecificSampleTestCaseViewDetailsModal
          isModalOpen={isModalOpen}
          onClose={onClose}
          testCase={data?.testCase}
        />
      );
    }

    case MODALS.RESULTS_DATABASE_EVIDENCE_DETAILS:
      return (
        <ResultsDatabaseEvidenceDetailsModal
          isModalOpen={isModalOpen}
          onClose={onClose}
          data={data || {}}
        />
      );

    case MODALS.DASHBOARD_FEATURED_SOLUTIONS:
      return (
        <DashboardFeaturedSolutionsModal
          isModalOpen={isModalOpen}
          onClose={onClose}
          data={data || {}}
        />
      );

    default:
      console.warn('Unknown modal type:', type);
      return null;
  }
}

ModalManager.propTypes = {
  modal: PropTypes.shape({
    type: PropTypes.string.isRequired,
    data: PropTypes.any,
  }),
  isModalOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
