import { Drawer } from '@heroui/react';
import { CircleDollarSign, ClipboardMinus, Link, Settings } from 'lucide-react';

import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';
import { cn } from '@/utils/cn';

const METRICS = [
  { number: 3, label: 'Core Value Types', color: 'blue' },
  { number: 8, label: 'Evaluation Factors', color: 'emerald' },
  { number: 100, label: 'Maximum Score', color: 'emerald' },
];

const VALUE_SECTIONS = [
  {
    title: 'Access Value',
    icon: <Link className="size-6" />,
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
    icon: <CircleDollarSign className="size-6" />,
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
    icon: <Settings className="size-6" />,
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

export default function EvaluationCriteriaDrawer() {
  const { isDrawerOpen, onClose } = useGlobalDrawer();
  const direction = useDrawerDirection();

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      placement={direction === 'right' ? 'right' : 'left'}
    >
      <Drawer.Backdrop>
        <Drawer.Content>
          <Drawer.Dialog>
            <Drawer.Header>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg bg-emerald-100 shrink-0',
                      'transition-[transform,box-shadow] duration-300 ease-out',
                      isDrawerOpen
                        ? 'scale-[1.12] -rotate-6 drop-shadow-md'
                        : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                    )}
                  >
                    <ClipboardMinus className="size-5 text-emerald-600" />
                  </div>
                  <div>
                    <Drawer.Heading className="text-lg font-semibold">
                      Evaluation Criteria
                    </Drawer.Heading>
                    <p className="text-sm text-gray-600">
                      Three core value dimensions with specific factors
                    </p>
                  </div>
                </div>

                {direction === 'right' && <Drawer.CloseTrigger />}
              </div>
            </Drawer.Header>
            <Drawer.Body className="gap-6">
              <div className="space-y-6">
                <p className="text-sm text-gray-600 leading-relaxed">
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
                          ? 'bg-linear-to-br from-blue-50 to-cyan-50 border-blue-200'
                          : 'bg-linear-to-br from-emerald-50 to-green-50 border-emerald-200'
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
                          ? 'bg-linear-to-br from-blue-50 to-cyan-50'
                          : section.color === 'emerald'
                            ? 'bg-linear-to-br from-emerald-50 to-green-50'
                            : 'bg-linear-to-br from-teal-50 to-cyan-50'
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
                          <div
                            key={factorIdx}
                            className="p-2 bg-white rounded-lg border border-gray-200"
                          >
                            <p className="text-xs font-semibold text-gray-900">{factor.title}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{factor.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* How We Calculate Section */}
                <div className="p-4 rounded-xl bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200">
                  <h4 className="font-bold text-amber-900 mb-3 text-base">
                    How We Calculate Your Score
                  </h4>
                  <div className="space-y-2">
                    {CALCULATION_STEPS.map((step) => (
                      <div key={step.number} className="flex items-start gap-3">
                        <div className="flex items-center justify-center shrink-0 w-6 h-6 font-bold text-white rounded-full bg-amber-600 text-sm">
                          {step.number}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-amber-900">{step.title}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
