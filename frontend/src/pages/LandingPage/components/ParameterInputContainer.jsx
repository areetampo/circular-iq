import React from 'react';
import PropTypes from 'prop-types';
import { useFormContext, Controller } from 'react-hook-form';
import { useGlobalModal } from '@/contexts/ModalContext';
import { useSession } from '@/features/session/hooks/useSession';
import { parameterLabels, parameterGroups, parameterGuidance } from '@/constants/evaluationData';
import { Label, NumberField, Accordion, cn } from '@heroui/react';
import InfoIconButton from '@/components/common/InfoIconButton';
import { ChevronDown, Share2, Gem, Zap } from 'lucide-react';

// ─── Group config ─────────────────────────────────────────────────────────────
// Icon sits in a soft rounded square, exactly like the HeroUI custom styles
// pattern — but using appropriate lucide icons instead of 3D pngs.
// Share2   → "Access Value"    (connections radiating outward = reach/access)
// Gem      → "Embedded Value"  (intrinsic worth locked inside)
// Zap      → "Processing Value" (energy, transformation, throughput)
const GROUP_CONFIG = {
  'Access Value': {
    Icon: Share2,
    iconWrapCn: 'bg-violet-100 text-violet-600',
    subtitle: 'Reach and participation across stakeholders',
  },
  'Embedded Value': {
    Icon: Gem,
    iconWrapCn: 'bg-emerald-100 text-emerald-600',
    subtitle: 'Intrinsic worth retained within the system',
  },
  'Processing Value': {
    Icon: Zap,
    iconWrapCn: 'bg-amber-100 text-amber-600',
    subtitle: 'Efficiency and safety of circular processes',
  },
};

const DEFAULT_GROUP_CONFIG = {
  Icon: Gem,
  iconWrapCn: 'bg-slate-100 text-slate-500',
  subtitle: '',
};

// Scale badge colour per tier (low → mid → high)
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
    <div className="w-full flex flex-col items-center gap-3">
      <Controller
        name={`parameters.${paramKey}`}
        control={control}
        render={({ field }) => (
          <div className="w-full flex flex-col items-center gap-3">
            <NumberField
              className="w-full max-w-[190px] flex flex-col items-center"
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
              {/* Label row */}
              <Label className="mb-2 flex items-center justify-center gap-1.5 cursor-default">
                <span className="font-semibold text-sm text-slate-700">
                  {parameterLabels[paramKey].label}
                </span>
                <InfoIconButton
                  size={14}
                  onClick={() => openSpecificEvaluationParameterInfoModal(paramKey)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                />
              </Label>

              {/* +/- stepper */}
              <NumberField.Group className="flex items-center rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <NumberField.DecrementButton className="px-3 py-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors text-sm select-none" />
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
                  className="w-12 text-center text-base font-bold text-emerald-600 border-x border-slate-200 bg-white py-2 focus:outline-none"
                />
                <NumberField.IncrementButton className="px-3 py-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors text-sm select-none" />
              </NumberField.Group>
            </NumberField>

            {/* Scale badges */}
            {scaleMarkers && (
              <div className="flex flex-col items-center gap-1">
                {scaleMarkers.map((marker, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      'px-2 py-0.5 text-[11px] font-medium rounded-md',
                      SCALE_COLORS[idx],
                    )}
                  >
                    {marker.score}–{Math.min(marker.score + 10, 100)}: {marker.label}
                  </span>
                ))}
              </div>
            )}

            {/* Calibration example */}
            {guidance?.examples?.[0] && (
              <p className="text-[11px] italic text-slate-400 text-center leading-relaxed px-1">
                e.g. {guidance.examples[0].case} = {guidance.examples[0].score}
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
    // bg-surface-secondary + rounded-2xl is exactly what the HeroUI CustomStyles wrapper uses
    <Accordion
      className="bg-surface-secondary w-full rounded-2xl"
      variant="default"
      allowsMultipleExpanded
    >
      {groupEntries.map(([groupName, group], groupIdx) => {
        const cfg = GROUP_CONFIG[groupName] ?? DEFAULT_GROUP_CONFIG;
        const { Icon } = cfg;
        const isLast = groupIdx === groupEntries.length - 1;

        return (
          <Accordion.Item
            key={groupIdx}
            className={cn(
              'group/item',
              // Mirror the exact selector pattern from the guide
              'first:[&_[data-slot=accordion-trigger]]:rounded-t-2xl',
              isLast &&
                "[&:not(:has([data-slot=accordion-trigger][aria-expanded='true']))_[data-slot=accordion-trigger]]:rounded-b-2xl",
            )}
          >
            <Accordion.Heading>
              {/* Trigger mirrors the CustomStyles pattern exactly:
                  icon-container | title + subtitle | indicator */}
              <Accordion.Trigger className="hover:bg-surface-tertiary group flex items-center gap-3 px-4 py-3.5">
                {/* Icon in a soft rounded square — animates on hover like the guide's img */}
                <span
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                    'transition-[transform,filter] duration-300 ease-out',
                    'group-hover/item:scale-110 group-hover/item:-rotate-6 group-hover/item:drop-shadow-md',
                    cfg.iconWrapCn,
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>

                {/* Text block */}
                <div className="flex flex-col gap-0 text-left">
                  <span className="font-semibold text-[15px] leading-5 text-slate-800">
                    {groupName}
                  </span>
                  <span className="text-muted/80 text-xs font-normal leading-5">
                    {cfg.subtitle}
                  </span>
                </div>

                {/* Chevron — muted, small, just like the guide */}
                <Accordion.Indicator className="text-muted/50 [&>svg]:size-4">
                  <ChevronDown />
                </Accordion.Indicator>
              </Accordion.Trigger>
            </Accordion.Heading>

            <Accordion.Panel>
              <Accordion.Body className="flex flex-col gap-6 pt-2 pb-5 md:flex-row md:items-start md:gap-0">
                {group.map((key, idx) => (
                  <React.Fragment key={idx}>
                    <div className="flex-1 flex flex-col items-center py-2 px-3">
                      <ParameterBox paramKey={key} loading={loading} />
                    </div>
                    {/* Hairline dividers between parameters */}
                    {idx < group.length - 1 && (
                      <>
                        <div className="md:hidden h-px w-full bg-slate-100" />
                        <div className="hidden md:block w-px self-stretch bg-slate-100 my-2" />
                      </>
                    )}
                  </React.Fragment>
                ))}
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}

ParameterInputContainer.propTypes = {
  loading: PropTypes.bool.isRequired,
};
