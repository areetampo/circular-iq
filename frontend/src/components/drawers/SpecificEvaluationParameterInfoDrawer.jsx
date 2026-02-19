import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/utils/cn';
import { parameterGuidance } from '@/constants/evaluationData';
import { ClipboardMinus, X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';

export default function SpecificEvaluationParameterInfoDrawer({ paramKey }) {
  if (!paramKey) return null;
  const guidance = parameterGuidance[paramKey];
  if (!guidance) return null;

  const weightLabel = guidance.weightPercent || `${Math.round((guidance.weight || 0) * 100)}%`;

  const { isDrawerOpen, onClose } = useGlobalDrawer();
  const direction = useDrawerDirection();

  return (
    <Drawer
      open={isDrawerOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      direction={direction}
    >
      <DrawerContent direction={direction} aria-label="Parameter Information">
        <DrawerHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg bg-emerald-100 shrink-0',
                  'transition-[transform,box-shadow] duration-300 ease-out',
                  isDrawerOpen
                    ? 'scale-[1.12] -rotate-6 drop-shadow-md'
                    : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                )}
              >
                <ClipboardMinus className="size-5 text-emerald-600" strokeWidth={1.75} />
              </div>
              <div>
                <DrawerTitle className="text-lg font-semibold">Parameter Information</DrawerTitle>
                <DrawerDescription className="text-sm text-gray-600">
                  Detailed guidance for evaluation parameters
                </DrawerDescription>
              </div>
            </div>

            {direction === 'right' && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </DrawerHeader>
        <DrawerBody className="gap-6">
          <div className="space-y-6">
            <div className="px-4">
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
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

SpecificEvaluationParameterInfoDrawer.propTypes = {
  paramKey: PropTypes.string.isRequired,
};
