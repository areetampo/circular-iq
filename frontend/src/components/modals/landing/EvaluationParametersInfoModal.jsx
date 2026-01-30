import React from 'react';
import PropTypes from 'prop-types';
import { factorDefinitions } from '@/constants/evaluationData';
import { ClipboardMinus } from 'lucide-react';
import ModalHeading from '../core/ModalHeading';
import { LANDING_MODALS } from '../core/modalTypes';

export default function EvaluationParametersInfoModal({ onClose, isModalOpen }) {
  if (!isModalOpen) return null;

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
          title="Evaluation Parameters Guide"
          onClose={onClose}
          icon={<ClipboardMinus />}
          type={LANDING_MODALS.EVALUATION_PARAMETERS_INFO}
        />

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-5">
            <p className="leading-relaxed">
              These are the factors we use to evaluate circularity potential. Use the definitions to
              align your self-assessed scores with our scoring model.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(factorDefinitions).map(([key, factor]) => (
                <div key={key} className="p-4 border rounded-lg bg-slate-50 border-slate-200">
                  <h4 className="m-0 text-lg font-semibold text-emerald-700">{factor.title}</h4>
                  <p className="m-0 text-sm text-slate-500">Category: {factor.category}</p>
                  <p className="mt-2 leading-relaxed text-slate-700">{factor.desc}</p>
                </div>
              ))}
            </div>

            <p className="text-sm italic text-gray-500">
              Stronger detail helps the model differentiate between nearby scores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

EvaluationParametersInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
};
