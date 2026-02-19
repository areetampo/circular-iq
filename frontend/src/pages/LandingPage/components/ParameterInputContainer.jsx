import React from 'react';
import PropTypes from 'prop-types';
import { useFormContext, Controller } from 'react-hook-form';
import { useGlobalModal } from '@/contexts/ModalContext';
import { useSession } from '@/features/session/hooks/useSession';
import { parameterLabels, parameterGroups, parameterGuidance } from '@/constants/evaluationData';
import { Label, NumberField, Accordion, cn } from '@heroui/react';
import InfoIconButton from '@/components/common/InfoIconButton';
import { ChevronDown, RadioTower, Coins, Recycle } from 'lucide-react';

// ─── Group config ─────────────────────────────────────────────────────────────
// RadioTower → Access Value      (signal, broadcast reach, participation)
// Coins      → Embedded Value    (stored worth, monetary/material value retained)
// Recycle    → Processing Value  (circular processing, transformation loop)
const GROUP_CONFIG = {
  'Access Value': {
    Icon: RadioTower,
    iconCn: 'text-violet-500',
    subtitle: 'Reach and participation across stakeholders',
  },
  'Embedded Value': {
    Icon: Coins,
    iconCn: 'text-emerald-500',
    subtitle: 'Intrinsic worth retained within the system',
  },
  'Processing Value': {
    Icon: Recycle,
    iconCn: 'text-amber-500',
    subtitle: 'Efficiency and safety of circular processes',
  },
};

const DEFAULT_CONFIG = { Icon: Coins, iconCn: 'text-slate-400', subtitle: '' };

const SCALE_COLORS = [
  'text-red-500 bg-red-50',
  'text-amber-600 bg-amber-50',
  'text-emerald-600 bg-emerald-50',
];

// ─── ParameterBox ─────────────────────────────────────────────────────────────
const ParameterBox = React.memo(({ paramKey, loading }) => {
  const { control, getValues } = useFormContext();
  const { openSpecificEvaluationParameterInfoModal } = useGlobalModal();
  const { saveSession } = useSession();

  const scaleMarkers = React.useMemo(() => {
    const g = parameterGuidance[paramKey];
    if (!g?.scale) return null;
    return g.scale.filter((_, i) => i % 2 === 0).slice(0, 3);
  }, [paramKey]);

  const guidance = React.useMemo(() => parameterGuidance[paramKey], [paramKey]);

  return (
    <div className="w-full flex flex-col items-center gap-2.5">
      <Controller
        name={`parameters.${paramKey}`}
        control={control}
        render={({ field }) => (
          <div className="w-full flex flex-col items-center gap-2.5">
            <NumberField
              className="w-full flex flex-col items-center"
              minValue={0}
              maxValue={100}
              step={1}
              name={paramKey}
              id={paramKey}
              value={field.value ?? 0}
              onChange={(value) => {
                field.onChange(Math.min(Math.max(Number(value) || 0, 0), 100));
                // Do NOT persist here — the debounced autosave in LandingPage handles persistence.
              }}
              isDisabled={loading}
              aria-label={parameterLabels[paramKey].label}
              formatOptions={{
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
                useGrouping: false,
              }}
            >
              <Label className="mb-2 flex items-center gap-1 bg-emerald-100 text-emerald-700 rounded-full px-3 py-1 cursor-default w-fit mx-auto">
                <span className="font-semibold text-xs whitespace-nowrap">
                  {parameterLabels[paramKey].label}
                </span>
                <InfoIconButton
                  size={13}
                  onClick={() => openSpecificEvaluationParameterInfoModal(paramKey)}
                  className="text-emerald-600 hover:text-emerald-800 transition-colors"
                />
              </Label>

              <NumberField.Group className="flex items-center gap-1">
                <NumberField.DecrementButton className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors text-lg select-none" />
                <NumberField.Input
                  onChange={(e) => {
                    let value = e.target.value;
                    if (value.length > 1 && value.startsWith('0')) {
                      value = value.replace(/^0+/, '') || '0';
                    }
                    const num = parseInt(value, 10);
                    if (!isNaN(num) && num > 100) {
                      e.target.value = '100';
                      field.onChange(100);
                      // Do NOT persist here — rely on LandingPage debounced autosave.
                    } else {
                      e.target.value = value;
                      field.onChange(isNaN(num) ? 0 : num);
                      // Do NOT persist here — rely on LandingPage debounced autosave.
                    }
                  }}
                  onBlur={() => {
                    try {
                      const values = getValues();
                      saveSession({
                        inputs: {
                          businessProblem: values.businessProblem || '',
                          businessSolution: values.businessSolution || '',
                          parameters: values.parameters || {},
                        },
                      });
                    } catch (_) {
                      /* ignore */
                    }
                  }}
                  className="w-14 text-center text-2xl font-bold text-slate-800 bg-transparent focus:outline-none"
                />
                <NumberField.IncrementButton className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors text-lg select-none" />
              </NumberField.Group>
            </NumberField>

            {scaleMarkers && (
              <div className="flex flex-col items-center gap-1">
                {scaleMarkers.map((marker, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      'px-2.5 py-0.5 text-[11px] font-medium rounded-md w-fit',
                      SCALE_COLORS[idx],
                    )}
                  >
                    {marker.score}–{Math.min(marker.score + 10, 100)}: {marker.label}
                  </span>
                ))}
              </div>
            )}

            {guidance?.examples?.[0] && (
              <p className="text-[11px] italic text-slate-400 text-center leading-relaxed px-2">
                Example: {guidance.examples[0].case} = {guidance.examples[0].score}
                {guidance.examples[0].reason && ` (${guidance.examples[0].reason})`}
              </p>
            )}
          </div>
        )}
      />
    </div>
  );
});

