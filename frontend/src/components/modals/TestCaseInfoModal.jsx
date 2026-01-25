import React from 'react';
import PropTypes from 'prop-types';

export default function TestCaseInfoModal({ isOpen, onClose, testCase }) {
  if (!isOpen) return null;

  // Test case preview modal
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
          <div className="flex justify-between items-center p-6 bg-gradient-to-r from-emerald-500 to-teal-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🧪</span>
              </div>
              <h2 className="m-0 text-white text-xl font-bold">{testCase.title}</h2>
            </div>
            <button
              className="bg-white/20 hover:bg-white/30 border-none text-white p-2 w-9 h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer"
              onClick={onClose}
            >
              <span className="text-2xl leading-none">×</span>
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🎯</span>
                <h3 className="text-lg text-slate-800 font-bold m-0">Business Problem</h3>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl border border-slate-200">
                <p className="text-sm text-slate-700 leading-relaxed">{testCase.problem}</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">💡</span>
                <h3 className="text-lg text-slate-800 font-bold m-0">Business Solution</h3>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-200">
                <p className="text-sm text-slate-700 leading-relaxed">{testCase.solution}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📊</span>
                <h3 className="text-lg text-slate-800 font-bold m-0">Parameter Scores</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
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
        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-500 to-indigo-600 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <h2 className="m-0 text-white text-2xl font-bold">Test Cases Guide</h2>
          </div>
          <button
            className="bg-white/20 hover:bg-white/30 border-none text-white p-2 w-9 h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer"
            onClick={onClose}
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          <p className="mb-4 leading-relaxed">
            <strong>Test Cases</strong> are pre-filled form submissions representing real circular
            economy business models. They help you:
          </p>
          <ul className="ml-5 mb-6">
            <li className="mb-2">See what good problem/solution descriptions look like</li>
            <li className="mb-2">Understand parameter scoring in real-world contexts</li>
            <li className="mb-2">Quickly test the evaluation framework</li>
          </ul>

          <h3 className="text-base text-slate-800 font-bold mb-3">How They Work:</h3>
          <ol className="ml-5 mb-6">
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

          <div className="bg-blue-50 p-4 rounded border border-blue-300">
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
