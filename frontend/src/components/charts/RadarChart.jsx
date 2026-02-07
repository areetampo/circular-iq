import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/common/ChartWrapper';
import { cn } from '@/utils/cn';

export default function RadarChart({
  data,
  radarConfigs,
  height,
  showLegend,
  showTooltip,
  isLoading,
}) {
  const chartConfig = useMemo(() => {
    const baseConfig = {
      marketAvg: { label: 'Market Average', color: 'hsl(var(--chart-2))' },
      userValue: { label: 'Your Idea', color: 'hsl(var(--chart-1))' },
    };

    return radarConfigs.reduce((acc, config) => {
      const key = config.dataKey;
      if (!acc[key]) {
        acc[key] = { label: config.name, color: config.stroke };
      }
      return acc;
    }, baseConfig);
  }, [radarConfigs]);

  // Memoize data transformation to prevent expensive re-calculations
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        subject: item.subject || item.factor || item.name || 'Unknown',
      })),
    [data],
  );

  return (
    <ChartContainer
      config={chartConfig}
      className={cn('w-full', isLoading && 'opacity-60')}
      style={{ height: height || 500 }}
    >
      <RechartsRadarChart data={chartData} margin={{ top: 30, right: 80, bottom: 30, left: 80 }}>
        <PolarGrid strokeDasharray="3 3" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{
            fill: '#64748b',
            fontSize: 14,
            fontWeight: 500,
          }}
          tickLine={false}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: '#64748b' }}
          tickCount={5}
        />

        {radarConfigs.map((config, index) => (
          <Radar
            key={index}
            name={config.name}
            dataKey={config.dataKey}
            stroke={`var(--color-${config.dataKey})`}
            fill={`var(--color-${config.dataKey})`}
            fillOpacity={config.fillOpacity || 0.35}
            strokeWidth={config.strokeWidth || 2}
          />
        ))}

        {showLegend && (
          <Legend
            wrapperStyle={{
              paddingTop: '16px',
              fontSize: '12px',
              fontWeight: '600',
            }}
            iconSize={12}
            iconType="square"
          />
        )}

        {showTooltip && (
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        )}
      </RechartsRadarChart>
    </ChartContainer>
  );
}

RadarChart.propTypes = {
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
      stroke: PropTypes.string.isRequired,
      fill: PropTypes.string.isRequired,
      fillOpacity: PropTypes.number,
      strokeWidth: PropTypes.number,
    }),
  ).isRequired,
  height: PropTypes.number,
  showLegend: PropTypes.bool,
  showTooltip: PropTypes.bool,
  isLoading: PropTypes.bool,
};

RadarChart.defaultProps = {
  height: 500,
  showLegend: true,
  showTooltip: true,
  isLoading: false,
};
