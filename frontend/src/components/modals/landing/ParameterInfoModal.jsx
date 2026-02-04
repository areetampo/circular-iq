import React from 'react';
import PropTypes from 'prop-types';
import { parameterGuidance } from '@/constants/evaluationData';
import { ClipboardMinus, X } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';

export default function ParameterInfoModal({ onClose, isModalOpen, paramKey }) {
  const guidance = parameterGuidance[paramKey];
  if (!guidance) return null;

  const weightLabel = guidance.weightPercent || `${Math.round((guidance.weight || 0) * 100)}%`;

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
      <ModalContent className="overflow-y-scroll outline-none focus:outline-none focus-visible:outline-none ring-0">
        <ModalHeader className="flex items-center gap-3 py-5">
          <div className="p-2 rounded-lg bg-emerald-100">
            <ClipboardMinus className="text-emerald-600" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#2c3e50]">Parameter Information</h2>
            <p className="text-xs text-gray-500">Detailed guidance for evaluation parameters</p>
          </div>
          <Button
            isIconOnly
            variant="light"
            onPress={onClose}
            aria-label="Close"
            className="ml-auto transition-colors rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </ModalHeader>
        <ModalBody className="gap-5 px-4 py-6">
          <div className="px-2">
            <div className="flex flex-col items-start justify-between gap-4 mb-5 xs:flex-row">
              <div>
                <h3 className="mb-1 text-lg font-bold text-emerald-700">{guidance.name}</h3>
                <p className="text-sm font-medium text-emerald-600">{guidance.category}</p>
              </div>
              {guidance.weight && (
                <div className="flex items-center justify-center px-3 py-1 text-sm font-bold border-2 rounded-lg border-emerald-300 bg-emerald-100 text-emerald-700 whitespace-nowrap">
                  Weight: {weightLabel}
                </div>
              )}
            </div>

            <div className="space-y-3 text-sm leading-relaxed">
              {guidance.definition && (
                <div>
                  <p className="mb-1 font-bold text-emerald-700">Definition</p>
                  <p className="text-gray-700">{guidance.definition}</p>
                </div>
              )}
              {guidance.methodology && (
                <div>
                  <p className="mb-1 font-bold text-emerald-700">Methodology</p>
                  <p className="text-gray-700">{guidance.methodology}</p>
                </div>
              )}
              {guidance.calibration && (
                <div>
                  <p className="mb-1 font-bold text-emerald-700">Calibration</p>
                  <p className="text-gray-700">{guidance.calibration}</p>
                </div>
              )}
            </div>
          </div>

          {guidance.scale && (
            <div className="p-4 border border-emerald-200 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50">
              <h4 className="mb-3 text-base font-bold text-emerald-700">Score Guide</h4>
              <div className="space-y-2">
                {guidance.scale.map(({ score, label, description }) => (
                  <div key={`${score}-${label}`} className="pl-3 border-l-4 border-emerald-400">
                    <p className="text-sm font-semibold text-emerald-900">
                      {score} - {label}
                    </p>
                    <p className="text-xs text-gray-700">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {guidance.examples && (
            <div className="p-4 border border-blue-200 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
              <h4 className="mb-3 text-base font-bold text-blue-700">Benchmarks</h4>
              <div className="space-y-2">
                {guidance.examples.map(({ score, case: exampleCase, reason }, idx) => (
                  <div
                    key={`${exampleCase}-${score}-${idx}`}
                    className="pl-3 border-l-4 border-blue-400"
                  >
                    <p className="text-sm font-semibold text-blue-900">
                      {exampleCase} {score && `(${score})`}
                    </p>
                    {reason && <p className="text-xs text-gray-700">{reason}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="gap-2 py-2" />
      </ModalContent>
    </Modal>
  );
}

ParameterInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
  paramKey: PropTypes.string.isRequired,
};
