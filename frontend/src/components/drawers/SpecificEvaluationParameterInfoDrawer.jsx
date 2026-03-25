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
            {direction === 'bottom' && <Drawer.Handle />}
            {direction === 'right' && <Drawer.CloseTrigger aria-label="Close drawer" />}
            <Drawer.Header>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'h-6 w-6 shrink-0 transition-[transform,box-shadow] duration-300 ease-out',
                      cfg.iconColor,
                      isDrawerOpen
                        ? 'scale-[1.12] -rotate-6 drop-shadow-md'
                        : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                    )}
                    strokeWidth={1.75}
                  />
                  <div>
                    <Drawer.Heading className="text-lg font-semibold">
                      {SPECIFIC_PARAMETER_CONTENT.heading}
                    </Drawer.Heading>
                  </div>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body>
              <div className="space-y-6">
                <div className="px-4">
                  <div className="flex flex-col items-start justify-between gap-4 mb-5 xs:flex-row">
                    <div>
                      <h3 className={cn('mb-1 text-lg font-bold', cfg.paramTextColor)}>
                        {guidance.name}
                      </h3>
                      <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
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
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>
                          {guidance.definition}
                        </p>
                      </div>
                    )}
                    {guidance.methodology && (
                      <div>
                        <p className={cn('mb-1 font-bold', cfg.paramTextColor)}>
                          {SPECIFIC_PARAMETER_CONTENT.sections.methodology}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>
                          {guidance.methodology}
                        </p>
                      </div>
                    )}
                    {guidance.calibration && (
                      <div>
                        <p className={cn('mb-1 font-bold', cfg.paramTextColor)}>
                          {SPECIFIC_PARAMETER_CONTENT.sections.calibration}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                          {guidance.calibration}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {guidance.scale && (
                  <div className={cn('p-4 rounded-xl', cfg.panelBg, 'border', cfg.panelBorder)}>
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
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>
                            {description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {guidance.examples && (
                  <div
                    className="p-4 rounded-xl border"
                    style={{
                      backgroundColor: 'var(--info-soft)',
                      borderColor: 'var(--info)',
                    }}
                  >
                    <h4 className="mb-3 text-base font-bold" style={{ color: 'var(--info)' }}>
                      {SPECIFIC_PARAMETER_CONTENT.sections.benchmarks}
                    </h4>
                    <div className="space-y-2">
                      {guidance.examples.map(({ score, case: exampleCase, reason }, idx) => (
                        <div
                          key={`${exampleCase}-${score}-${idx}`}
                          className="pl-3 border-l-4"
                          style={{ borderLeftColor: 'var(--info)' }}
                        >
                          <p
                            className="text-sm font-semibold"
                            style={{ color: 'var(--foreground)' }}
                          >
                            {exampleCase} {score && `(${score})`}
                          </p>
                          {reason && (
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>
                              {reason}
                            </p>
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
