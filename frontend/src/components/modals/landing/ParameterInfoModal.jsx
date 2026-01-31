import React from 'react';
import PropTypes from 'prop-types';
import { parameterGuidance } from '@/constants/evaluationData';
import { ClipboardMinus } from 'lucide-react';
import ModalHeading from '@/components/modals/core/ModalHeading';
import { LANDING_MODALS } from '@/components/modals/core/modalTypes';

export default function ParameterInfoModal({ onClose, isOpen, paramKey }) {
  if (!isOpen) return null;

  const guidance = parameterGuidance[paramKey];
  if (!guidance) return null;

  const weightLabel = guidance.weightPercent || `${Math.round((guidance.weight || 0) * 100)}%`;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] bg-white shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeading
          title="Parameter Information"
          icon={ClipboardMinus}
          onClose={onClose}
          type={LANDING_MODALS.PARAMETER_INFO}
        />

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
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
      </div>
    </div>
  );
}

ParameterInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  paramKey: PropTypes.string.isRequired,
};
