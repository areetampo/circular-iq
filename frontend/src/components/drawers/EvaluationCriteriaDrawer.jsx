import { Drawer } from '@heroui/react';
import { CircleDollarSign, ClipboardMinus, Link, Settings } from 'lucide-react';

import { EVALUATION_CRITERIA_CONTENT } from '@/constants/drawers';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';

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
            {direction === 'bottom' ? (
              <Drawer.Handle />
            ) : (
              <Drawer.CloseTrigger aria-label="Close" />
            )}
            <Drawer.Header>
              <div className="flex items-center gap-3 pr-8">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(45,90,61,0.1)]">
                  <ClipboardMinus size={16} className="text-[#2d5a3d]" strokeWidth={1.75} />
                </div>
                <div>
                  <Drawer.Heading className="drawer__heading">
                    {EVALUATION_CRITERIA_CONTENT.heading}
                  </Drawer.Heading>
                  <p className="mt-0.5 text-[0.7rem] font-normal text-[#6b5f56]">
                    {EVALUATION_CRITERIA_CONTENT.subheading}
                  </p>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <p className="text-sm/relaxed text-(--color-text-secondary)">
                  {EVALUATION_CRITERIA_CONTENT.description}
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  {EVALUATION_CRITERIA_CONTENT.metrics.map((metric, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 text-center ${
                        metric.color === 'blue'
                          ? 'border-[#5a7a9a] bg-[rgba(90,122,154,0.1)]'
                          : 'border-[#4a7c59] bg-[rgba(74,124,89,0.1)]'
                      }`}
                    >
                      <div
                        className={`text-2xl font-bold ${
                          metric.color === 'blue' ? 'text-[#5a7a9a]' : `text-[#4a7c59]`
                        }`}
                      >
                        {metric.number}
                      </div>
                      <div className="mt-1 text-xs font-medium text-(--color-text-muted)">
                        {metric.label}
                      </div>
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
                        className={`rounded-xl border-l-4 p-4 ${
                          section.color === 'blue'
                            ? 'border-l-[#5a7a9a] bg-[rgba(90,122,154,0.1)]'
                            : section.color === 'emerald'
                              ? 'border-l-[#4a7c59] bg-[rgba(74,124,89,0.1)]'
                              : 'border-l-[#b8916a] bg-[rgba(184,145,106,0.1)]'
                        }`}
                      >
                        <div className="mb-2 flex items-start gap-2">
                          <div
                            className={`mb-2 flex items-start gap-2 ${
                              section.color === 'blue'
                                ? 'text-[#5a7a9a]'
                                : section.color === 'emerald'
                                  ? 'text-[#4a7c59]'
                                  : 'text-[#b8916a]'
                            }`}
                          >
                            {icon}
                          </div>
                          <div className="flex-1">
                            <h4
                              className={`font-semibold ${
                                section.color === 'blue'
                                  ? 'text-[#5a7a9a]'
                                  : section.color === 'emerald'
                                    ? 'text-[#4a7c59]'
                                    : 'text-[#b8916a]'
                              }`}
                            >
                              {section.title}
                            </h4>
                            <p className="text-xs text-(--color-text-muted)">
                              {section.description}
                            </p>
                          </div>
                        </div>
                        <div className={`mt-3 grid grid-cols-1 gap-2 ${section.gridCols}`}>
                          {section.factors.map((factor, factorIdx) => (
                            <div
                              key={factorIdx}
                              className="border border-border bg-(--color-bg-field)"
                            >
                              <p className="text-xs font-semibold text-(--color-text-primary)">
                                {factor.title}
                              </p>
                              <p className="mt-0.5 text-xs text-(--color-text-muted)">
                                {factor.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* How We Calculate Section */}
                <div className="my-3 border-l-2 border-(--color-warning) py-1 pl-3 text-sm/relaxed text-(--color-text-secondary)">
                  <h4 className="mb-3 text-base font-bold text-(--color-warning)">
                    {EVALUATION_CRITERIA_CONTENT.sections.howWeCalculate}
                  </h4>
                  <div className="space-y-2">
                    {EVALUATION_CRITERIA_CONTENT.calculationSteps.map((step) => (
                      <div key={step.number} className="flex items-start gap-3">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-(--color-warning) text-sm font-bold text-white">
                          {step.number}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-(--color-text-primary)">
                            {step.title}
                          </p>
                          <p className="mt-0.5 text-xs text-(--color-text-muted)">
                            {step.description}
                          </p>
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
