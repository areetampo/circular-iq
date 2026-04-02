import { Accordion, cn, Label, NumberField, Separator } from '@heroui/react';
import { BadgeInfo, ChevronDown } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import {
  parameterGroups,
  parameterGuidance,
  parameterLabels,
  TIER_CONFIG,
} from '@/constants/evaluationData';
import { DEFAULT_CONFIG, GROUP_STYLE_CONFIG } from '@/constants/groupStyleConfig';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useSession } from '@/features/session/hooks/useSession';

// ─── ParameterBox ─────────────────────────────────────────────────────────────
const ParameterBox = React.memo(({ paramGroupIdx, paramKey, loading }) => {
  const { control, getValues } = useFormContext();
  const { openSpecificEvaluationParameterInfoDrawer } = useGlobalDrawer();
  const { saveSession } = useSession();

  const getTierClass = (score, isSelected) => {
    const tier = TIER_CONFIG.find((t) => score >= t.minScore);
    return tier ? (isSelected ? tier.selected : tier.unselected) : '';
  };

  const guidance = React.useMemo(() => parameterGuidance[paramKey], [paramKey]);
  const scale = guidance?.scale || [];

  return (
    <div className="w-full flex flex-col items-center gap-2.5">
      <Controller
        name={`evaluationParameters.${paramKey}`}
        control={control}
        render={({ field }) => {
          const currentValue = field.value ?? 50;

          // Find the closest selected card (within 8 points of a scale score)
          const selectedScore =
            scale.find((s) => Math.abs(s.score - currentValue) <= 8)?.score ?? null;

          return (
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
                <Label
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent-soft)',
                    color: 'var(--foreground)',
                  }}
                  onClick={() => openSpecificEvaluationParameterInfoDrawer(paramKey)}
                  aria-label={`View details for ${parameterLabels[paramKey].label}`}
                >
                  <span className="font-semibold text-sm whitespace-nowrap">
                    {parameterLabels[paramKey].label}
                  </span>
                  <BadgeInfo className="info-icon" size={16} style={{ color: 'var(--accent)' }} />
                </Label>

                <NumberField.Group
                  className="flex items-center gap-2 h-9 my-1.5"
                  style={{
                    backgroundColor: 'oklch(0.985 0.008 80 / 0.6)',
                    border: '1.5px solid var(--color-border-strong)',
                    borderRadius: '10px',
                    padding: '0 4px',
                  }}
                >
                  <NumberField.DecrementButton
                    className="w-7 h-7 flex items-center justify-center text-base select-none
               rounded-md transition-colors duration-100"
                    style={{ color: 'var(--color-text-muted)' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--color-accent-soft)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    aria-label="Decrease value"
                  />
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
                    onInput={(e) => {
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
                    className="w-14 text-center text-xl font-bold bg-transparent
               focus:outline-none font-mono"
                    style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
                  />
                  <NumberField.IncrementButton
                    className="w-7 h-7 flex items-center justify-center text-base select-none
               rounded-md transition-colors duration-100"
                    style={{ color: 'var(--color-text-muted)' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--color-accent-soft)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    aria-label="Increase value"
                  />
                </NumberField.Group>
              </NumberField>

              {/* Option cards — 5 in a row, wrap on mobile */}
              <div className="flex flex-col gap-2">
                {scale.map((option) => {
                  const isSelected = selectedScore === option.score;
                  // Colour coding by score tier using config
                  const tierClass = getTierClass(option.score, isSelected);

                  return (
                    <button
                      key={option.score}
                      type="button"
                      disabled={loading}
                      onClick={() => field.onChange(option.score)}
                      className={cn(
                        'cursor-pointer flex-1 p-2.5 rounded-lg border text-left transition-all duration-150',
                        'focus:outline-none',
                        isSelected ? 'opacity-90 shadow-sm' : 'opacity-55 hover:opacity-75',
                        tierClass,
                        loading && 'opacity-40 cursor-not-allowed',
                      )}
                    >
                      <div className="text-xs font-bold leading-tight mb-1">
                        {option.label} <span className={cn('tabular-nums')}>(~{option.score})</span>
                      </div>
                      <div className="text-[10px] leading-tight opacity-80">
                        {option.description}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* {scaleMarkers && (
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
              )} */}

              {guidance?.examples?.[0] && (
                <p
                  className="text-[11px] italic text-center leading-relaxed px-2"
                  style={{ color: 'var(--muted)' }}
                >
                  Example: {guidance.examples[0].case} = {guidance.examples[0].score}
                  {guidance.examples[0].reason && ` (${guidance.examples[0].reason})`}
                </p>
              )}
            </div>
          );
        }}
      />
    </div>
  );
});

ParameterBox.displayName = 'ParameterBox';

function EvaluationParametersContainer({
  loading,
  innerExpandedKeys,
  onInnerExpandedChange,
  evalParamsExpandedKeys,
  setEvalParamsExpandedKeys,
}) {
  const groupEntries = Object.entries(parameterGroups);

  return (
    <div className="w-full">
      <Accordion
        className="w-full"
        variant="default"
        allowsMultipleExpanded
        defaultExpandedKeys={evalParamsExpandedKeys}
        expandedKeys={evalParamsExpandedKeys}
        onExpandedChange={setEvalParamsExpandedKeys}
      >
        {groupEntries.map(([groupName, group], groupIdx) => {
          const cfg = GROUP_STYLE_CONFIG[groupName] ?? DEFAULT_CONFIG;

          return (
            <Accordion.Item
              key={groupIdx}
              id={groupName}
              className={cn('group/item', groupIdx > 0 && 'border-t')}
              style={{ borderTopColor: 'var(--border)' }}
            >
              <Accordion.Heading>
                <Accordion.Trigger
                  className="group/grp flex items-center gap-3 px-5 py-3
                              transition-colors duration-150
                              hover:bg-[var(--color-accent-soft)]"
                >
                  <cfg.Icon
                    className={cn(
                      cfg.iconColor,
                      'h-5 w-5 shrink-0 mr-1.5',
                      'transition-[transform,filter] duration-300 ease-out',
                      'group-hover/grp:scale-110 group-hover/grp:-rotate-6 group-hover/grp:drop-shadow-sm',
                    )}
                    strokeWidth={1.75}
                  />

                  <div className="flex flex-col gap-0.5 text-left">
                    <span
                      className="font-semibold text-[15px] leading-5"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {groupName}
                    </span>
                    <span
                      className="text-xs font-normal leading-4"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {cfg.subtitle}
                    </span>
                  </div>
                  <Accordion.Indicator
                    className="[&>svg]:size-4"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
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
                          <ParameterBox paramGroupIdx={groupIdx} paramKey={key} loading={loading} />
                        </div>
                        {idx < group.length - 1 && (
                          <div className="flex justify-center items-center">
                            <div
                              className="hidden md:block w-px self-stretch my-2"
                              style={{ backgroundColor: 'var(--border)' }}
                            />
                            <Separator orientation="horizontal" className="md:hidden w-5/6" />
                          </div>
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

EvaluationParametersContainer.displayName = 'EvaluationParametersContainer';

EvaluationParametersContainer.propTypes = {
  loading: PropTypes.bool,
  innerExpandedKeys: PropTypes.object,
  onInnerExpandedChange: PropTypes.func,
  evalParamsExpandedKeys: PropTypes.object,
  setEvalParamsExpandedKeys: PropTypes.func,
};

export default EvaluationParametersContainer;
