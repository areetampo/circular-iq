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
                  className={cn(
                    'mb-2 flex items-center gap-1.5 rounded-full px-3 py-1 w-fit mx-auto shadow-sm',
                    'cursor-pointer select-none touch-none will-change-transform',
                    'transition-all duration-150 ease-out',
                    'hover:scale-103',
                    'active:scale-100',
                    (() => {
                      const cfg =
                        GROUP_STYLE_CONFIG[Object.keys(parameterGroups)[paramGroupIdx]] ??
                        DEFAULT_CONFIG;
                      return cn(cfg.paramBg, cfg.paramTextColor);
                    })(),
                  )}
                  onClick={() => openSpecificEvaluationParameterInfoDrawer(paramKey)}
                >
                  <span className="font-semibold text-sm whitespace-nowrap">
                    {parameterLabels[paramKey].label}
                  </span>
                  <BadgeInfo className="info-icon" size={20} />
                </Label>

                <NumberField.Group
                  className="flex items-center gap-1 h-8 my-0.5"
                  style={{ '--field-focus': '#4b5563' }}
                >
                  <NumberField.DecrementButton className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors text-lg select-none" />
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
                    onBlur={() => {
                      try {
                        const values = getValues();
                        saveSession({
                          inputs: {
                            businessProblem: values.businessProblem || '',
                            businessSolution: values.businessSolution || '',
                            evaluationParameters: values.evaluationParameters || {},
                            businessContext: values.businessContext || {},
                          },
                        });
                      } catch (e) {
                        /* ignore */
                      }
                    }}
                    className="w-17 text-center text-2xl font-bold text-slate-800 bg-transparent focus:outline-none"
                  />
                  <NumberField.IncrementButton className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors text-lg select-none" />
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
                        'cursor-pointer flex-1 p-2.5 rounded-lg border-2 text-left transition-all duration-150',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                        isSelected ? 'shadow-sm opacity-80' : 'bg-white opacity-60',
                        tierClass,
                        loading && 'opacity-50 cursor-not-allowed',
                      )}
                    >
                      <div className="text-xs font-bold leading-tight mb-1">
                        {option.label}
                        &nbsp;
                        <span className={cn('tabular-nums')}>(~{option.score})</span>
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
                <p className="text-[11px] italic text-slate-400 text-center leading-relaxed px-2">
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
ParameterBox.propTypes = {
  paramGroupIdx: PropTypes.number.isRequired,
  paramKey: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default function EvaluationParametersContainer({
  loading,
  innerExpandedKeys,
  onInnerExpandedChange,
}) {
  const groupEntries = Object.entries(parameterGroups);

  return (
    <div className="w-full">
      <Accordion
        className="w-full"
        variant="default"
        allowsMultipleExpanded
        defaultExpandedKeys={innerExpandedKeys}
        expandedKeys={innerExpandedKeys}
        onExpandedChange={onInnerExpandedChange}
      >
        {groupEntries.map(([groupName, group], groupIdx) => {
          const cfg = GROUP_STYLE_CONFIG[groupName] ?? DEFAULT_CONFIG;

          return (
            <Accordion.Item
              key={groupIdx}
              id={groupName}
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
                  <cfg.Icon
                    className={cn(
                      cfg.iconColor,
                      'h-5 w-5 shrink-0',
                      'transition-[scale,rotate] duration-300 ease-out',
                      'group-hover/item:scale-[1.2] group-hover/item:-rotate-10 group-hover/item:drop-shadow-md mr-1.5',
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
                          <ParameterBox paramGroupIdx={groupIdx} paramKey={key} loading={loading} />
                        </div>
                        {idx < group.length - 1 && (
                          <div className="flex justify-center items-center">
                            <div className="hidden md:block w-px self-stretch bg-slate-200/60 my-2" />
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

EvaluationParametersContainer.propTypes = {
  loading: PropTypes.bool.isRequired,
  innerExpandedKeys: PropTypes.instanceOf(Set),
  onInnerExpandedChange: PropTypes.func,
};
