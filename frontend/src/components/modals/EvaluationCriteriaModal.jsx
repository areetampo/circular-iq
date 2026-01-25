export default function EvaluationCriteriaModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="m-0 text-emerald-600">Evaluation Criteria</h2>
          <button
            className="bg-none border-none text-2xl cursor-pointer text-gray-400 p-0 w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 hover:text-gray-700"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <p className="text-gray-600 mb-6 leading-relaxed">
            Our AI-powered evaluation framework assesses business ideas across three core value
            dimensions, each comprising specific factors.
          </p>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-500">3</div>
              <div className="text-sm text-gray-600">Core Value Types</div>
            </div>
            <div className="bg-emerald-50 p-6 rounded-lg text-center">
              <div className="text-3xl font-bold text-emerald-600">8</div>
              <div className="text-sm text-gray-600">Evaluation Factors</div>
            </div>
            <div className="bg-emerald-50 p-6 rounded-lg text-center">
              <div className="text-3xl font-bold text-emerald-600">100</div>
              <div className="text-sm text-gray-600">Maximum Score</div>
            </div>
          </div>

          {/* Access Value Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">🔗</div>
              <div>
                <h3 className="m-0 text-blue-500">Access Value</h3>
                <p className="m-0 text-sm text-gray-600">
                  Evaluates accessibility and participation aspects
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="m-0 mb-2 text-slate-800">Public Participation</h4>
                <p className="m-0 text-sm text-gray-700">
                  Measures how easily stakeholders, communities, and end-users can engage with and
                  contribute to the circular system.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="m-0 mb-2 text-slate-800">Infrastructure & Accessibility</h4>
                <p className="m-0 text-sm text-gray-700">
                  Assesses the availability of necessary infrastructure and ease of access to
                  circular economy resources and processes.
                </p>
              </div>
            </div>
          </div>

          {/* Embedded Value Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">💰</div>
              <div>
                <h3 className="m-0 text-emerald-600">Embedded Value</h3>
                <p className="m-0 text-sm text-gray-600">
                  Evaluates inherent and economic value of resources
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-emerald-600">
                <h4 className="m-0 mb-2 text-slate-800">Market Price</h4>
                <p className="m-0 text-sm text-gray-700">
                  Evaluates the economic value and market demand for recovered or repurposed
                  materials.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-emerald-600">
                <h4 className="m-0 mb-2 text-slate-800">Maintenance</h4>
                <p className="m-0 text-sm text-gray-700">
                  Assesses the ease and cost of maintaining products, materials, or systems
                  throughout their lifecycle.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-emerald-600">
                <h4 className="m-0 mb-2 text-slate-800">Uniqueness</h4>
                <p className="m-0 text-sm text-gray-700">
                  Measures the rarity, specialty, or distinctive value of materials and their
                  potential for reuse.
                </p>
              </div>
            </div>
          </div>

          {/* Processing Value Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">⚙️</div>
              <div>
                <h3 className="m-0 text-teal-600">Processing Value</h3>
                <p className="m-0 text-sm text-gray-600">
                  Evaluates technical and operational factors
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-teal-600">
                <h4 className="m-0 mb-2 text-slate-800">Size</h4>
                <p className="m-0 text-sm text-gray-700">
                  Considers the physical dimensions and volume, affecting handling, storage, and
                  transportation efficiency.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-teal-600">
                <h4 className="m-0 mb-2 text-slate-800">Chemical Toxicity</h4>
                <p className="m-0 text-sm text-gray-700">
                  Assesses potential environmental and health hazards, impacting safe processing and
                  disposal methods.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-teal-600">
                <h4 className="m-0 mb-2 text-slate-800">Technology Needed</h4>
                <p className="m-0 text-sm text-gray-700">
                  Evaluates the complexity and availability of technology required for effective
                  processing and recovery.
                </p>
              </div>
            </div>
          </div>

          {/* How We Calculate Section */}
          <div className="bg-slate-100 p-6 rounded-lg">
            <h3 className="m-0 mb-4 text-slate-800">How We Calculate Your Score</h3>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 items-start">
                <div className="bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h4 className="m-0 mb-1 text-slate-800">AI Analysis</h4>
                  <p className="m-0 text-sm text-gray-700">
                    Our machine learning model analyzes your business description against each of
                    the 8 factors
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h4 className="m-0 mb-1 text-slate-800">Weighted Scoring</h4>
                  <p className="m-0 text-sm text-gray-700">
                    Each value type contributes proportionally to the overall circularity score
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h4 className="m-0 mb-1 text-slate-800">Comprehensive Report</h4>
                  <p className="m-0 text-sm text-gray-700">
                    Receive detailed insights, strengths, and actionable recommendations for
                    improvement
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
