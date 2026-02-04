import React from 'react';
import PropTypes from 'prop-types';
import { ClipboardMinus, X } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';

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

const PROBLEM_EXAMPLE =
  'Single-use plastic packaging creates 8 million tons of ocean waste annually, disrupting marine ecosystems and food chains. Current alternatives are cost-prohibitive (> $2/unit) or require industrial composting infrastructure that 75% of municipalities lack. This leaves a gap between demand for sustainable packaging and practical implementation at scale.';

export default function BusinessProblemInfoModal({ onClose, isModalOpen }) {
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
          <div className="p-2 rounded-lg bg-emerald-100">
            <ClipboardMinus className="text-emerald-600" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#2c3e50]">Business Problem Guide</h2>
            <p className="text-xs text-gray-500">Environmental or circular economy challenge</p>
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
        <ModalBody className="gap-5 px-6 py-6">
          <p className="leading-relaxed text-gray-700">
            Describe the <strong>environmental or circular economy challenge</strong> your business
            addresses.
          </p>

          <div className="p-4 border bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-emerald-200">
            <h4 className="mb-3 text-base font-bold text-emerald-700">Essential Elements</h4>
            <ul className="space-y-2">
              {PROBLEM_ELEMENTS.map(({ title, description }) => (
                <li key={title} className="pl-3 text-sm border-l-3 border-emerald-400">
                  <strong className="text-emerald-900">{title}</strong>
                  <p className="text-gray-700 text-xs mt-0.5">{description}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
            <h4 className="mb-3 text-base font-bold text-blue-700">Writing Tips</h4>
            <ul className="space-y-1">
              {PROBLEM_WRITING_TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="font-bold text-blue-500">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-base font-bold text-indigo-700">Example Statement</h4>
            <p className="p-3 text-sm italic leading-relaxed text-gray-700 border border-l-4 border-indigo-200 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border-l-indigo-500">
              {PROBLEM_EXAMPLE}
            </p>
          </div>

          <p className="p-3 text-xs italic text-gray-500 bg-gray-100 rounded-lg">
            ⚠️ <strong>Minimum 200 characters required</strong>
          </p>
        </ModalBody>
        <ModalFooter className="gap-2 py-2" />
      </ModalContent>
    </Modal>
  );
}

BusinessProblemInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
};
