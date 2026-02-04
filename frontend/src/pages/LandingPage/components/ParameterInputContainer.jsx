import React from 'react';
import PropTypes from 'prop-types';
import { useFormContext, Controller } from 'react-hook-form';
import useLandingModals from '@/pages/LandingPage/hooks/useLandingModals';
import { parameterLabels, parameterGroups, parameterGuidance } from '@/constants/evaluationData';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import LandingModalManager from '@/components/modals/landing/LandingModalManager';
import InfoIconButton from '@/components/common/InfoIconButton';

/**
 * Memoized Parameter Row Component
 * Only re-renders when its specific parameter value changes
 */
const ParameterRow = React.memo(({ paramKey, loading }) => {
  const { control } = useFormContext();
  const { modal, isModalOpen, onClose, openParameterInfo } = useLandingModals();

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
    <div className="px-0 mt-2 transition-shadow rounded-lg">
      {/* Header with Label */}
      <div className="mb-5 text-center">
        <Label
          htmlFor={paramKey}
          className="px-4 py-1.5 mb-3 font-bold text-green-700 rounded-full text-md bg-emerald-100"
        >
          {parameterLabels[paramKey].label}
        </Label>
      </div>

      <Controller
        name={`parameters.${paramKey}`}
        control={control}
        render={({ field }) => (
          <div className="space-y-4 text-center">
            {/* Number Input and Info Icon */}
            <div className="flex items-center justify-center gap-3">
              <InfoIconButton size={20} onClick={() => openParameterInfo(paramKey)} />
              <Input
                type="number"
                id={paramKey}
                min={0}
                max={100}
                step={1}
                value={field.value ?? 0}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val === '') {
                    field.onChange(0);
                    return;
                  }
                  const numVal = Math.min(100, Math.max(0, Number(val)));
                  field.onChange(numVal);
                }}
                onInput={(e) => {
                  // Remove leading zeros
                  if (e.target.value.length > 1 && e.target.value.startsWith('0')) {
                    e.target.value = e.target.value.replace(/^0+/, '') || '0';
                  }
                }}
                className="w-20 px-2 text-base font-semibold text-center border-2 text-emerald-600 border-emerald-500"
                disabled={loading}
              />
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

      <LandingModalManager modal={modal} isModalOpen={isModalOpen} onClose={onClose} />
    </div>
  );
});

ParameterRow.displayName = 'ParameterRow';

ParameterRow.propTypes = {
  paramKey: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
};

/**
 * Main Parameter Input Container Component
 */
export default function ParameterInputContainer({ loading }) {
  return (
    <Card className="border-2 shadow-sm bg-gradient-to-br from-emerald-50/60 via-teal-50/70 to-cyan-50/60 border-emerald-500">
      <CardContent className="pt-6 space-y-12">
        {Object.entries(parameterGroups).map(([groupName, group], groupIdx) => (
          <div key={groupName} className="space-y-4">
            <h3 className="text-xl font-extrabold text-center text-teal-600">{groupName}</h3>
            <Separator orientation="horizontal" className="bg-teal-900 h-0.5 w-auto" />
            <div className="flex flex-col gap-6 md:flex-row md:items-stretch">
              {group.map((key, index) => (
                <React.Fragment key={key}>
                  {/* 1. The Wrapper for the content */}
                  <div className="flex-1">
                    <ParameterRow paramKey={key} loading={loading} />
                  </div>

                  {/* 2. The Separator as a direct sibling of the flex-1 div */}
                  {/* {index < group.length - 1 && (
                    <Separator
                      orientation="vertical"
                      className="self-stretch hidden md:block bg-border/70"
                    />
                  )} */}

                  {/* 3. Mobile Separator (Optional: Horizontal for mobile) */}
                  {/* {index < group.length - 1 && (
                    <Separator orientation="horizontal" className="block md:hidden bg-border/70" />
                  )} */}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

ParameterInputContainer.propTypes = {
  loading: PropTypes.bool.isRequired,
};
