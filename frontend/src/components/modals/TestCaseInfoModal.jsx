import React from 'react';
import PropTypes from 'prop-types';

export default function TestCaseInfoModal({ isOpen, onClose, testCase }) {
  if (!isOpen) return null;

  // specific test case preview modal
  if (testCase) {
    return (
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-5 animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-500 to-teal-600">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20">
                <span className="text-2xl">🧪</span>
              </div>
              <h2 className="m-0 mt-1 text-xl font-bold text-white">{testCase.title}</h2>
            </div>
            <button
              className="flex items-center justify-center p-2 pt-2.5 text-white transition-all border-none rounded-lg cursor-pointer bg-white/20 hover:bg-white/30 w-9 h-9"
              onClick={onClose}
            >
              <span className="mb-1 text-3xl font-extrabold leading-none">×</span>
            </button>
          </div>
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
                          isGood
                            ? 'text-emerald-700'
                            : isMedium
                              ? 'text-yellow-700'
                              : 'text-red-700'
                        }`}
                      >
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div
                        className={`text-3xl font-bold ${
                          isGood
                            ? 'text-emerald-600'
                            : isMedium
                              ? 'text-yellow-600'
                              : 'text-red-600'
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

  // General test cases info modal
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-gradient-to-r from-blue-500 to-indigo-600">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20">
              <span className="text-2xl">📚</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Test Cases Guide</h2>
          </div>
          <button
            className="flex items-center justify-center p-2 text-white transition-all border-none rounded-lg cursor-pointer bg-white/20 hover:bg-white/30 w-9 h-9"
            onClick={onClose}
          >
            <span className="mb-[1px] text-3xl font-extrabold leading-none">×</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          <p className="mb-4 leading-relaxed">
            <strong>Test Cases</strong> are pre-filled form submissions representing real circular
            economy business models. They help you:
          </p>
          <ul className="mb-6 ml-5">
            <li className="mb-2">See what good problem/solution descriptions look like</li>
            <li className="mb-2">Understand parameter scoring in real-world contexts</li>
            <li className="mb-2">Quickly test the evaluation framework</li>
          </ul>

          <h3 className="mb-3 text-base font-bold text-slate-800">How They Work:</h3>
          <ol className="mb-6 ml-5">
            <li className="mb-2">
              <strong>Select:</strong> Pick any test case from the dropdown
            </li>
            <li className="mb-2">
              <strong>Auto-fill:</strong> Your form populates automatically
            </li>
            <li className="mb-2">
              <strong>Submit:</strong> Click &ldquo;Get Evaluation&rdquo; to see scores
            </li>
            <li className="mb-2">
              <strong>Learn:</strong> Review the evaluation against known results
            </li>
          </ol>

          <div className="p-4 border border-blue-300 rounded bg-blue-50">
            <p className="m-0 text-sm text-blue-900">
              <strong>💡 Tip:</strong> Test cases are great for learning how the evaluation system
              works before submitting your own idea.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

TestCaseInfoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  testCase: PropTypes.object,
};
