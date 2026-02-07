import React from 'react';
import PropTypes from 'prop-types';
import { parameterGuidance } from '@/constants/evaluationData';
import { ClipboardMinus } from 'lucide-react';
import { Modal, Button } from '@heroui/react';

export default function ParameterInfoModal({ onClose, isModalOpen, paramKey }) {
  const guidance = parameterGuidance[paramKey];
  if (!guidance) return null;

  const weightLabel = guidance.weightPercent || `${Math.round((guidance.weight || 0) * 100)}%`;

  return (
    <Modal.Backdrop
      isOpen={isModalOpen}
      onOpenChange={onClose}
      variant="opaque"
      isDismissable={true}
    >
      <Modal.Container placement="center" scroll="inside" size="2xl">
        <Modal.Dialog aria-label="Parameter Information">
          <Modal.Header className="pt-0 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <ClipboardMinus className="size-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Parameter Information</h2>
                <p className="text-sm text-gray-600">Detailed guidance for evaluation parameters</p>
              </div>
            </div>
          </Modal.Header>
          <Modal.Body className="gap-6 px-2">
            <div className="space-y-6">
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
                      <p className="text-gray-600">{guidance.definition}</p>
                    </div>
                  )}
                  {guidance.methodology && (
                    <div>
                      <p className="mb-1 font-bold text-emerald-700">Methodology</p>
                      <p className="text-gray-600">{guidance.methodology}</p>
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
                <div className="p-4 border border-emerald-200 rounded-xl bg-emerald-50">
                  <h4 className="mb-3 text-base font-bold text-emerald-700">Score Guide</h4>
                  <div className="space-y-2">
                    {guidance.scale.map(({ score, label, description }) => (
                      <div key={`${score}-${label}`} className="pl-3 border-l-4 border-emerald-400">
                        <p className="text-sm font-semibold text-emerald-900">
                          {score} - {label}
                        </p>
                        <p className="text-xs text-gray-600">{description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {guidance.examples && (
                <div className="p-4 border border-blue-200 rounded-xl bg-blue-50">
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
                        {reason && <p className="text-xs text-gray-600">{reason}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

ParameterInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
  paramKey: PropTypes.string.isRequired,
};
