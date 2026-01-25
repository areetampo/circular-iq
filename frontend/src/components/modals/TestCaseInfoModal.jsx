import React from 'react';
import PropTypes from 'prop-types';

export default function TestCaseInfoModal({ onClose, testCase }) {
  // If testCase is provided, show individual test case details
  if (testCase) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg max-w-2xl w-full overflow-hidden shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="m-0">{testCase.title}</h2>
            <button
              className="bg-none border-none text-2xl cursor-pointer text-gray-400 p-0 w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 hover:text-gray-700"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-base text-slate-800 mb-3">Business Problem</h3>
              <p className="bg-gray-50 p-4 rounded leading-relaxed text-sm text-gray-700">
                {testCase.problem}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-base text-slate-800 mb-3">Business Solution</h3>
              <p className="bg-gray-50 p-4 rounded leading-relaxed text-sm text-gray-700">
                {testCase.solution}
              </p>
            </div>

            <div>
              <h3 className="text-base text-slate-800 mb-3">Parameter Scores</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(testCase.parameters).map(([key, value]) => {
                  const isGood = value >= 75;
                  const isMedium = value >= 50;
                  return (
                    <div
                      key={key}
                      className={`p-3 rounded border ${
                        isGood
                          ? 'bg-green-100 border-green-300'
                          : isMedium
                            ? 'bg-yellow-100 border-yellow-300'
                            : 'bg-red-100 border-red-300'
                      }`}
                    >
                      <div
                        className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                          isGood ? 'text-green-900' : isMedium ? 'text-yellow-900' : 'text-red-900'
                        }`}
                      >
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          isGood ? 'text-green-900' : isMedium ? 'text-yellow-900' : 'text-red-900'
                        }`}
                      >
                        {value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex justify-end p-4 border-t border-gray-200">
            <button
              className="px-4 py-2 bg-emerald-600 text-white rounded cursor-pointer hover:bg-emerald-700 font-semibold text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // General test cases info modal
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="m-0">Test Cases Guide</h2>
          <button
            className="bg-none border-none text-2xl cursor-pointer text-gray-400 p-0 w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 hover:text-gray-700"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          <p className="mb-4 leading-relaxed">
            <strong>Test Cases</strong> are pre-filled form submissions representing real circular
            economy business models. They help you:
          </p>
          <ul className="ml-5 mb-6">
            <li className="mb-2">See what good problem/solution descriptions look like</li>
            <li className="mb-2">Understand parameter scoring in real-world contexts</li>
            <li className="mb-2">Quickly test the evaluation framework</li>
          </ul>

          <h3 className="text-base text-slate-800 mb-3">How They Work:</h3>
          <ol className="ml-5 mb-6">
            <li className="mb-2">
              <strong>Select:</strong> Pick any test case from the dropdown
            </li>
            <li className="mb-2">
              <strong>Auto-fill:</strong> Your form populates automatically
            </li>
            <li className="mb-2">
              <strong>Submit:</strong> Click "Get Evaluation" to see scores
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
  onClose: PropTypes.func.isRequired,
  testCase: PropTypes.object,
};
