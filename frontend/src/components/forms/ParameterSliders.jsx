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
    <div className="parameters-grid">
      {Object.entries(parameterGroups).map(([groupName, keys]) => (
        <div key={groupName} className="parameter-group">
          <h3 className="parameter-group-title">{groupName}</h3>
          {keys.map((key) => {
            const scaleMarkers = getScaleMarkers(key);
            const guidance = parameterGuidance[key];

            return (
              <div key={key} className="parameter-item">
                <div className="parameter-label-row">
                  <div className="flex items-center gap-2">
                    <label htmlFor={key}>{parameterLabels[key].label}</label>
                    {onShowInfo && (
                      <InfoIconButton
                        onClick={() => onShowInfo(key)}
                        title={`Learn about ${parameterLabels[key].label}`}
                        size={16}
                      />
                    )}
                  </div>
                  <span className="parameter-value">{parameters[key]}</span>
                </div>

                {/* Scale Guide */}
                {scaleMarkers && (
                  <div className="parameter-scale-guide">
                    {scaleMarkers.map((marker, idx) => {
                      const endScore = Math.min(marker.score + 10, 100);
                      return (
                        <span key={idx} className={`scale-marker scale-${idx}`}>
                          {marker.score}-{endScore}: {marker.label}
                        </span>
                      );
                    })}
                  </div>
                )}

                <input
                  type="range"
                  id={key}
                  min="0"
                  max="100"
                  value={parameters[key]}
                  onChange={(e) => onParameterChange(key, e.target.value)}
                  className="parameter-slider"
                  disabled={loading}
                />

                {/* Example Calibration */}
                {guidance && guidance.examples && guidance.examples[0] && (
                  <p className="parameter-example">
                    Example: {guidance.examples[0].case} = {guidance.examples[0].score}
                    {guidance.examples[0].reason && ` (${guidance.examples[0].reason})`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
