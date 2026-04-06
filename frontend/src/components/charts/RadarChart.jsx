import { RadarChart } from '@mui/x-charts/RadarChart';
import PropTypes from 'prop-types';

const FONT_FAMILY =
  'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace';

function RadarChartComponent({
  data,
  radarConfigs,
  height = 400,
  showLegend = true,
  showTooltip = true,
  isLoading = false,
  responsive = true,
  className,
  colors,
  interactive = true,
  animationDuration = 300,
}) {
  // Early return for invalid data
  if (
    !data ||
    !Array.isArray(data) ||
    data.length === 0 ||
    !radarConfigs ||
    !Array.isArray(radarConfigs) ||
    radarConfigs.length === 0
  ) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#374151',
          fontSize: '0.875rem',
          fontFamily: FONT_FAMILY,
        }}
      >
        No data available
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Transform data for MUI X Charts
  const metrics = data.map((item) => item.subject || item.factor || item.name || 'Unknown');

  const series = radarConfigs.map((config, index) => {
    const seriesData = data.map((item) => Number(item[config.dataKey]) || 0);
    return {
      label: config.name,
      data: seriesData,
      color: colors?.[index] || config.stroke || '#1e40af',
      fillArea: config.fillOpacity !== 0,
    };
  });

  const maxValue = Math.max(
    ...radarConfigs.flatMap((config) => data.map((item) => Number(item[config.dataKey]) || 0)),
    100,
  );

  return (
    <div
      className={`w-full ${className || ''}`}
      style={{
        height: height || 400,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div style={{ width: '100%', height: '100%', fontFamily: FONT_FAMILY }}>
        <RadarChart
          height={height || 400}
          series={series}
          radar={{
            metrics: metrics.map((metric) => ({ name: metric, max: maxValue })),
            startAngle: -90,
          }}
          margin={{ top: 60, right: 60, bottom: 60, left: 60 }}
          sx={{
            fontFamily: FONT_FAMILY,
            '& .MuiChartsAxis-root': {
              stroke: '#e5e7eb',
              strokeWidth: 1,
            },
            '& .MuiChartsAxis-label': {
              fill: '#374151',
              fontSize: 12,
              fontWeight: 400,
              fontFamily: FONT_FAMILY,
            },
            '& .MuiChartsLegend-root': {
              fontSize: 12,
              fontWeight: 500,
              fontFamily: FONT_FAMILY,
            },
            '& .MuiChartsLegend-label': {
              fontFamily: FONT_FAMILY,
            },
            '& text': {
              fontFamily: FONT_FAMILY,
            },
          }}
        />
      </div>
    </div>
  );
}

RadarChartComponent.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      subject: PropTypes.string,
      factor: PropTypes.string,
      name: PropTypes.string,
    }),
  ).isRequired,
  radarConfigs: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      dataKey: PropTypes.string.isRequired,
      stroke: PropTypes.string,
      fillOpacity: PropTypes.number,
      strokeWidth: PropTypes.number,
    }),
  ).isRequired,
  height: PropTypes.number,
  showLegend: PropTypes.bool,
  showTooltip: PropTypes.bool,
  isLoading: PropTypes.bool,
  responsive: PropTypes.bool,
  className: PropTypes.string,
  colors: PropTypes.arrayOf(PropTypes.string),
  interactive: PropTypes.bool,
  animationDuration: PropTypes.number,
};

export default RadarChartComponent;
