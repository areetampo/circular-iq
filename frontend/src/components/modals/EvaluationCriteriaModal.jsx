import React from 'react';
import PropTypes from 'prop-types';

const METRICS = [
  { number: 3, label: 'Core Value Types', color: 'blue' },
  { number: 8, label: 'Evaluation Factors', color: 'emerald' },
  { number: 100, label: 'Maximum Score', color: 'emerald' },
];

const VALUE_SECTIONS = [
  {
    title: 'Access Value',
    icon: '🔗',
    color: 'blue',
    description: 'Evaluates accessibility and participation aspects',
    factors: [
      {
        title: 'Public Participation',
        description:
          'Measures how easily stakeholders, communities, and end-users can engage with and contribute to the circular system.',
      },
      {
        title: 'Infrastructure & Accessibility',
        description:
          'Assesses the availability of necessary infrastructure and ease of access to circular economy resources and processes.',
      },
    ],
    gridCols: 'md:grid-cols-2',
    borderColor: 'border-blue-500',
  },
  {
    title: 'Embedded Value',
    icon: '💰',
    color: 'emerald',
    description: 'Evaluates inherent and economic value of resources',
    factors: [
      {
        title: 'Market Price',
        description:
          'Evaluates the economic value and market demand for recovered or repurposed materials.',
      },
      {
        title: 'Maintenance',
        description:
          'Assesses the ease and cost of maintaining products, materials, or systems throughout their lifecycle.',
      },
      {
        title: 'Uniqueness',
        description:
          'Measures the rarity, specialty, or distinctive value of materials and their potential for reuse.',
      },
    ],
    gridCols: 'md:grid-cols-3',
    borderColor: 'border-emerald-600',
  },
  {
    title: 'Processing Value',
    icon: '⚙️',
    color: 'teal',
    description: 'Evaluates technical and operational factors',
    factors: [
      {
        title: 'Size',
        description:
          'Considers the physical dimensions and volume, affecting handling, storage, and transportation efficiency.',
      },
      {
        title: 'Chemical Toxicity',
        description:
          'Assesses potential environmental and health hazards, impacting safe processing and disposal methods.',
      },
      {
        title: 'Technology Needed',
        description:
          'Evaluates the complexity and availability of technology required for effective processing and recovery.',
      },
    ],
    gridCols: 'md:grid-cols-3',
    borderColor: 'border-teal-600',
  },
];

const CALCULATION_STEPS = [
  {
    number: 1,
    title: 'AI Analysis',
    description:
      'Our machine learning model analyzes your business description against each of the 8 factors',
  },
  {
    number: 2,
    title: 'Weighted Scoring',
    description: 'Each value type contributes proportionally to the overall circularity score',
  },
  {
    number: 3,
    title: 'Comprehensive Report',
    description:
      'Receive detailed insights, strengths, and actionable recommendations for improvement',
  },
];

export default function EvaluationCriteriaModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-gradient-to-r from-emerald-500 to-teal-600">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20">
              <span className="text-2xl">📋</span>
            </div>
            <h2 className="m-0 text-2xl font-bold text-white">Evaluation Criteria</h2>
          </div>
          <button
            className="flex items-center justify-center p-2 text-white transition-all border-none rounded-lg cursor-pointer bg-white/20 hover:bg-white/30 w-9 h-9"
            onClick={onClose}
          >
            <span className="mb-1 text-3xl font-extrabold leading-none">×</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          <p className="mb-6 leading-relaxed text-gray-600">
            Our AI-powered evaluation framework assesses business ideas across three core value
            dimensions, each comprising specific factors.
          </p>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 md:grid-cols-3">
            {METRICS.map((metric, idx) => (
              <div key={idx} className={`p-6 text-center rounded-lg bg-${metric.color}-50`}>
                <div
                  className={`text-3xl font-bold text-${metric.color}-${metric.color === 'blue' ? '500' : '600'}`}
                >
                  {metric.number}
                </div>
                <div className="text-sm text-gray-600">{metric.label}</div>
              </div>
            ))}
          </div>

          {/* Value Sections */}
          {VALUE_SECTIONS.map((section, idx) => (
            <div key={idx} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-2xl">{section.icon}</div>
                <div>
                  <h3
                    className={`m-0 text-xl font-bold text-${section.color}-${section.color === 'blue' ? '500' : '600'}`}
                  >
                    {section.title}
                  </h3>
                  <p className="m-0 text-sm text-gray-600">{section.description}</p>
                </div>
              </div>
              <div className={`grid grid-cols-1 gap-4 ${section.gridCols}`}>
                {section.factors.map((factor, factorIdx) => (
                  <div
                    key={factorIdx}
                    className={`p-4 border-l-4 ${section.borderColor} rounded-lg bg-gray-50`}
                  >
                    <h4 className="m-0 mb-2 font-bold text-slate-800">{factor.title}</h4>
                    <p className="m-0 text-sm text-gray-700">{factor.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* How We Calculate Section */}
          <div className="p-6 rounded-lg bg-slate-100">
            <h3 className="m-0 mb-4 text-xl font-bold text-slate-800">
              How We Calculate Your Score
            </h3>
            <div className="flex flex-col gap-4">
              {CALCULATION_STEPS.map((step) => (
                <div key={step.number} className="flex items-start gap-4">
                  <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 font-bold text-white rounded-full bg-emerald-600">
                    {step.number}
                  </div>
                  <div>
                    <h4 className="m-0 mb-1 font-bold text-slate-800">{step.title}</h4>
                    <p className="m-0 text-sm text-gray-700">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

EvaluationCriteriaModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
