import React from 'react';
import PropTypes from 'prop-types';
import { RESULTS_MODALS } from '@/components/modals/modalTypes';
import ResultsDatabaseEvidenceDetailsModal from './ResultsDatabaseEvidenceDetailsModal';

export default function ResultsModalManager({ modal, isModalOpen, onClose }) {
  if (!modal) return null;

  switch (modal.type) {
    case RESULTS_MODALS.DATABASE_EVIDENCE_DETAILS:
      return (
        <ResultsDatabaseEvidenceDetailsModal
          isModalOpen={isModalOpen}
          onClose={onClose}
          {...modal.data}
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
  onClose: PropTypes.func.isRequired,
};
