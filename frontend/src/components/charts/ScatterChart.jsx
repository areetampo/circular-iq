import React from 'react';
import PropTypes from 'prop-types';
import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function ScatterChart({
  data,
  height,
  xAxisLabel,
  yAxisLabel,
  xDomain,
  yDomain,
  showGrid,
  customTooltip,
}) {
  return (
    <ResponsiveContainer width="100%" height={height || 400}>
      <RechartsScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />}

        <XAxis
          type="number"
          dataKey="x"
          name="Score"
          domain={xDomain}
          label={
            xAxisLabel
              ? {
                  value: xAxisLabel,
                  position: 'insideBottom',
                  offset: -10,
                  style: { fill: '#666', fontWeight: '600' },
                }
              : undefined
          }
          tick={{ fill: '#666', fontSize: 12, fontWeight: 500 }}
        />

        <YAxis type="number" dataKey="y" name="Index" hide domain={yDomain} />

        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={customTooltip} />

        <Scatter name="Projects" data={data} fill="#34a83a" shape="circle" />
      </RechartsScatterChart>
    </ResponsiveContainer>
  );
}

ScatterChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
    }),
  ).isRequired,
  height: PropTypes.number,
  xAxisLabel: PropTypes.string,
  yAxisLabel: PropTypes.string,
  xDomain: PropTypes.arrayOf(PropTypes.number),
  yDomain: PropTypes.arrayOf(PropTypes.number),
  showGrid: PropTypes.bool,
  customTooltip: PropTypes.elementType,
};

ScatterChart.defaultProps = {
  height: 400,
  xAxisLabel: '',
  yAxisLabel: '',
  xDomain: [0, 100],
  yDomain: undefined,
  showGrid: true,
  customTooltip: undefined,
};
