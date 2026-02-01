import React from 'react';
import PropTypes from 'prop-types';
import { parameterGuidance } from '@/constants/evaluationData';
import { ClipboardMinus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';

export default function ParameterInfoModal({ onClose, isModalOpen, paramKey }) {
  const guidance = parameterGuidance[paramKey];
  if (!guidance) return null;

  const weightLabel = guidance.weightPercent || `${Math.round((guidance.weight || 0) * 100)}%`;

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogClose
        className="absolute top-4 right-4"
        aria-label="Close parameter information modal"
      >
        <X className="w-5 h-5 text-gray-500 hover:text-gray-700" strokeWidth={2} />
      </DialogClose>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold text-[#2c3e50] flex items-center gap-2">
            <ClipboardMinus /> Parameter Information
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Detailed guidance for evaluation parameters
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="m-0 text-xl font-bold text-emerald-700">{guidance.name}</h3>
                <p className="m-0 text-md text-slate-600">{guidance.category}</p>
              </div>
              {guidance.weight && (
                <span className="flex items-center justify-center px-4 py-2 text-lg border-2 border-gray-400 rounded-lg bg-emerald-50 text-slate-600">
                  Weight: {weightLabel}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {guidance.definition && (
                <p className="leading-relaxed">
                  <strong>Definition:</strong> {guidance.definition}
                </p>
              )}
              {guidance.methodology && (
                <p className="leading-relaxed">
                  <strong>Methodology:</strong> {guidance.methodology}
                </p>
              )}
              {guidance.calibration && (
                <p className="leading-relaxed">
                  <strong>Calibration:</strong> {guidance.calibration}
                </p>
              )}
            </div>

            {guidance.scale && (
              <div className="p-4 border rounded bg-slate-50 border-slate-200">
                <h4 className="m-0 mb-3 text-lg font-semibold text-slate-800">Score Guide:</h4>
                <ul className="pl-6 m-0 space-y-2 leading-relaxed">
                  {guidance.scale.map(({ score, label, description }) => (
                    <li key={`${score}-${label}`}>
                      <strong>
                        {score} - {label}:
                      </strong>
                      &nbsp;
                      {description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {guidance.examples && (
              <div className="p-4 border rounded bg-emerald-50 border-emerald-200">
                <h4 className="m-0 mb-3 text-lg font-semibold text-emerald-800">Benchmarks:</h4>
                <ul className="pl-6 m-0 space-y-2 leading-relaxed">
                  {guidance.examples.map(({ score, case: exampleCase, reason }, idx) => (
                    <li key={`${exampleCase}-${score}-${idx}`}>
                      <strong>{exampleCase}</strong> - {score}
                      {reason ? ` (${reason})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

ParameterInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
  paramKey: PropTypes.string.isRequired,
};
