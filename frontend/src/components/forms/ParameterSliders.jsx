import React from 'react';
import PropTypes from 'prop-types';
import {
  parameterLabels,
  parameterGroups,
  parameterGuidance,
} from '../../constants/evaluationData';
import InfoIconButton from '../shared/InfoIconButton';

export default function ParameterSliders({ parameters, onParameterChange, loading, onShowInfo }) {
  const getScaleMarkers = (key) => {
    const guidance = parameterGuidance[key];
    if (!guidance || !guidance.scale) return null;

    // Return simplified scale with 3 key points
    return guidance.scale.filter((_, i) => i % 2 === 0).slice(0, 3);
  };

  return (
    <div className="flex flex-col gap-8 p-6 mt-6 border bg-slate-50 rounded-xl border-slate-300">
      {Object.entries(parameterGroups).map(([groupName, keys]) => (
        <div key={groupName} className="flex flex-col gap-4">
          <h3 className="pb-2 m-0 text-lg font-semibold border-b-2 text-slate-800 border-slate-300">
            {groupName}
          </h3>
          <div className="flex">
            {keys.map((key, index) => {
              const scaleMarkers = getScaleMarkers(key);
              const guidance = parameterGuidance[key];

              return (
                <div key={key} className="relative flex flex-col flex-1 gap-2 px-4 py-2">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2">
                      {onShowInfo && (
                        <InfoIconButton
                          onClick={() => onShowInfo(key)}
                          title={`Learn about ${parameterLabels[key].label}`}
                          size={16}
                        />
                      )}
                      <label htmlFor={key}>{parameterLabels[key].label}</label>
                    </div>
                    <input
                      type="number"
                      id={key}
                      min={0}
                      max={100}
                      step={1}
                      value={parameters[key] ?? 0}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (val === '') {
                          onParameterChange(key, 0);
                          return;
                        }
                        const numVal = Math.min(100, Math.max(0, Number(val)));
                        onParameterChange(key, numVal);
                      }}
                      onInput={(e) => {
                        // Remove leading zeros
                        if (e.target.value.length > 1 && e.target.value.startsWith('0')) {
                          e.target.value = e.target.value.replace(/^0+/, '') || '0';
                        }
                      }}
                      className="px-2 py-1 text-base font-semibold border-2 rounded-md border-lime-600 text-emerald-600 min-w-max"
                      disabled={loading}
                    />
                  </div>

                  {/* Scale Guide */}
                  {scaleMarkers && (
                    <div className="flex flex-col gap-1 my-2 text-xs">
                      {scaleMarkers.map((marker, idx) => {
                        const endScore = Math.min(marker.score + 10, 100);
                        return (
                          <span
                            key={idx}
                            className={`px-2 py-1 font-medium rounded ${idx === 0 ? 'text-red-600 bg-red-50' : idx === 1 ? 'text-yellow-700 bg-yellow-50' : idx === 2 ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 bg-slate-100'}`}
                          >
                            {marker.score}-{endScore}: {marker.label}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Example Calibration */}
                  {guidance && guidance.examples && guidance.examples[0] && (
                    <p className="mt-2 text-xs italic leading-relaxed text-slate-600">
                      Example: {guidance.examples[0].case} = {guidance.examples[0].score}
                      {guidance.examples[0].reason && ` (${guidance.examples[0].reason})`}
                    </p>
                  )}

                  {/* separation lines */}
                  {/* {index < keys.length - 1 && (
                    <div className="absolute right-0 w-[0.3px] top-32 bottom-32 bg-black rounded-l-full" />
                  )}
                  {index > 0 && (
                    <div className="absolute left-0 w-[0.3px] top-32 bottom-32 bg-black rounded-r-full" />
                  )} */}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

ParameterSliders.propTypes = {
  parameters: PropTypes.object.isRequired,
  onParameterChange: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  onShowInfo: PropTypes.func,
};

ParameterSliders.defaultProps = {
  onShowInfo: null,
};
