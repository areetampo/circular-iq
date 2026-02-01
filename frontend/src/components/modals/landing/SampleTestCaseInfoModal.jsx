import React from 'react';
import PropTypes from 'prop-types';
import { PencilLine, X, Target, Lightbulb, BarChart3 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';

export default function SampleTestCaseInfoModal({ onClose, isModalOpen, testCase }) {
  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogClose className="absolute top-4 right-4" aria-label="Close sample test case modal">
        <X className="w-5 h-5 text-gray-500 hover:text-gray-700" strokeWidth={2} />
      </DialogClose>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold text-[#2c3e50] flex items-center gap-2">
            <PencilLine /> {testCase.title}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Sample test case details and parameters
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-[#34a83a]" strokeWidth={2} />
              <h3 className="m-0 text-lg font-bold text-slate-800">Business Problem</h3>
            </div>
            <div className="p-5 border bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-slate-200">
              <p className="text-sm leading-relaxed text-slate-700">{testCase.problem}</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-[#34a83a]" strokeWidth={2} />
              <h3 className="m-0 text-lg font-bold text-slate-800">Business Solution</h3>
            </div>
            <div className="p-5 border bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-emerald-200">
              <p className="text-sm leading-relaxed text-slate-700">{testCase.solution}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-[#4a90e2]" strokeWidth={2} />
              <h3 className="m-0 text-lg font-bold text-slate-800">Parameter Scores</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {Object.entries(testCase.parameters).map(([key, value]) => {
                const isGood = value >= 75;
                const isMedium = value >= 50;
                return (
                  <div
                    key={key}
                    className={`p-4 rounded-xl transition-all hover:scale-105 ${
                      isGood
                        ? 'bg-gradient-to-br from-emerald-100 to-green-100 border-2 border-emerald-300'
                        : isMedium
                          ? 'bg-gradient-to-br from-yellow-100 to-amber-100 border-2 border-yellow-300'
                          : 'bg-gradient-to-br from-red-100 to-rose-100 border-2 border-red-300'
                    }`}
                  >
                    <div
                      className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                        isGood ? 'text-emerald-700' : isMedium ? 'text-yellow-700' : 'text-red-700'
                      }`}
                    >
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div
                      className={`text-3xl font-bold ${
                        isGood ? 'text-emerald-600' : isMedium ? 'text-yellow-600' : 'text-red-600'
                      }`}
                    >
                      {value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-8 py-3 mb-6 font-semibold text-white transition-all shadow-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl hover:shadow-xl hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

SampleTestCaseInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
  testCase: PropTypes.shape({
    title: PropTypes.string.isRequired,
    problem: PropTypes.string.isRequired,
    solution: PropTypes.string.isRequired,
    parameters: PropTypes.object.isRequired,
  }).isRequired,
};
