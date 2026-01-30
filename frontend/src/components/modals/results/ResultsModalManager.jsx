import React from 'react';
import PropTypes from 'prop-types';
import { RESULTS_MODALS } from '@/components/modals/core/modalTypes';
import ResultsDatabaseEvidenceDetailsModal from './ResultsDatabaseEvidenceDetailsModal';
import MarketAnalysisModal from './MarketAnalysisModal';

export default function ResultsModalManager({ modal, isModalOpen, closeModal }) {
  if (!modal) return null;

  switch (modal.type) {
    case RESULTS_MODALS.DATABASE_EVIDENCE_DETAILS:
      return (
        <ResultsDatabaseEvidenceDetailsModal
          isModalOpen={isModalOpen}
          onClose={closeModal}
          evidenceId={modal.data.evidenceId}
        />
      );

    case RESULTS_MODALS.MARKET_ANALYSIS:
      return (
        <MarketAnalysisModal
          isModalOpen={isModalOpen}
          onClose={closeModal}
          currentAssessmentScore={modal.data.currentAssessmentScore}
          currentIndustry={modal.data.currentIndustry}
        />
      );

    default:
      return null;
  }
}

ResultsModalManager.propTypes = {
  modal: PropTypes.shape({
    type: PropTypes.string.isRequired,
    data: PropTypes.any,
  }),
  isModalOpen: PropTypes.bool.isRequired,
  closeModal: PropTypes.func.isRequired,
};