ParameterBox.displayName = 'ParameterBox';
ParameterBox.propTypes = {
  paramKey: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
};

// ─── ParameterInputContainer ──────────────────────────────────────────────────
export default function ParameterInputContainer({ loading }) {
  const groupEntries = Object.entries(parameterGroups);

  return (
    <div className="w-full">
      <Accordion className="w-full" variant="default" allowsMultipleExpanded>
        {groupEntries.map(([groupName, group], groupIdx) => {
          const cfg = GROUP_CONFIG[groupName] ?? DEFAULT_CONFIG;
          const { Icon } = cfg;

          return (
            <Accordion.Item
              key={groupIdx}
              className={cn('group/item', groupIdx > 0 && 'border-t border-slate-200/70')}
            >
              <Accordion.Heading>
                {/*
                  Child triggers are visually lighter than the parent:
                  - icon is h-5 w-5 (vs parent's h-6 w-6)
                  - title is text-[15px] font-semibold (vs parent's text-lg font-bold)
                  - subtitle is text-xs (vs parent's text-sm)
                  - py-3 stays the same — tight and compact
                */}
                <Accordion.Trigger className="hover:bg-slate-50/80 group flex items-center gap-3 px-5 py-3 transition-colors duration-200">
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0',
                      cfg.iconCn,
                      'transition-[scale,rotate] duration-300 ease-out',
                      'group-hover/item:scale-[1.2] group-hover/item:-rotate-[10deg] group-hover/item:drop-shadow-md mr-1.5',
                    )}
                    strokeWidth={1.75}
                  />

                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="font-semibold text-[16px] leading-5 text-slate-700">
                      {groupName}
                    </span>
                    <span className="text-xs font-normal leading-4 text-slate-400">
                      {cfg.subtitle}
                    </span>
                  </div>

                  <Accordion.Indicator className="text-slate-300 [&>svg]:size-4">
                    <ChevronDown />
                  </Accordion.Indicator>
                </Accordion.Trigger>
              </Accordion.Heading>

              <Accordion.Panel>
                <Accordion.Body className="px-2 pt-1 pb-6 bg-transparent">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-0">
                    {group.map((key, idx) => (
                      <React.Fragment key={idx}>
                        <div className="flex-1 flex flex-col items-center py-1 px-2">
                          <ParameterBox paramKey={key} loading={loading} />
                        </div>
                        {idx < group.length - 1 && (
                          <>
                            <div className="md:hidden h-px w-full bg-slate-200/60" />
                            <div className="hidden md:block w-px self-stretch bg-slate-200/60 my-2" />
                          </>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
    </div>
  );
}

ParameterInputContainer.propTypes = {
  loading: PropTypes.bool.isRequired,
};
