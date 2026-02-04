import React from 'react';
import PropTypes from 'prop-types';
import { factorDefinitions } from '@/constants/evaluationData';
import { ClipboardMinus, X } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';

export default function EvaluationParametersInfoModal({ onClose, isModalOpen }) {
  return (
    <Modal
      isOpen={isModalOpen}
      onOpenChange={onClose}
      size="2xl"
      scrollBehavior="inside"
      backdrop="opaque"
      placement="center"
      hideCloseButton={true}
      classNames={{
        backdrop: 'bg-black/50',
        base: 'bg-white rounded-2xl shadow-xl',
      }}
    >
      <ModalContent className="outline-none focus:outline-none focus-visible:outline-none ring-0">
        <ModalHeader className="flex items-center gap-3 py-5">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <ClipboardMinus className="text-emerald-600" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#2c3e50]">Evaluation Parameters Guide</h2>
            <p className="text-gray-500 text-xs">Factors used to evaluate circularity potential</p>
          </div>
          <Button
            isIconOnly
            variant="light"
            onPress={onClose}
            aria-label="Close"
            className="ml-auto hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
        </ModalHeader>
        <ModalBody className="gap-5 py-6 px-6">
          <p className="leading-relaxed text-gray-700">
            These are the factors we use to evaluate circularity potential. Use the definitions to
            align your self-assessed scores with our scoring model.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(factorDefinitions).map(([key, factor]) => (
              <div
                key={key}
                className="p-4 border border-emerald-200 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50"
              >
                <h4 className="text-base font-bold text-emerald-700 mb-1">{factor.title}</h4>
                <p className="text-xs text-emerald-600 font-medium mb-2">
                  Category: {factor.category}
                </p>
                <p className="text-sm leading-relaxed text-gray-700">{factor.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-xs italic text-gray-500 p-3 bg-gray-100 rounded-lg">
            💡 <strong>Stronger detail helps the model</strong> differentiate between nearby scores.
          </p>
        </ModalBody>
        <ModalFooter className="border-t border-emerald-100 gap-2 py-2" />
      </ModalContent>
    </Modal>
  );
}

EvaluationParametersInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
};
