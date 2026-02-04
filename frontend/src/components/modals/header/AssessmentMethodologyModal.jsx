import React from 'react';
import PropTypes from 'prop-types';
import {
  Search,
  Bot,
  ChartColumn,
  CircleCheck,
  BookCopy,
  TriangleAlert,
  ChartSpline,
  X,
} from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';

const METHODOLOGY_ITEMS = [
  {
    icon: <Search size={20} />,
    title: 'Semantic Analysis',
    description:
      'Uses OpenAI text-embedding-3-small (1536 dimensions) to find the most relevant projects matching your business model and problem space.',
    borderColor: 'border-blue-500',
  },
  {
    icon: <Bot size={20} />,
    title: 'AI Reasoning',
    description:
      'GPT-4o-mini analyzes your submission against 3 similar cases with strict evidence-based reasoning and integrity checking.',
    borderColor: 'border-emerald-600',
  },
  {
    icon: <ChartColumn size={20} />,
    title: 'Multi-Dimensional Scoring',
    description:
      'Evaluates across 8 weighted parameters covering material innovation, circularity loops, market viability, and environmental impact.',
    borderColor: 'border-orange-500',
  },
  {
    icon: <CircleCheck size={20} />,
    title: 'Integrity Validation',
    description:
      'Cross-references your self-assessed scores against real-world benchmarks to identify overestimations and provide honest feedback.',
    borderColor: 'border-purple-600',
  },
];

export default function AssessmentMethodologyModal({ isModalOpen, onClose }) {
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
          <div className="p-2 bg-indigo-100 rounded-lg">
            <ChartSpline className="text-indigo-600" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#2c3e50]">Assessment Methodology</h2>
            <p className="text-xs text-gray-500">Our AI-powered evaluation framework</p>
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
            This evaluation uses a proprietary AI-powered framework combining vector similarity
            search with GPT-4o-mini reasoning against a database of{' '}
            <strong>1,108 high-quality circular economy projects</strong>.
          </p>

          <div className="space-y-3">
            {METHODOLOGY_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 border-l-4 rounded-lg bg-gradient-to-br ${item.borderColor} ${
                  item.borderColor === 'border-blue-500'
                    ? 'from-blue-50 to-cyan-50'
                    : item.borderColor === 'border-emerald-600'
                      ? 'from-emerald-50 to-green-50'
                      : item.borderColor === 'border-orange-500'
                        ? 'from-orange-50 to-amber-50'
                        : 'from-purple-50 to-pink-50'
                }`}
              >
                <h4 className="flex items-center gap-2 mb-1 text-sm font-bold text-gray-800">
                  {item.icon} {item.title}
                </h4>
                <p className="m-0 text-xs leading-relaxed text-gray-700">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="p-4 border rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
            <h4 className="flex items-center gap-2 mb-2 text-sm font-bold text-emerald-900">
              <BookCopy size={18} /> Data Source
            </h4>
            <p className="m-0 text-xs leading-relaxed text-emerald-900">
              <strong>GreenTechGuardians AI EarthHack Dataset:</strong> A curated collection of{' '}
              <strong>1,108 high-quality</strong> circular economy solutions (filtered from 1,300)
              spanning waste reduction, resource optimization, renewable energy, sustainable
              materials, and regenerative agriculture across multiple industries and geographic
              regions.
            </p>
          </div>

          <div className="p-4 border border-l-4 border-orange-500 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50">
            <p className="m-0 text-xs leading-relaxed text-orange-900">
              <strong className="flex items-center gap-2 mb-1">
                <TriangleAlert size={16} /> Disclaimer:
              </strong>
              This assessment is designed to provide{' '}
              <strong>constructive feedback for early-stage ideation</strong>. Scores reflect
              alignment with established circular economy principles and should be used as guidance,
              not as definitive validation of commercial viability.
            </p>
          </div>
        </ModalBody>
        <ModalFooter className="gap-2 py-2" />
      </ModalContent>
    </Modal>
  );
}

AssessmentMethodologyModal.propTypes = {
  isModalOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
