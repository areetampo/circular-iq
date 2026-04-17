import { Drawer } from '@heroui/react';
import PropTypes from 'prop-types';

import { SPECIFIC_PARAMETER_CONTENT } from '@/constants/drawers';
import { parameterGuidance, parameterLabels } from '@/constants/evaluationData';
import { DEFAULT_CONFIG, GROUP_STYLE_CONFIG } from '@/constants/groupStyleConfig';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';
import { cn } from '@/utils/cn';

export default function SpecificEvaluationParameterInfoDrawer({ paramKey }) {
  if (!paramKey) return null;
  const guidance = parameterGuidance[paramKey];
  if (!guidance) return null;

  const groupName =
    (parameterLabels[paramKey] && parameterLabels[paramKey].category) ||
    (guidance.category && guidance.category.split('(')[0].trim());
  const cfg = GROUP_STYLE_CONFIG[groupName] ?? DEFAULT_CONFIG;
  const Icon = cfg.Icon;

  const weightLabel = guidance.weightPercent || `${Math.round((guidance.weight || 0) * 100)}%`;

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
                  <Icon
                    className="size-4 text-(--color-drawer-icon-success-text)"
                    strokeWidth={1.75}
                  />
                </div>
                <div>
                  <Drawer.Heading>{SPECIFIC_PARAMETER_CONTENT.heading}</Drawer.Heading>
                  <p className="mt-0.5 text-[1rem] font-normal text-(--color-text-secondary)">
                    {guidance.name}
                  </p>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <div className="mb-5 flex flex-col items-start justify-between gap-4 xs:flex-row">
                    <div>
                      <h3 className={cn('mb-1 font-sans text-lg font-medium', cfg.paramTextColor)}>
                        {guidance.name}
                      </h3>
                      <p className="text-sm font-medium text-(--color-text-muted)">
                        {guidance.category}
                      </p>
                    </div>
                    {guidance.weight && (
                      <div
                        className={cn(
                          `flex items-center justify-center rounded-lg border-2 px-3 py-1 text-sm font-medium whitespace-nowrap`,
                          cfg.paramTextColor,
                          cfg.paramBg,
                          cfg.paramBorder,
                        )}
                      >
                        Weight: {weightLabel}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 text-sm/relaxed">
                    {guidance.definition && (
                      <div>
                        <p className={cn('mb-1 font-medium', cfg.paramTextColor)}>
                          {SPECIFIC_PARAMETER_CONTENT.sections.definition}
                        </p>
                        <p className="text-sm/relaxed text-(--color-text-secondary)">
                          {guidance.definition}
                        </p>
                      </div>
                    )}
                    {guidance.methodology && (
                      <div>
                        <p className={cn('mb-1 font-medium', cfg.paramTextColor)}>
                          {SPECIFIC_PARAMETER_CONTENT.sections.methodology}
                        </p>
                        <p className="text-sm/relaxed text-(--color-text-secondary)">
                          {guidance.methodology}
                        </p>
                      </div>
                    )}
                    {guidance.calibration && (
                      <div>
                        <p className={cn('mb-1 font-medium', cfg.paramTextColor)}>
                          {SPECIFIC_PARAMETER_CONTENT.sections.calibration}
                        </p>
                        <p className="text-sm/relaxed text-(--color-text-primary)">
                          {guidance.calibration}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {guidance.scale && (
                  <div className={cn(`rounded-xl bg-(--color-success-soft-ui)`)}>
                    <h4 className={cn('mb-3 text-base font-medium', cfg.panelTitle)}>
                      {SPECIFIC_PARAMETER_CONTENT.sections.scoreGuide}
                    </h4>
                    <div className="space-y-1 py-1">
                      {guidance.scale.map(({ score, label, description }) => (
                        <div
                          key={`${score}-${label}`}
                          className={cn('px-3 py-2', cfg.panelItemBorder)}
                        >
                          <p className={cn('text-sm font-medium', cfg.paramTextColor)}>
                            {score} - {label}
                          </p>
                          <p className="text-sm text-(--color-text-muted)">{description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {guidance.examples && (
                  <div className="rounded-xl text-sm/relaxed text-(--color-text-secondary)">
                    <h4 className="mb-3 text-base font-medium text-(--color-accent)">
                      {SPECIFIC_PARAMETER_CONTENT.sections.benchmarks}
                    </h4>
                    <div className="space-y-2">
                      {guidance.examples.map(({ score, case: exampleCase, reason }, idx) => (
                        <div
                          key={`${exampleCase}-${score}-${idx}`}
                          className="rounded-lg bg-(--color-warning-soft-ui) px-3 py-2"
                        >
                          <p className="text-sm font-medium text-(--color-text-primary)">
                            {exampleCase} {score && `(${score})`}
                          </p>
                          {reason && (
                            <p className="mt-1 text-sm text-(--color-text-muted)">{reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

SpecificEvaluationParameterInfoDrawer.propTypes = {
  paramKey: PropTypes.string.isRequired,
};
