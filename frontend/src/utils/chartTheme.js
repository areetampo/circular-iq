import { resolveCSSVar } from '@/utils/chartHelpers';

// Factory functions to resolve CSS variables at render time
export const getChartColors = () => ({
  primary: resolveCSSVar('var(--chart-1)', '#b8916a'),
  secondary: resolveCSSVar('var(--chart-2)', '#4a7c59'),
  tertiary: resolveCSSVar('var(--color-info)', '#5a7a9a'),
  muted: resolveCSSVar('var(--chart-6)', '#9a8f82'),
  grid: resolveCSSVar('var(--color-chart-grid-semantic)', 'rgba(180, 160, 130, 0.12)'),
  tick: resolveCSSVar('var(--chart-6)', '#9a8f82'),
  bg: 'transparent',
});

export const getScoreColors = () => ({
  high: resolveCSSVar('var(--color-score-high-opacity)', 'rgba(74, 124, 89, 0.75)'),
  mid: resolveCSSVar('var(--color-score-mid-opacity)', 'rgba(176, 125, 58, 0.75)'),
  low: resolveCSSVar('var(--color-score-low-opacity)', 'rgba(139, 58, 58, 0.75)'),
});

// Note: Use getter functions directly instead of Proxy exports
// Example: getChartColors().primary instead of CHART_COLORS.primary
// Example: getScoreColors().high instead of SCORE_COLORS.high

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

export const getTooltipStyle = () => {
  const theme = getChartTheme();
  return {
    background: resolveCSSVar('var(--color-tooltip-bg)', 'rgba(247, 243, 237, 0.97)'),
    border: `1px solid ${resolveCSSVar('var(--color-border-tooltip)', 'rgba(180, 160, 130, 0.28)')}`,
    borderRadius: '8px',
    fontSize: '12px',
    color: resolveCSSVar('var(--color-text-primary)', '#1a1510'),
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    fontFamily: theme.fontFamily,
  };
};

// Note: Use getter functions directly instead of Proxy exports
// Example: getChartTheme() instead of chartTheme
// Example: getTooltipStyle() instead of tooltipStyle

export const getAxisTickStyle = () => {
  const theme = getChartTheme();
  return {
    fill: theme.textColor,
    fontSize: theme.fontSize,
    fontFamily: theme.fontFamily,
  };
};

// Note: Use getter function directly instead of Proxy export
// Example: getAxisTickStyle() instead of axisTickStyle
