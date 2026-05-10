import { resolveCSSVar } from '@/utils/chartHelpers';

// Internal function - not exported (only used by getChartTheme)
const getChartColors = () => ({
  primary: resolveCSSVar('var(--chart-1)', '#b8916a'),
  secondary: resolveCSSVar('var(--chart-2)', '#4a7c59'),
  tertiary: resolveCSSVar('var(--color-info)', '#5a7a9a'),
  muted: resolveCSSVar('var(--chart-6)', '#9a8f82'),
  grid: resolveCSSVar('var(--color-chart-grid-semantic)', 'rgba(180, 160, 130, 0.12)'),
  tick: resolveCSSVar('var(--chart-6)', '#9a8f82'),
  bg: 'transparent',
});

// Factory functions to resolve CSS variables at render time
export const getChartTheme = () => {
  const colors = getChartColors();
  return {
    colors: [colors.primary, colors.secondary, colors.tertiary, colors.muted],
    backgroundColor: colors.bg,
    gridColor: colors.grid,
    textColor: colors.tick,
    axisColor: colors.grid,
    tooltipBg: resolveCSSVar('var(--color-tooltip-bg)', 'rgba(255, 255, 255, 0.95)'),
    tooltipBorder: resolveCSSVar('var(--color-border-tooltip)', 'rgba(0, 0, 0, 0.1)'),
    tooltipText: resolveCSSVar('var(--color-text-primary)', '#1f2937'),
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: 12,
  };
};
