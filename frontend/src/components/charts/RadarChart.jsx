import PropTypes from 'prop-types';
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { ChartContainer, ChartLegendContent, ChartTooltipContent } from '@/components/ui/chart';

const FONT_FAMILY = 'JetBrains Mono, monospace';

// Two distinct warm palette colors — green for "Your Idea", bronze for "Market Average"
const SERIES_COLORS = ['#4a7c59', '#b8916a'];

function RadarChartComponent({
  data,
  radarConfigs,
  height = 400,
  showLegend = true,
  className,
  colors,
}) {
  if (!data?.length || !radarConfigs?.length) {
    return (
      <div
        className="flex items-center justify-center font-mono text-[13px] text-stone-500"
        style={{
          height,
        }}
      >
        No data available
      </div>
    );
  }

  const config = Object.fromEntries(
    radarConfigs.map((cfg, i) => [
      cfg.dataKey,
      {
        label: cfg.name,
        color: colors?.[i] || SERIES_COLORS[i] || cfg.stroke || SERIES_COLORS[0],
      },
    ]),
  );

  const axisKey =
    data[0]?.subject !== undefined ? 'subject' : data[0]?.factor !== undefined ? 'factor' : 'name';

  return (
    <ChartContainer config={config} className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsRadarChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 5, left: 20 }}
          outerRadius="90%"
        >
          <PolarGrid stroke="rgba(180,160,130,0.6)" strokeWidth={1} />
          <PolarAngleAxis
            dataKey={axisKey}
            tick={{
              fontFamily: FONT_FAMILY,
              fontSize: 15,
              fontWeight: 500,
              fill: '#5a4f42',
            }}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltipContent />} />
          {radarConfigs.map((cfg, i) => {
            const seriesColor = colors?.[i] || SERIES_COLORS[i] || cfg.stroke || SERIES_COLORS[0];
            const isFirst = i === 0;

            return (
              <Radar
                key={cfg.dataKey}
                name={cfg.name}
                dataKey={cfg.dataKey}
                stroke={seriesColor}
                fill={seriesColor}
                fillOpacity={cfg.fillOpacity !== undefined ? cfg.fillOpacity : 0.15}
                strokeWidth={isFirst ? 2 : 1.5}
                dot={
                  isFirst
                    ? { r: 4, fill: seriesColor, strokeWidth: 0 }
                    : { r: 3, fill: seriesColor, strokeWidth: 0 }
                }
                activeDot={{ r: 5, strokeWidth: 0 }}
                label={
                  isFirst
                    ? (props) => {
                        const { x, y, value } = props;
                        if (value === undefined || value === null) return null;
                        return (
                          <text
                            x={x}
                            y={y}
                            dy={-10}
                            textAnchor="middle"
                            style={{
                              fontFamily: FONT_FAMILY,
                              fontSize: 13,
                              fontWeight: 600,
                              fill: seriesColor,
                            }}
                          >
                            {typeof value === 'number' ? Math.round(value) : value}
                          </text>
                        );
                      }
                    : false
                }
              />
            );
          })}
          {showLegend && radarConfigs.length > 1 && (
            <Legend
              content={({ payload }) => <ChartLegendContent payload={payload} />}
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: 60 }}
            />
          )}
        </RechartsRadarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

RadarChartComponent.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  radarConfigs: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      dataKey: PropTypes.string.isRequired,
      stroke: PropTypes.string,
      fillOpacity: PropTypes.number,
    }),
  ).isRequired,
  height: PropTypes.number,
  showLegend: PropTypes.bool,
  className: PropTypes.string,
  colors: PropTypes.arrayOf(PropTypes.string),
  // These props are kept for interface compat but unused in Recharts:
  showTooltip: PropTypes.bool,
  isLoading: PropTypes.bool,
  responsive: PropTypes.bool,
  interactive: PropTypes.bool,
  animationDuration: PropTypes.number,
};

export default RadarChartComponent;
