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
      <Drawer.Backdrop className="bg-black/15 backdrop-blur-sm">
        <Drawer.Content
          placement={direction}
          className="bg-(--color-bg) border-l border-(--color-border-strong) shadow-[-8px_0_24px_rgba(0,0,0,0.08)]"
        >
          <Drawer.Dialog>
            {direction === 'bottom' && <Drawer.Handle />}
            <Drawer.CloseTrigger aria-label="Close" />
            <Drawer.Header>
              <div className="flex items-center gap-3 pr-8">
                <div className="w-8 h-8 rounded-lg bg-[rgba(45,90,61,0.1)] flex items-center justify-center shrink-0">
                  <ClipboardMinus size={16} className="text-[#2d5a3d]" strokeWidth={1.75} />
                </div>
                <div>
                  <Drawer.Heading className="drawer__heading">
                    {EVALUATION_CRITERIA_CONTENT.heading}
                  </Drawer.Heading>
                  <p className="text-[11px] text-[#6b5f56] mt-0.5 font-normal">
                    {EVALUATION_CRITERIA_CONTENT.subheading}
                  </p>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <p className="text-sm text-(--color-text-secondary) leading-relaxed">
                  {EVALUATION_CRITERIA_CONTENT.description}
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  {EVALUATION_CRITERIA_CONTENT.metrics.map((metric, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg text-center border ${
                        metric.color === 'blue'
                          ? 'bg-[rgba(90,122,154,0.1)] border-[#5a7a9a]'
                          : 'bg-[rgba(74,124,89,0.1)] border-[#4a7c59]'
                      }`}
                    >
                      <div
                        className={`text-2xl font-bold ${
                          metric.color === 'blue' ? 'text-[#5a7a9a]' : 'text-[#4a7c59]'
                        }`}
                      >
                        {metric.number}
                      </div>
                      <div className="text-xs font-medium mt-1 text-(--color-text-muted)">
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
                        className={`p-4 rounded-xl border-l-4 ${
                          section.color === 'blue'
                            ? 'border-l-[#5a7a9a] bg-[rgba(90,122,154,0.1)]'
                            : section.color === 'emerald'
                              ? 'border-l-[#4a7c59] bg-[rgba(74,124,89,0.1)]'
                              : 'border-l-[#b8916a] bg-[rgba(184,145,106,0.1)]'
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div
                            className={`flex items-start gap-2 mb-2 ${
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
                        <div className={`grid grid-cols-1 gap-2 mt-3 ${section.gridCols}`}>
                          {section.factors.map((factor, factorIdx) => (
                            <div
                              key={factorIdx}
                              className="bg-(--color-bg-field) border border-(--color-border)"
                            >
                              <p className="text-xs font-semibold text-(--color-text-primary)">
                                {factor.title}
                              </p>
                              <p className="text-xs mt-0.5 text-(--color-text-muted)">
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
                <div className="border-l-2 border-(--color-warning) pl-3 py-1 text-sm text-(--color-text-secondary) leading-relaxed my-3">
                  <h4 className="font-bold mb-3 text-base text-(--color-warning)">
                    {EVALUATION_CRITERIA_CONTENT.sections.howWeCalculate}
                  </h4>
                  <div className="space-y-2">
                    {EVALUATION_CRITERIA_CONTENT.calculationSteps.map((step) => (
                      <div key={step.number} className="flex items-start gap-3">
                        <div className="flex items-center justify-center shrink-0 w-6 h-6 font-bold text-white rounded-full text-sm bg-(--color-warning)">
                          {step.number}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-(--color-text-primary)">
                            {step.title}
                          </p>
                          <p className="text-xs mt-0.5 text-(--color-text-muted)">
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
