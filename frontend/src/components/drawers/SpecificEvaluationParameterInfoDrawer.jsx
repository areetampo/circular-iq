import { Drawer } from '@heroui/react';
import PropTypes from 'prop-types';

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
      placement={direction === 'right' ? 'right' : 'bottom'}
    >
      <Drawer.Backdrop>
        <Drawer.Content>
          <Drawer.Dialog>
            {direction === 'bottom' && <Drawer.Handle />}
            <Drawer.CloseTrigger />
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
                      Parameter Information
                    </Drawer.Heading>
                    <Drawer.Description className="text-sm text-gray-600">
                      Detailed guidance for evaluation parameters
                    </Drawer.Description>
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
                      <p className="text-sm font-medium text-slate-500">{guidance.category}</p>
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
                        <p className={cn('mb-1 font-bold', cfg.paramTextColor)}>Definition</p>
                        <p className="text-gray-600">{guidance.definition}</p>
                      </div>
                    )}
                    {guidance.methodology && (
                      <div>
                        <p className={cn('mb-1 font-bold', cfg.paramTextColor)}>Methodology</p>
                        <p className="text-gray-600">{guidance.methodology}</p>
                      </div>
                    )}
                    {guidance.calibration && (
                      <div>
                        <p className={cn('mb-1 font-bold', cfg.paramTextColor)}>Calibration</p>
                        <p className="text-gray-700">{guidance.calibration}</p>
                      </div>
                    )}
                  </div>
                </div>

                {guidance.scale && (
                  <div className={cn('p-4 rounded-xl', cfg.panelBg, 'border', cfg.panelBorder)}>
                    <h4 className={cn('mb-3 text-base font-bold', cfg.panelTitle)}>Score Guide</h4>
                    <div className="space-y-2">
                      {guidance.scale.map(({ score, label, description }) => (
                        <div
                          key={`${score}-${label}`}
                          className={cn('pl-3 border-l-4', cfg.panelItemBorder)}
                        >
                          <p className={cn('text-sm font-semibold', cfg.paramTextColor)}>
                            {score} - {label}
                          </p>
                          <p className="text-xs text-gray-600">{description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {guidance.examples && (
                  <div className="p-4 border border-blue-200 rounded-xl bg-blue-50">
                    <h4 className="mb-3 text-base font-bold text-blue-700">Benchmarks</h4>
                    <div className="space-y-2">
                      {guidance.examples.map(({ score, case: exampleCase, reason }, idx) => (
                        <div
                          key={`${exampleCase}-${score}-${idx}`}
                          className="pl-3 border-l-4 border-blue-400"
                        >
                          <p className="text-sm font-semibold text-blue-900">
                            {exampleCase} {score && `(${score})`}
                          </p>
                          {reason && <p className="text-xs text-gray-600">{reason}</p>}
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
