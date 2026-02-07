import React from 'react';
import PropTypes from 'prop-types';
import { factorDefinitions } from '@/constants/evaluationData';
import { ClipboardMinus } from 'lucide-react';
import { Modal, Button } from '@heroui/react';

export default function EvaluationParametersInfoModal({ onClose, isModalOpen }) {
  return (
    <Modal.Backdrop
      isOpen={isModalOpen}
      onOpenChange={onClose}
      variant="opaque"
      isDismissable={true}
    >
      <Modal.Container placement="center" scroll="inside" size="3xl">
        <Modal.Dialog aria-label="Evaluation Parameters Guide">
          <Modal.Header className="pt-0 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <ClipboardMinus className="size-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Evaluation Parameters Guide</h2>
                <p className="text-sm text-gray-600">
                  Factors used to evaluate circularity potential
                </p>
              </div>
            </div>
          </Modal.Header>
          <Modal.Body className="gap-6 px-2">
            <div className="space-y-6">
              <p className="leading-relaxed text-gray-600">
                These are the factors we use to evaluate circularity potential. Use the definitions
                to align your self-assessed scores with our scoring model.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(factorDefinitions).map(([key, factor]) => (
                  <div key={key} className="p-4 border border-emerald-200 rounded-xl bg-emerald-50">
                    <h4 className="text-base font-bold text-emerald-700 mb-1">{factor.title}</h4>
                    <p className="text-xs text-emerald-600 font-medium mb-2">
                      Category: {factor.category}
                    </p>
                    <p className="text-sm leading-relaxed text-gray-600">{factor.desc}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs italic text-gray-500 p-3 bg-gray-100 rounded-lg">
                💡 <strong>Stronger detail helps the model</strong> differentiate between nearby
                scores.
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer className="">
            <Button variant="tertiary" onPress={onClose}>
              Close
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

EvaluationParametersInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
};
