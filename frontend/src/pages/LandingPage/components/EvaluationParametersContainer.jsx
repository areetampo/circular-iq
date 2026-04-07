import { Accordion, cn, Label, NumberField, Separator } from '@heroui/react';
import { motion } from 'framer-motion';
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
    <div className="flex w-full flex-col items-center gap-2.5">
      <Controller
        name={`evaluationParameters.${paramKey}`}
        control={control}
        render={({ field }) => {
          const currentValue = field.value ?? 50;

          // Find the closest selected card (within 8 points of a scale score)
          const selectedScore =
            scale.find((s) => Math.abs(s.score - currentValue) <= 8)?.score ?? null;

          return (
            <div className="flex w-full flex-col items-center gap-2.5">
              <NumberField
                className="flex w-full flex-col items-center"
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
                    'inline-flex items-center gap-2 rounded-lg px-3 py-1.5',
                    `cursor-pointer transition-opacity duration-150 hover:opacity-80`,
                    'text-[0.68rem] font-bold tracking-[0.08rem] uppercase',
                    (() => {
                      const cfg =
                        GROUP_STYLE_CONFIG[Object.keys(parameterGroups)[paramGroupIdx]] ??
                        DEFAULT_CONFIG;
                      return cn(cfg.paramBg, cfg.paramTextColor);
                    })(),
                  )}
                  onClick={() => openSpecificEvaluationParameterInfoDrawer(paramKey)}
                  aria-label={`View details drawer for ${parameterLabels[paramKey].label}`}
                >
                  {parameterLabels[paramKey].label}
                  <BadgeInfo className="info-icon mt-0.5 shrink-0" size={16} strokeWidth={1.8} />
                </Label>

                <NumberField.Group className="my-0.5 flex h-8 items-center gap-1">
                  <NumberField.DecrementButton
                    className="flex size-8 items-center justify-center rounded-sm text-base text-(--color-text-muted) transition-colors duration-100 select-none"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--color-accent-light)')
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
                    className="w-20 rounded-md border border-(--color-border-strong) bg-[rgba(245,240,232,0.5)] text-center font-mono text-[18px] font-semibold text-(--color-text-primary) transition-colors outline-none focus:outline-none"
                  />
                  <NumberField.IncrementButton
                    className="flex size-8 items-center justify-center rounded-sm text-base text-(--color-text-muted) transition-colors duration-100 select-none"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--color-accent-light)')
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
                        `w-full cursor-pointer rounded-lg p-3 text-left transition-all duration-150`,
                        'focus:outline-none',
                        tierClass,
                        loading && 'cursor-not-allowed opacity-40',
                      )}
                    >
                      <div className="mb-0.5 font-mono text-xs/tight font-semibold">
                        {option.label}
                        <span className="ml-1 tabular-nums opacity-70">(~{option.score})</span>
                      </div>
                      <div className="font-mono text-[0.65rem] leading-snug font-medium opacity-75">
                        {option.description}
                      </div>
                    </button>
                  );
                })}
              </div>

              {guidance?.examples?.[0] && (
                <p className="mt-1 px-2 text-center font-mono text-[0.6rem] leading-relaxed text-(--color-text-muted) italic">
                  e.g. {guidance.examples[0].case} ≈ {guidance.examples[0].score}
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
  const { openEvaluationParametersHeadingInfoDrawer } = useGlobalDrawer();
  const groupEntries = Object.entries(parameterGroups);

  return (
    <div className="w-full">
      <Accordion
        className="w-full"
        variant="default"
        allowsMultipleExpanded
        expandedKeys={evalParamsExpandedKeys}
        onExpandedChange={setEvalParamsExpandedKeys}
      >
        {groupEntries.map(([groupName, group], groupIdx) => {
          const cfg = GROUP_STYLE_CONFIG[groupName] ?? DEFAULT_CONFIG;

          return (
            <Accordion.Item
              key={groupIdx}
              id={groupName}
              className={cn('group/item', groupIdx > 0 && `border-t border-border`)}
            >
              <Accordion.Heading>
                <Accordion.Trigger className="flex items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-accent-soft">
                  <cfg.Icon
                    className={cn(
                      cfg.iconColor,
                      'mr-1.5 size-5 shrink-0',
                      'transition-[scale,rotate] duration-300 ease-out',
                      'group-hover/item:scale-[1.2]',
                      'group-hover/item:-rotate-10',
                      'group-hover/item:drop-shadow-md',
                    )}
                    strokeWidth={2}
                  />

                  <div className="flex flex-1 flex-col gap-0.5 text-left">
                    <span className="font-mono text-[0.85rem]/6 font-medium tracking-[-0.01em] text-(--color-text-primary)">
                      {groupName}
                    </span>
                    <span className="font-mono text-[0.68rem]/4 font-normal text-(--color-text-muted)">
                      {cfg.subtitle}
                    </span>
                  </div>
                  <Accordion.Indicator className="text-(--color-text-muted) [&>svg]:size-4">
                    <ChevronDown />
                  </Accordion.Indicator>
                </Accordion.Trigger>
              </Accordion.Heading>

              <Accordion.Panel>
                <Accordion.Body className="bg-transparent px-2 pt-1 pb-6">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="flex flex-col gap-4 md:flex-row md:items-start md:gap-0"
                  >
                    {group.map((key, idx) => (
                      <React.Fragment key={idx}>
                        <div className="flex flex-1 flex-col items-center px-2 py-1">
                          <ParameterBox paramGroupIdx={groupIdx} paramKey={key} loading={loading} />
                        </div>
                        {idx < group.length - 1 && (
                          <div className="flex items-center justify-center">
                            <div className="my-2 hidden w-px self-stretch bg-border md:block" />
                            <Separator orientation="horizontal" className="w-5/6 md:hidden" />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </motion.div>
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
