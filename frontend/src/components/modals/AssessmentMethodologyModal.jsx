import PropTypes from 'prop-types';
import {
  Search,
  Bot,
  ChartColumn,
  CircleCheck,
  BookCopy,
  TriangleAlert,
  ChartSpline,
} from 'lucide-react';
import { Modal } from '@heroui/react';
import { Button } from '@/components/common';
import { useGlobalModal } from '@/contexts/ModalContext';

const METHODOLOGY_ITEMS = [
  {
    icon: <Search className="size-5" />,
    title: 'Semantic Analysis',
    description:
      'Uses OpenAI text-embedding-3-small (1536 dimensions) to find the most relevant projects matching your business model and problem space.',
    borderColor: 'border-blue-500',
  },
  {
    icon: <Bot className="size-5" />,
    title: 'AI Reasoning',
    description:
      'GPT-4o-mini analyzes your submission against 3 similar cases with strict evidence-based reasoning and integrity checking.',
    borderColor: 'border-emerald-600',
  },
  {
    icon: <ChartColumn className="size-5" />,
    title: 'Multi-Dimensional Scoring',
    description:
      'Evaluates across 8 weighted parameters covering material innovation, circularity loops, market viability, and environmental impact.',
    borderColor: 'border-orange-500',
  },
  {
    icon: <CircleCheck className="size-5" />,
    title: 'Integrity Validation',
    description:
      'Cross-references your self-assessed scores against real-world benchmarks to identify overestimations and provide honest feedback.',
    borderColor: 'border-purple-600',
  },
];

export default function AssessmentMethodologyModal() {
  const { isModalOpen, onClose } = useGlobalModal();

  return (
    <Modal.Backdrop
      isOpen={isModalOpen}
      onOpenChange={onClose}
      variant="opaque"
      isDismissable={true}
    >
      <Modal.Container placement="center" scroll="inside" size="3xl">
        <Modal.Dialog
          aria-label="Assessment Methodology"
          aria-labelledby="assessment-methodology-modal-title"
        >
          <Modal.Header className="pt-0 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100">
                <ChartSpline className="size-5 text-indigo-600" />
              </div>
              <div>
                <h2 id="assessment-methodology-modal-title" className="text-lg font-semibold">
                  Assessment Methodology
                </h2>
                <p className="text-sm text-gray-600">Our AI-powered evaluation framework</p>
              </div>
            </div>
          </Modal.Header>
          <Modal.Body className="gap-6 px-2">
            <div className="space-y-6">
              <p className="text-sm text-gray-600 leading-relaxed">
                This evaluation uses a proprietary AI-powered framework combining vector similarity
                search with GPT-4o-mini reasoning against a database of{' '}
                <strong>4,000+ high-quality circular economy projects</strong>.
              </p>

              <div className="space-y-3">
                {METHODOLOGY_ITEMS.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 border-l-4 rounded-lg bg-linear-to-br ${item.borderColor} ${
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
                    <p className="m-0 text-xs leading-relaxed text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-lg bg-linear-to-br from-emerald-50 to-green-50 border border-emerald-200">
                <h4 className="flex items-center gap-2 mb-2 text-sm font-bold text-emerald-700">
                  <BookCopy className="size-5" /> Data Source
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  <strong>GreenTechGuardians AI EarthHack Dataset:</strong> A curated collection of{' '}
                  <strong>4,000+ high-quality</strong> circular economy solutions (filtered from
                  1,300) spanning waste reduction, resource optimization, renewable energy,
                  sustainable materials, and regenerative agriculture across multiple industries and
                  geographic regions.
                </p>
              </div>

              <div className="p-4 rounded-lg border-l-4 border-orange-500 bg-linear-to-br from-orange-50 to-amber-50">
                <p className="text-xs text-gray-600 leading-relaxed">
                  <strong className="flex items-center gap-2 mb-1">
                    <TriangleAlert className="size-4" /> Disclaimer:
                  </strong>
                  This assessment is designed to provide{' '}
                  <strong>constructive feedback for early-stage ideation</strong>. Scores reflect
                  alignment with established circular economy principles and should be used as
                  guidance, not as definitive validation of commercial viability.
                </p>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="">
            <Button variant="tertiary" onPress={onClose}>
              Close
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

AssessmentMethodologyModal.propTypes = {
  isModalOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
