import React from 'react';
import PropTypes from 'prop-types';
import { factorDefinitions } from '@/constants/evaluationData';
import { ClipboardMinus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';

export default function EvaluationParametersInfoModal({ onClose, isModalOpen }) {
  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogClose
        className="absolute top-4 right-4"
        aria-label="Close evaluation parameters guide modal"
      >
        <X className="w-5 h-5 text-gray-500 hover:text-gray-700" strokeWidth={2} />
      </DialogClose>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold text-[#2c3e50] flex items-center gap-2">
            <ClipboardMinus /> Evaluation Parameters Guide
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Factors used to evaluate circularity potential
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 overflow-y-auto max-h-[calc(90vh-120px)]">
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
      </DialogContent>
    </Dialog>
  );
}

EvaluationParametersInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
};
