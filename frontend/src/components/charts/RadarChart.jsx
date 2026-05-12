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
import { resolveCSSVar } from '@/utils/chartHelpers';

const FONT_FAMILY = 'JetBrains Mono, monospace';

// Two distinct warm palette colors — green for "Your Idea", bronze for "Market Average"
const getSeriesColors = () => [
  resolveCSSVar('var(--color-success)', '#34a83a'),
  resolveCSSVar('var(--color-accent)', '#b8916a'),
];

/**
 * RadarChart component for displaying multi-dimensional data in a radial format
 * Uses Recharts library with responsive design and theming support
 *
 * @param {Object} props - Component props
 * @param {Array} [props.data] - Array of data objects to display
 * @param {Array} [props.radarConfigs] - Configuration for each radar series
 * @param {string} props.radarConfigs[].dataKey - Key in data object for radar values
 * @param {string} props.radarConfigs[].name - Display name for the radar series
 * @param {number} [props.height=400] - Height of the chart in pixels (default: 400)
 * @param {boolean} [props.showLegend=true] - Whether to show legend (default: true)
 * @param {string} [props.className] - Additional CSS classes (optional)
 * @param {Array} [props.colors] - Array of colors for radar series (optional)
 * @param {Object} [props.margin] - Additional margin overrides (optional)
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 *
 * @example
 * <RadarChart
 *   data={[{ metric: 'Speed', value: 80 }, { metric: 'Quality', value: 90 }]}
 *   radarConfigs={[{ dataKey: 'value', name: 'Performance' }]}
 *   height={400}
 * />
 */
function RadarChartComponent({
  data,
  radarConfigs,
  height = 400,
  showLegend = true,
  className,
  colors,
  margin = {},
  ...props
}) {
  if (!data?.length || !radarConfigs?.length) {
    return (
      <div
        className="flex items-center justify-center font-mono text-[0.85rem] text-(--color-text-muted)"
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
        color: colors?.[i]
          ? colors[i]
          : getSeriesColors()[i]
            ? getSeriesColors()[i]
            : cfg.stroke || getSeriesColors()[0],
      },
    ]),
  );

  const axisKey =
    data[0]?.subject !== undefined ? 'subject' : data[0]?.factor !== undefined ? 'factor' : 'name';

  return (
    <ChartContainer config={config} className={className} style={{ height }} {...props}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsRadarChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 5, left: 20, ...margin }}
          outerRadius="90%"
        >
          <PolarGrid stroke="var(--color-chart-grid-strong)" strokeWidth={1} />
          <PolarAngleAxis
            dataKey={axisKey}
            tick={{
              fontFamily: FONT_FAMILY,
              fontSize: 15,
              fontWeight: 500,
              fill: 'var(--color-text-secondary)',
            }}
            tickLine={false}
          />
          <Tooltip
            content={<ChartTooltipContent />}
            cursor={{ fill: 'var(--color-chart-cursor)' }}
          />
          {radarConfigs.map((cfg, i) => {
            const seriesColor = colors?.[i]
              ? colors[i]
              : getSeriesColors()[i] || cfg.stroke || getSeriesColors()[0];
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
  margin: PropTypes.object,
  // These props are kept for interface compat but unused in Recharts:
  showTooltip: PropTypes.bool,
  isLoading: PropTypes.bool,
  responsive: PropTypes.bool,
  interactive: PropTypes.bool,
  animationDuration: PropTypes.number,
};

export default RadarChartComponent;
