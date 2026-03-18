import { Accordion, cn, Label, NumberField, Separator, Switch } from '@heroui/react';
import { BadgeInfo, ChevronDown } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { parameterGroups, parameterGuidance, parameterLabels } from '@/constants/evaluationData';
import { DEFAULT_CONFIG, GROUP_STYLE_CONFIG } from '@/constants/groupStyleConfig';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useSession } from '@/features/session/hooks/useSession';

// ─── GuidedOptionCards ────────────────────────────────────────────────────────
/**
 * Guided option cards for a single parameter.
 * Renders 5 clickable cards from parameterGuidance[paramKey].scale.
 * Selecting a card sets the form value to that card's score.
 * A small fine-tune number input allows further adjustment.
 */
const GuidedOptionCards = React.memo(({ paramKey, loading }) => {
  const { control } = useFormContext();
  const guidance = parameterGuidance[paramKey];
  const scale = guidance?.scale || [];

  return (
    <Controller
      name={`parameters.${paramKey}`}
      control={control}
      render={({ field }) => {
        const currentValue = field.value ?? 50;

        // Find the closest selected card (within 8 points of a scale score)
        const selectedScore =
          scale.find((s) => Math.abs(s.score - currentValue) <= 8)?.score ?? null;

        return (
          <div className="w-full flex flex-col gap-3">
            {/* Factor label */}
            <p className="text-sm font-semibold text-slate-700 text-center">
              {parameterLabels[paramKey]?.label}
            </p>

            {/* Option cards — 5 in a row, wrap on mobile */}
            <div className="flex flex-col sm:flex-row gap-2">
              {scale.map((option) => {
                const isSelected = selectedScore === option.score;
                // Colour coding by score tier
                const tierClass =
                  option.score >= 75
                    ? isSelected
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : 'border-green-200 hover:border-green-400 hover:bg-green-50/50 text-green-700'
                    : option.score >= 50
                      ? isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 text-blue-700'
                      : option.score >= 30
                        ? isSelected
                          ? 'border-amber-500 bg-amber-50 text-amber-800'
                          : 'border-amber-200 hover:border-amber-400 hover:bg-amber-50/50 text-amber-700'
                        : isSelected
                          ? 'border-red-500 bg-red-50 text-red-800'
                          : 'border-red-200 hover:border-red-400 hover:bg-red-50/50 text-red-700';

                return (
                  <button
                    key={option.score}
                    type="button"
                    disabled={loading}
                    onClick={() => field.onChange(option.score)}
                    className={cn(
                      'flex-1 p-2.5 rounded-lg border-2 text-left transition-all duration-150',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                      isSelected ? 'shadow-sm' : 'bg-white',
                      tierClass,
                      loading && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    <div className="text-xs font-bold leading-tight mb-1">{option.label}</div>
                    <div className="text-[10px] leading-tight opacity-80">{option.description}</div>
                    <div
                      className={cn(
                        'text-xs font-bold mt-1.5 tabular-nums',
                        isSelected ? 'opacity-100' : 'opacity-60',
                      )}
                    >
                      ~{option.score}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Fine-tune row */}
            <div className="flex items-center gap-2 justify-center">
              <span className="text-[11px] text-slate-400">Fine-tune:</span>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={currentValue}
                disabled={loading}
                onChange={(e) => {
                  const num = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                  field.onChange(num);
                }}
                className="w-16 text-center text-sm font-bold text-slate-800 border border-slate-300 rounded-md px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
              />
              <span className="text-[11px] text-slate-400">/ 100</span>
            </div>
          </div>
        );
      }}
    />
  );
});

GuidedOptionCards.displayName = 'GuidedOptionCards';
GuidedOptionCards.propTypes = {
  paramKey: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
};

const SCALE_COLORS = [
  'text-red-500 bg-red-50',
  'text-amber-600 bg-amber-50',
  'text-emerald-600 bg-emerald-50',
];

// ─── ParameterBox ─────────────────────────────────────────────────────────────
const ParameterBox = React.memo(({ paramGroupIdx, paramKey, loading }) => {
  const { control, getValues } = useFormContext();
  const { openSpecificEvaluationParameterInfoDrawer } = useGlobalDrawer();
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
              <Label
                className={cn(
                  'mb-2 flex items-center gap-1.5 rounded-full px-3 py-1 w-fit mx-auto cursor-pointer shadow-sm hover:shadow-none transition-all hover:translate-y-px',
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

              <NumberField.Group className="flex items-center gap-1">
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
                          parameters: values.parameters || {},
                          context: values.context || {},
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
  paramGroupIdx: PropTypes.number.isRequired,
  paramKey: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
};

// ─── EvaluationParametersContainer ──────────────────────────────────────────────────
export default function EvaluationParametersContainer({
  loading,
  innerExpandedKeys,
  onInnerExpandedChange,
}) {
  const groupEntries = Object.entries(parameterGroups);
  const [guidedMode, setGuidedMode] = React.useState(true);

  return (
    <div className="w-full">
      {/* ── Mode toggle ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100 bg-slate-50/60">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-700">
            {guidedMode ? 'Guided Mode' : 'Manual Mode'}
          </span>
          <span className="text-[10px] text-slate-400">
            {guidedMode ? 'Select from pre-calibrated options' : 'Enter your own scores (0–100)'}
          </span>
        </div>
        <Switch
          isSelected={guidedMode}
          onChange={setGuidedMode}
          size="sm"
          color="success"
          aria-label="Toggle guided mode"
        />
      </div>
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
                          {guidedMode ? (
                            <GuidedOptionCards paramKey={key} loading={loading} />
                          ) : (
                            <ParameterBox
                              paramGroupIdx={groupIdx}
                              paramKey={key}
                              loading={loading}
                            />
                          )}
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
