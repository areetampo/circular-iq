import React from 'react';
import PropTypes from 'prop-types';
import { factorDefinitions, parameterGuidance } from '../../constants/evaluationData';

const PROBLEM_ELEMENTS = [
  {
    title: 'Environmental Impact',
    description:
      'Specific waste, pollution, or resource depletion issue (e.g., "8M tons of plastic waste entering oceans annually").',
  },
  {
    title: 'Quantified Scale',
    description:
      'Use real numbers, percentages, or measurements to show magnitude (tons, percent of market, number of people affected).',
  },
  {
    title: 'Current Gaps',
    description:
      'Why existing solutions fail (cost barriers, infrastructure limits, behavior challenges, regulation issues).',
  },
  {
    title: 'Stakeholders Affected',
    description:
      'Who experiences this problem and how (consumers, businesses, communities, ecosystems).',
  },
  {
    title: 'Geographic Context',
    description: 'Where this problem is most acute (local, regional, national, global).',
  },
  {
    title: 'Urgency Indicators',
    description:
      'Why this needs solving now (regulatory pressure, market demand, environmental tipping points).',
  },
];

const PROBLEM_WRITING_TIPS = [
  'Start with a compelling statistic or fact.',
  'Use specific numbers instead of vague terms.',
  'Connect the problem to economic or social costs.',
  'Reference industry standards or regulations when relevant.',
  'Cite sources if available (e.g., EPA, industry studies).',
];

const SOLUTION_COMPONENTS = [
  {
    title: 'Materials and Inputs',
    description:
      'Exact materials used with specifications (post-consumer PET, agricultural hemp fiber, recycled aluminum).',
  },
  {
    title: 'Process and Technology',
    description:
      'Step-by-step transformation process and standards met (e.g., mechanical sorting, washing, pelletizing at 230C).',
  },
  {
    title: 'Business Model and Logistics',
    description:
      'How you collect, process, and distribute (hub-and-spoke, delivery-as-a-service, reverse logistics network).',
  },
  {
    title: 'Circularity Loop',
    description:
      'How materials return to use (composted material sold to farms, returning to feedstock for your product).',
  },
  {
    title: 'Key Performance Metrics',
    description:
      'Quantified results (recovery rate, unit cost, composting time, carbon footprint vs virgin materials).',
  },
  {
    title: 'Partnerships and Infrastructure',
    description:
      'Key collaborators (waste management partners, processing facilities, certification bodies, distribution channels).',
  },
  {
    title: 'Scalability Path',
    description:
      'How the solution grows (pilot to regional to national; target units per month by year 2).',
  },
  {
    title: 'Economic Viability',
    description: 'Revenue model, cost structure, and comparison to conventional alternatives.',
  },
];

const SOLUTION_PITFALLS = [
  'Avoid vague descriptions; provide specific materials and processes.',
  'Avoid missing technical details; include equipment, temperatures, and cycle times.',
  'Avoid absent metrics; include recovery rates, costs, and carbon impact.',
  'Avoid unclear loop closure; explain how materials re-enter the system.',
];

const SOLUTION_PRO_TIPS = [
  'Use industry-standard terminology and note certifications.',
  'Include both environmental and economic metrics.',
  'Mention regulatory compliance (FDA, EPA, ISO, etc.).',
  'Compare to conventional alternatives (cost, performance, impact).',
  'Show real-world validation (pilots, customers, third-party testing).',
];

const PROBLEM_EXAMPLE =
  'Single-use plastic packaging creates 8 million tons of ocean waste annually, disrupting marine ecosystems and food chains. Current alternatives are cost-prohibitive (> $2/unit) or require industrial composting infrastructure that 75% of municipalities lack. This leaves a gap between demand for sustainable packaging and practical implementation at scale.';

const SOLUTION_EXAMPLE =
  'We convert agricultural hemp waste into compostable mailers and run a hub-and-spoke collection model. Customers use prepaid mailers; 15 regional hubs aggregate returns; certified composters process 95% of materials within 90 days into soil amendments. Those amendments are sold back to hemp farms, creating a closed loop. Cost: $0.85 per unit at scale; home-compostable in 180 days.';

const DESCRIPTION_POINTS = [
  'Materials: What materials or resources are being reused, recycled, or recovered?',
  'Process: How does your business model close the loop?',
  'Stakeholders: Who are the key participants (suppliers, customers, partners)?',
  'Value Proposition: What environmental and economic benefits does it provide?',
  'Scale: What is the intended scope (local, regional, global)?',
];

const SELF_ASSESSMENT_GUIDELINES = [
  'Be realistic; AI validation will check against evidence.',
  'Consider both current state and 12-month potential.',
  'Use the examples as reference points when calibrating detail.',
];

export default function MetricInfoModal({ onClose, type }) {
  const getModalTitle = () => {
    if (type === 'problem') return 'Business Problem Guide';
    if (type === 'solution') return 'Business Solution Guide';
    if (type === 'factors') return 'Evaluation Factors';
    if (parameterGuidance[type]) return `${parameterGuidance[type].name} Details`;
    return 'Guide';
  };

  const getModalContent = () => {
    if (type === 'problem') return <ProblemGuide />;
    if (type === 'solution') return <SolutionGuide />;
    if (type === 'factors') return <FactorsGuide />;
    if (parameterGuidance[type]) return <ParameterDetailGuide paramKey={type} />;
    return <DescriptionGuide />;
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="m-0 text-2xl font-bold text-emerald-600">{getModalTitle()}</h2>
          <button
            className="flex items-center justify-center w-8 h-8 pb-0.5 text-xl font-bold text-gray-500 border-none rounded cursor-pointer hover:bg-gray-100 hover:text-gray-700"
            onClick={onClose}
            aria-label="Close modal"
          >
            x
          </button>
        </div>
        <div className="p-6">{getModalContent()}</div>
      </div>
    </div>
  );
}

MetricInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
};

function ProblemGuide() {
  return (
    <div className="space-y-5">
      <p className="leading-relaxed">
        Describe the <strong>environmental or circular economy challenge</strong> your business
        addresses. Provide a clear, quantified problem statement that shows the scope and impact.
      </p>

      <div className="p-4 bg-gray-100 rounded">
        <h4 className="m-0 mb-3 text-lg font-bold text-emerald-600">
          Essential Elements to Include:
        </h4>
        <ul className="pl-6 m-0 space-y-2 leading-relaxed">
          {PROBLEM_ELEMENTS.map(({ title, description }) => (
            <li key={title}>
              <strong>{title}:</strong> {description}
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 rounded bg-blue-50">
        <h4 className="m-0 mb-3 text-lg font-bold text-blue-600">Writing Tips:</h4>
        <ul className="pl-6 m-0 space-y-2 leading-relaxed">
          {PROBLEM_WRITING_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h4 className="m-0 text-lg font-bold text-blue-500">Example Problem Statement:</h4>
        <p className="p-3 italic leading-relaxed text-gray-700 rounded bg-blue-50">
          {PROBLEM_EXAMPLE}
        </p>
      </div>

      <p className="mt-2 italic text-gray-500">
        <strong>Minimum 200 characters required</strong> for accurate matching and analysis.
      </p>
    </div>
  );
}

function SolutionGuide() {
  return (
    <div className="space-y-5">
      <p className="leading-relaxed">
        Describe <strong>how your business solves the problem</strong> with a detailed, technical
        explanation of your circular economy approach. Be specific about materials, processes,
        partnerships, and measurable outcomes.
      </p>

      <div className="p-4 bg-gray-100 rounded">
        <h4 className="m-0 mb-3 text-lg font-bold text-emerald-600">
          Critical Components to Address:
        </h4>
        <ul className="pl-6 m-0 space-y-2 leading-relaxed">
          {SOLUTION_COMPONENTS.map(({ title, description }) => (
            <li key={title}>
              <strong>{title}:</strong> {description}
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border border-orange-200 rounded bg-orange-50">
        <h4 className="m-0 mb-3 text-lg font-bold text-orange-600">Common Pitfalls to Avoid:</h4>
        <ul className="pl-6 m-0 space-y-2 leading-relaxed">
          {SOLUTION_PITFALLS.map((pitfall) => (
            <li key={pitfall}>{pitfall}</li>
          ))}
        </ul>
      </div>

      <div className="p-4 border rounded bg-emerald-50 border-emerald-200">
        <h4 className="m-0 mb-3 text-lg font-bold text-emerald-700">
          Pro Tips for Strong Solutions:
        </h4>
        <ul className="pl-6 m-0 space-y-2 leading-relaxed">
          {SOLUTION_PRO_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h4 className="m-0 text-lg font-bold text-blue-500">Example Solution Statement:</h4>
        <p className="p-3 italic leading-relaxed text-gray-700 rounded bg-blue-50">
          {SOLUTION_EXAMPLE}
        </p>
      </div>

      <p className="mt-2 italic text-gray-500">
        <strong>Minimum 200 characters required</strong> for accurate matching and analysis.
      </p>
    </div>
  );
}

function DescriptionGuide() {
  return (
    <div className="space-y-5">
      <p className="leading-relaxed">
        Provide a concise description that summarizes your circular solution. Touch on materials,
        process, stakeholders, value, and scale so our models can calibrate your score accurately.
      </p>

      <div className="p-4 bg-gray-100 rounded">
        <h4 className="m-0 mb-3 text-lg font-bold text-emerald-600">Cover These Points:</h4>
        <ul className="pl-6 m-0 space-y-2 leading-relaxed">
          {DESCRIPTION_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>

      <div className="p-4 border border-blue-100 rounded bg-blue-50">
        <h4 className="m-0 mb-3 text-lg font-bold text-blue-600">Self-Assessment Tips:</h4>
        <ul className="pl-6 m-0 space-y-2 leading-relaxed">
          {SELF_ASSESSMENT_GUIDELINES.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>

      <p className="mt-2 italic text-gray-500">
        <strong>Minimum 200 characters required</strong> for accurate matching and analysis.
      </p>
    </div>
  );
}

function FactorsGuide() {
  return (
    <div className="space-y-5">
      <p className="leading-relaxed">
        These are the factors we use to evaluate circularity potential. Use the definitions to align
        your self-assessed scores with our scoring model.
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
  );
}

function ParameterDetailGuide({ paramKey }) {
  const guidance = parameterGuidance[paramKey];
  if (!guidance) return null;

  const weightLabel = guidance.weightPercent || `${Math.round((guidance.weight || 0) * 100)}%`;

  return (
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
  );
}

ParameterDetailGuide.propTypes = {
  paramKey: PropTypes.string.isRequired,
};
