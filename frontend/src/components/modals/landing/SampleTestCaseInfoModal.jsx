import React from 'react';
import PropTypes from 'prop-types';
import { PencilLine } from 'lucide-react';
import ModalHeading from '@/components/modals/core/ModalHeading';
import { LANDING_MODALS } from '@/components/modals/core/modalTypes';

export default function SampleTestCaseInfoModal({ onClose, isOpen, testCase }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeading
          title={testCase.title}
          icon={PencilLine}
          onClose={onClose}
          type={LANDING_MODALS.TEST_CASE_INFO}
        />
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎯</span>
              <h3 className="m-0 text-lg font-bold text-slate-800">Business Problem</h3>
            </div>
            <div className="p-5 border bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-slate-200">
              <p className="text-sm leading-relaxed text-slate-700">{testCase.problem}</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💡</span>
              <h3 className="m-0 text-lg font-bold text-slate-800">Business Solution</h3>
            </div>
            <div className="p-5 border bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-emerald-200">
              <p className="text-sm leading-relaxed text-slate-700">{testCase.solution}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📊</span>
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
      </div>
    </div>
  );
}

SampleTestCaseInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  testCase: PropTypes.shape({
    title: PropTypes.string.isRequired,
    problem: PropTypes.string.isRequired,
    solution: PropTypes.string.isRequired,
    parameters: PropTypes.object.isRequired,
  }).isRequired,
};
