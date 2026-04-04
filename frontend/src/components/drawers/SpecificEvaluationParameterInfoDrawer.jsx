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
                  <Icon className="w-4 h-4 text-[#2d5a3d]" strokeWidth={1.75} />
                </div>
                <div>
                  <Drawer.Heading className="drawer__heading">
                    {SPECIFIC_PARAMETER_CONTENT.heading}
                  </Drawer.Heading>
                  <p className="text-[11px] text-[#6b5f56] mt-0.5 font-normal">{guidance.name}</p>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex flex-col items-start justify-between gap-4 mb-5 xs:flex-row">
                    <div>
                      <h3 className={cn('mb-1 text-lg font-bold', cfg.paramTextColor)}>
                        {guidance.name}
                      </h3>
                      <p className="text-sm font-medium text-(--color-text-muted)">
                        {guidance.category}
                      </p>
                    </div>
                    {guidance.weight && (
                      <div
                        className={cn(
                          'flex items-center justify-center px-3 py-1 text-sm font-bold border-2 rounded-lg whitespace-nowrap',
                          cfg.badgeBorder,
                          cfg.badgeBg,
                          cfg.badgeText,
                        )}
                      >
                        Weight: {weightLabel}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 text-sm leading-relaxed">
                    {guidance.definition && (
                      <div>
                        <p className={cn('mb-1 font-bold', cfg.paramTextColor)}>
                          {SPECIFIC_PARAMETER_CONTENT.sections.definition}
                        </p>
                        <p className="text-sm text-(--color-text-secondary) leading-relaxed">
                          {guidance.definition}
                        </p>
                      </div>
                    )}
                    {guidance.methodology && (
                      <div>
                        <p className={cn('mb-1 font-bold', cfg.paramTextColor)}>
                          {SPECIFIC_PARAMETER_CONTENT.sections.methodology}
                        </p>
                        <p className="text-sm text-(--color-text-secondary) leading-relaxed">
                          {guidance.methodology}
                        </p>
                      </div>
                    )}
                    {guidance.calibration && (
                      <div>
                        <p className={cn('mb-1 font-bold', cfg.paramTextColor)}>
                          {SPECIFIC_PARAMETER_CONTENT.sections.calibration}
                        </p>
                        <p className="text-sm text-(--color-text-primary) leading-relaxed">
                          {guidance.calibration}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {guidance.scale && (
                  <div
                    className={cn(
                      'p-4 rounded-xl border-l-2 border-(--color-accent) pl-3 bg-(--color-accent-light) rounded-r-sm py-2',
                    )}
                  >
                    <h4 className={cn('mb-3 text-base font-bold', cfg.panelTitle)}>
                      {SPECIFIC_PARAMETER_CONTENT.sections.scoreGuide}
                    </h4>
                    <div className="space-y-2">
                      {guidance.scale.map(({ score, label, description }) => (
                        <div
                          key={`${score}-${label}`}
                          className={cn('pl-3 border-l-4', cfg.panelItemBorder)}
                        >
                          <p className={cn('text-sm font-semibold', cfg.paramTextColor)}>
                            {score} - {label}
                          </p>
                          <p className="text-xs text-(--color-text-muted) mt-1">{description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {guidance.examples && (
                  <div className="border-l-2 border-(--color-accent) pl-3 py-1 text-sm text-(--color-text-secondary) leading-relaxed my-3">
                    <h4 className="mb-3 text-base font-bold text-(--color-accent)">
                      {SPECIFIC_PARAMETER_CONTENT.sections.benchmarks}
                    </h4>
                    <div className="space-y-2">
                      {guidance.examples.map(({ score, case: exampleCase, reason }, idx) => (
                        <div
                          key={`${exampleCase}-${score}-${idx}`}
                          className="pl-3 border-l-4 border-(--color-accent)"
                        >
                          <p className="text-sm font-semibold text-(--color-text-primary)">
                            {exampleCase} {score && `(${score})`}
                          </p>
                          {reason && (
                            <p className="text-xs text-(--color-text-muted) mt-1">{reason}</p>
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
