import React from 'react';
import PropTypes from 'prop-types';
import { HEADER_MODALS } from '@/components/modals/core/modalTypes';
import AssessmentMethodologyModal from '@/components/modals/header/AssessmentMethodologyModal';
import EvaluationCriteriaModal from '@/components/modals/header/EvaluationCriteriaModal';

export default function HeaderModalManager({ modal, isModalOpen, onClose }) {
  if (!modal) return null;

  switch (modal.type) {
    case HEADER_MODALS.ASSESSMENT_METHODOLOGY:
      return <AssessmentMethodologyModal isModalOpen={isModalOpen} onClose={onClose} />;

    case HEADER_MODALS.EVALUATION_CRITERIA:
      return <EvaluationCriteriaModal isModalOpen={isModalOpen} onClose={onClose} />;

    default:
      return null;
  }
}

HeaderModalManager.propTypes = {
  modal: PropTypes.shape({
    type: PropTypes.string.isRequired,
  }),
  isModalOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
