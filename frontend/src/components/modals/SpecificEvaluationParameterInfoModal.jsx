import React from 'react';
import PropTypes from 'prop-types';
import { parameterGuidance, parameterLabels } from '@/constants/evaluationData';
import { GROUP_STYLE_CONFIG, DEFAULT_CONFIG } from '@/constants/groupStyleConfig';
import { cn } from '@/utils/cn';
import { Modal } from '@heroui/react';
import { Button } from '@/components/common';
import { useGlobalModal } from '@/contexts/ModalContext';

export default function SpecificEvaluationParameterInfoModal({ paramKey }) {
  if (!paramKey) return null;
  const guidance = parameterGuidance[paramKey];
  if (!guidance) return null;

  // derive parameter group theme
  const groupName =
    (parameterLabels[paramKey] && parameterLabels[paramKey].category) ||
    (guidance.category && guidance.category.split('(')[0].trim());
  const cfg = GROUP_STYLE_CONFIG[groupName] ?? DEFAULT_CONFIG;
  const Icon = cfg.Icon;

  const weightLabel = guidance.weightPercent || `${Math.round((guidance.weight || 0) * 100)}%`;

  const { isModalOpen, onClose } = useGlobalModal();

  return (
    <Modal.Backdrop
      isOpen={isModalOpen}
      onOpenChange={onClose}
      variant="opaque"
      isDismissable={true}
    >
      <Modal.Container placement="center" scroll="inside" size="2xl">
        <Modal.Dialog
          aria-label="Parameter Information"
          aria-labelledby="parameter-info-modal-title"
        >
          <Modal.Header className="pt-0 pb-3">
            <div className="flex items-center gap-3">
              <Icon
                className={cn(
                  'h-6 w-6 shrink-0 transition-[transform,box-shadow] duration-300 ease-out',
                  cfg.iconColor,
                )}
              />
              <div>
                <h2 id="parameter-info-modal-title" className="text-lg font-semibold">
                  Parameter Information
                </h2>
                <p className="text-sm text-gray-600">Detailed guidance for evaluation parameters</p>
              </div>
            </div>
          </Modal.Header>
          <Modal.Body className="gap-6 px-2">
            <div className="space-y-6">
              <div className="px-2">
                <div className="flex flex-col items-start justify-between gap-4 mb-5 xs:flex-row">
                  <div>
                    <h3 className={cn('mb-1 text-lg font-bold', cfg.paramTextColor)}>
                      {guidance.name}
                    </h3>
                    <p className="text-sm font-medium text-slate-500">{guidance.category}</p>
                  </div>
                  {guidance.weight && (
                    <div
                      className={cn(
                        'flex items-center justify-center px-3 py-1 text-sm font-bold border-2 rounded-lg whitespace-nowrap',
                        cfg.badgeBorder,
                        cfg.badgeBg,
                        cfg.badgeText,
                      )}
                    >
                      Weight: {weightLabel}
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-sm leading-relaxed">
                  {guidance.definition && (
                    <div>
                      <p className={cn('mb-1 font-bold', cfg.paramTextColor)}>Definition</p>
                      <p className="text-gray-600">{guidance.definition}</p>
                    </div>
                  )}
                  {guidance.methodology && (
                    <div>
                      <p className={cn('mb-1 font-bold', cfg.paramTextColor)}>Methodology</p>
                      <p className="text-gray-600">{guidance.methodology}</p>
                    </div>
                  )}
                  {guidance.calibration && (
                    <div>
                      <p className={cn('mb-1 font-bold', cfg.paramTextColor)}>Calibration</p>
                      <p className="text-gray-700">{guidance.calibration}</p>
                    </div>
                  )}
                </div>
              </div>

              {guidance.scale && (
                <div className={cn('p-4 rounded-xl', cfg.panelBg, 'border', cfg.panelBorder)}>
                  <h4 className={cn('mb-3 text-base font-bold', cfg.panelTitle)}>Score Guide</h4>
                  <div className="space-y-2">
                    {guidance.scale.map(({ score, label, description }) => (
                      <div
                        key={`${score}-${label}`}
                        className={cn('pl-3 border-l-4', cfg.panelItemBorder)}
                      >
                        <p className={cn('text-sm font-semibold', cfg.paramTextColor)}>
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

SpecificEvaluationParameterInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
  paramKey: PropTypes.string.isRequired,
};
