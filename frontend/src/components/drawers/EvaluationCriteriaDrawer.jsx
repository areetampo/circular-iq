import { Drawer } from '@heroui/react';
import { CircleDollarSign, ClipboardMinus, Link, Settings } from 'lucide-react';

import { EVALUATION_CRITERIA_CONTENT } from '@/constants/drawers';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';
import { cn } from '@/utils/cn';

export default function EvaluationCriteriaDrawer() {
  const { isDrawerOpen, onClose } = useGlobalDrawer();
  const direction = useDrawerDirection();

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Drawer.Backdrop>
        <Drawer.Content placement={direction}>
          <Drawer.Dialog>
            {direction === 'bottom' && <Drawer.Handle />}
            {direction === 'right' && <Drawer.CloseTrigger />}
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
                      {EVALUATION_CRITERIA_CONTENT.heading}
                    </Drawer.Heading>
                    <p className="text-sm text-gray-600">
                      {EVALUATION_CRITERIA_CONTENT.subheading}
                    </p>
                  </div>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="gap-6 mt-4">
              <div className="space-y-6">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {EVALUATION_CRITERIA_CONTENT.description}
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  {EVALUATION_CRITERIA_CONTENT.metrics.map((metric, idx) => (
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
                  {EVALUATION_CRITERIA_CONTENT.valueSections.map((section, idx) => {
                    const icon =
                      section.title === 'Access Value' ? (
                        <Link className="size-6" />
                      ) : section.title === 'Embedded Value' ? (
                        <CircleDollarSign className="size-6" />
                      ) : (
                        <Settings className="size-6" />
                      );
                    return (
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
                            {icon}
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
                    );
                  })}
                </div>

                {/* How We Calculate Section */}
                <div className="p-4 rounded-xl bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200">
                  <h4 className="font-bold text-amber-900 mb-3 text-base">
                    {EVALUATION_CRITERIA_CONTENT.sections.howWeCalculate}
                  </h4>
                  <div className="space-y-2">
                    {EVALUATION_CRITERIA_CONTENT.calculationSteps.map((step) => (
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

EvaluationCriteriaDrawer.propTypes = {};
