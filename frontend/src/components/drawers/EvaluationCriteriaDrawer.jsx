/** Evaluation-criteria drawer explaining the scoring dimensions and calculation flow. */

import { Drawer } from '@heroui/react';
import { CircleDollarSign, ClipboardMinus, Link, Settings } from 'lucide-react';

import { EVALUATION_CRITERIA_CONTENT } from '@/constants/drawers';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks';
import { cn } from '@/utils/cn';

/**
 * Renders metric groups, value sections, and calculation guidance for evaluation criteria.
 */
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
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--color-drawer-icon-success-bg)">
                  <ClipboardMinus
                    size={16}
                    className="text-(--color-drawer-icon-success-text)"
                    strokeWidth={1.75}
                  />
                </div>
                <div>
                  <Drawer.Heading className="drawer__heading">
                    {EVALUATION_CRITERIA_CONTENT.heading}
                  </Drawer.Heading>
                  <p className="mt-0.5 text-sm font-normal text-(--color-text-secondary)">
                    {EVALUATION_CRITERIA_CONTENT.subheading}
                  </p>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="flex-1 overflow-y-auto">
              <div className="space-y-6">
                <p className="text-sm/relaxed text-(--color-text-secondary)">
                  {EVALUATION_CRITERIA_CONTENT.description}
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  {EVALUATION_CRITERIA_CONTENT.metrics.map((metric, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'rounded-xl bg-(--color-success-soft-ui) p-3 text-center',
                        metric.color === 'blue' ? 'text-(--color-info)' : 'text-(--color-success)',
                      )}
                    >
                      <div
                        className={cn(
                          'text-2xl font-medium',
                          metric.color === 'blue'
                            ? 'text-(--color-info)'
                            : 'text-(--color-success)',
                        )}
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
                <div className="my-8 space-y-8">
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
                        className={cn(
                          'rounded-xl p-3',
                          section.color === 'blue'
                            ? 'text-(--color-info)'
                            : 'text-(--color-success)',
                          section.color === 'blue'
                            ? 'bg-(--color-info-soft-ui)'
                            : section.color === 'emerald'
                              ? 'bg-(--color-success-soft-ui)'
                              : 'bg-(--color-warning-soft-ui)',
                        )}
                      >
                        <div className="mb-2 flex items-start gap-2">
                          <div
                            className={cn(
                              'mb-2 flex items-start gap-2',
                              section.color === 'blue'
                                ? 'text-(--color-info)'
                                : section.color === 'emerald'
                                  ? 'text-(--color-success)'
                                  : 'text-(--color-warning)',
                            )}
                          >
                            {icon}
                          </div>
                          <div className="flex-1">
                            <h4
                              className={cn(
                                'font-medium',
                                section.color === 'blue'
                                  ? 'text-(--color-info)'
                                  : section.color === 'emerald'
                                    ? 'text-(--color-success)'
                                    : 'text-(--color-warning)',
                              )}
                            >
                              {section.title}
                            </h4>
                            <p className="text-xs text-(--color-text-muted)">
                              {section.description}
                            </p>
                          </div>
                        </div>
                        <div className={cn('mt-3 grid grid-cols-1 gap-2', section.gridCols)}>
                          {section.factors.map((factor, factorIdx) => (
                            <div
                              key={factorIdx}
                              className="rounded-xl border-2 border-(--color-border-ui) bg-(--color-bg-field) p-3"
                            >
                              <p className="text-xs font-medium text-(--color-text-primary)">
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
                  <h4 className="mb-3 text-base font-medium text-(--color-warning)">
                    {EVALUATION_CRITERIA_CONTENT.sections.howWeCalculate}
                  </h4>
                  <div className="space-y-2">
                    {EVALUATION_CRITERIA_CONTENT.calculationSteps.map((step) => (
                      <div key={step.number} className="flex items-start gap-3">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-(--color-warning) text-sm font-medium text-white">
                          {step.number}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-(--color-text-primary)">
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
