import React from 'react';
import PropTypes from 'prop-types';
import { useFormContext, Controller } from 'react-hook-form';
import { useGlobalModal } from '@/contexts/ModalContext';
import { useSession } from '@/features/session/hooks/useSession';
import { parameterLabels, parameterGroups, parameterGuidance } from '@/constants/evaluationData';
import { Card, Label, NumberField, Accordion } from '@heroui/react';
import InfoIconButton from '@/components/common/InfoIconButton';
import { FileBox, ChevronDown } from 'lucide-react';

/**
 * Memoized Parameter Row Component
 * Only re-renders when its specific parameter value changes
 */
const ParameterBox = React.memo(({ paramKey, loading }) => {
  const { control, getValues } = useFormContext();
  const { openSpecificEvaluationParameterInfoModal } = useGlobalModal();
  const { saveSession } = useSession();

  // Calculate scale markers only for this parameter
  const getScaleMarkers = React.useMemo(() => {
    const guidance = parameterGuidance[paramKey];
    if (!guidance || !guidance.scale) return null;
    return guidance.scale.filter((_, i) => i % 2 === 0).slice(0, 3);
  }, [paramKey]);

  const guidance = React.useMemo(() => parameterGuidance[paramKey], [paramKey]);

  // Get color classes based on scale position
  const getScaleColorClass = (idx) => {
    if (idx === 0) return 'text-red-600 bg-red-50';
    if (idx === 1) return 'text-yellow-700 bg-yellow-50';
    return 'bg-emerald-50 text-emerald-700';
  };

  return (
    <div className="px-0 mt-2 transition-shadow rounded-lg w-full flex flex-col items-center justify-center">
      <Controller
        name={`parameters.${paramKey}`}
        control={control}
        render={({ field }) => (
          <div className="space-y-4 text-center w-full">
            {/* Number Input */}
            <div className="flex items-center justify-center w-full">
              <NumberField
                className="w-full max-w-xs flex items-center justify-center"
                minValue={0}
                maxValue={100}
                step={1}
                name={paramKey}
                id={paramKey}
                value={field.value ?? 0}
                onChange={(value) => {
                  // Simple handler for increment/decrement buttons
                  const numValue = Math.min(Math.max(Number(value) || 0, 0), 100);
                  field.onChange(numValue);
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
                {/* Header with Label */}
                <Label className="mb-4 text-center flex flex-row items-center justify-center gap-2 bg-emerald-100 rounded-full w-fit px-4 py-2 mx-auto">
                  <span className="font-bold text-green-700 text-md">
                    {parameterLabels[paramKey].label}
                  </span>
                  <InfoIconButton
                    size={20}
                    onClick={() => openSpecificEvaluationParameterInfoModal(paramKey)}
                  />
                </Label>
                <NumberField.Group className="bg-white/90 shadow-sm">
                  <NumberField.DecrementButton className="hover:bg-emerald-50 transition-colors" />
                  <NumberField.Input
                    onChange={(e) => {
                      let value = e.target.value;

                      // Remove leading zeros
                      if (value.length > 1 && value.startsWith('0')) {
                        value = value.replace(/^0+/, '') || '0';
                      }

                      // Cap at 100
                      let numValue = parseInt(value, 10);
                      if (!isNaN(numValue) && numValue > 100) {
                        e.target.value = '100';
                        field.onChange(100);

                        // Do NOT persist here — rely on LandingPage debounced autosave to persist parameters.
                      } else {
                        e.target.value = value;
                        const valToSet = isNaN(numValue) ? 0 : numValue;
                        field.onChange(valToSet);
                        // Do NOT persist here — rely on LandingPage debounced autosave to persist parameters.
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
                      } catch (err) {
                        /* ignore */
                      }
                    }}
                    className="w-16 text-base font-semibold text-center text-emerald-600"
                  />
                  <NumberField.IncrementButton className="hover:bg-emerald-50 transition-colors" />
                </NumberField.Group>
              </NumberField>
            </div>

            {/* Scale Guide Badges */}
            {getScaleMarkers && (
              <div className="flex flex-col items-center justify-center gap-1">
                {getScaleMarkers.map((marker, idx) => {
                  const endScore = Math.min(marker.score + 10, 100);
                  return (
                    <span
                      key={idx}
                      className={`px-2 py-1 text-xs font-medium rounded w-fit ${getScaleColorClass(idx)}`}
                    >
                      {marker.score}-{endScore}: {marker.label}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Example Calibration */}
            {guidance && guidance.examples && guidance.examples[0] && (
              <p className="text-xs italic leading-relaxed text-slate-600">
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

/**
 * Main Parameter Input Container Component
 */
export default function ParameterInputContainer({ loading }) {
  return (
    <div className="border-2 rounded-3xl shadow-sm bg-linear-to-br from-emerald-50/60 via-teal-50/70 to-cyan-50/60 border-emerald-500 p-0 w-full">
      <Accordion className="w-full" variant="default" allowsMultipleExpanded={true}>
        {Object.entries(parameterGroups).map(([groupName, group], groupIdx) => (
          <Accordion.Item key={groupIdx}>
            <Accordion.Heading>
              <Accordion.Trigger>
                <h3 className="text-xl font-extrabold text-center text-teal-600 ml-1">
                  {groupName}
                </h3>
                <Accordion.Indicator>
                  <ChevronDown />
                </Accordion.Indicator>
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel
              style={
                {
                  // paddingInline: '0rem !important',
                }
              }
            >
              <Accordion.Body className="flex flex-col gap-6 md:gap-4 md:flex-row md:items-stretch">
                {group.map((key, index) => (
                  <React.Fragment key={index}>
                    <div className="flex-1">
                      <ParameterBox paramKey={key} loading={loading} />
                    </div>
                  </React.Fragment>
                ))}
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
}

ParameterInputContainer.propTypes = {
  loading: PropTypes.bool.isRequired,
};
