import React from 'react';
import PropTypes from 'prop-types';
import { Link, CircleDollarSign, Settings, ClipboardMinus, X } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';

const METRICS = [
  { number: 3, label: 'Core Value Types', color: 'blue' },
  { number: 8, label: 'Evaluation Factors', color: 'emerald' },
  { number: 100, label: 'Maximum Score', color: 'emerald' },
];

const VALUE_SECTIONS = [
  {
    title: 'Access Value',
    icon: <Link size={24} />,
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
    icon: <CircleDollarSign size={24} />,
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
    icon: <Settings size={24} />,
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

export default function EvaluationCriteriaModal({ isModalOpen, onClose }) {
  return (
    <Modal
      isOpen={isModalOpen}
      onOpenChange={onClose}
      size="2xl"
      scrollBehavior="inside"
      backdrop="opaque"
      placement="center"
      hideCloseButton={true}
      classNames={{
        backdrop: 'bg-black/50',
        base: 'bg-white rounded-2xl shadow-xl',
      }}
    >
      <ModalContent className="outline-none focus:outline-none focus-visible:outline-none ring-0">
        <ModalHeader className="flex items-center gap-3 py-5">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <ClipboardMinus className="text-emerald-600" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#2c3e50]">Evaluation Criteria</h2>
            <p className="text-gray-500 text-xs">
              Three core value dimensions with specific factors
            </p>
          </div>
          <Button
            isIconOnly
            variant="light"
            onPress={onClose}
            aria-label="Close"
            className="ml-auto hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
        </ModalHeader>
        <ModalBody className="gap-5 py-6 px-6">
          <p className="leading-relaxed text-gray-700">
            Our AI-powered evaluation framework assesses business ideas across{' '}
            <strong>three core value dimensions</strong>, each comprising specific factors.
          </p>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3">
            {METRICS.map((metric, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg text-center border ${
                  metric.color === 'blue'
                    ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'
                    : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
                }`}
              >
                <div
                  className={`text-2xl font-bold ${
                    metric.color === 'blue' ? 'text-blue-600' : 'text-emerald-600'
                  }`}
                >
                  {metric.number}
                </div>
                <div className="text-xs text-gray-600 font-medium mt-1">{metric.label}</div>
              </div>
            ))}
          </div>

          {/* Value Sections */}
          <div className="space-y-4">
            {VALUE_SECTIONS.map((section, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border-l-4 ${section.borderColor} ${
                  section.color === 'blue'
                    ? 'bg-gradient-to-br from-blue-50 to-cyan-50'
                    : section.color === 'emerald'
                      ? 'bg-gradient-to-br from-emerald-50 to-green-50'
                      : 'bg-gradient-to-br from-teal-50 to-cyan-50'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <div
                    className={`mt-0.5 ${
                      section.color === 'blue'
                        ? 'text-blue-600'
                        : section.color === 'emerald'
                          ? 'text-emerald-600'
                          : 'text-teal-600'
                    }`}
                  >
                    {section.icon}
                  </div>
                  <div className="flex-1">
                    <h4
                      className={`font-bold mb-0.5 ${
                        section.color === 'blue'
                          ? 'text-blue-700'
                          : section.color === 'emerald'
                            ? 'text-emerald-700'
                            : 'text-teal-700'
                      }`}
                    >
                      {section.title}
                    </h4>
                    <p className="text-xs text-gray-600">{section.description}</p>
                  </div>
                </div>
                <div className={`grid grid-cols-1 gap-2 mt-3 ${section.gridCols}`}>
                  {section.factors.map((factor, factorIdx) => (
                    <div key={factorIdx} className="p-2 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs font-semibold text-gray-800">{factor.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{factor.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* How We Calculate Section */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-3 text-base">How We Calculate Your Score</h4>
            <div className="space-y-2">
              {CALCULATION_STEPS.map((step) => (
                <div key={step.number} className="flex items-start gap-3">
                  <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 font-bold text-white rounded-full bg-amber-600 text-sm">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900">{step.title}</p>
                    <p className="text-xs text-gray-700 mt-0.5">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="gap-2 py-2" />
      </ModalContent>
    </Modal>
  );
}

EvaluationCriteriaModal.propTypes = {
  isModalOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
