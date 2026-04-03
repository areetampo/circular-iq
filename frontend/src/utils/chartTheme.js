export const CHART_COLORS = {
  primary: '#b8916a',
  secondary: '#4a7c59',
  tertiary: '#5a7a9a',
  muted: '#9a8f82',
  grid: 'rgba(180,160,130,0.12)',
  tick: '#9a8f82',
  bg: 'transparent',
};

export const SCORE_COLORS = {
  high: 'rgba(74,124,89,0.75)',
  mid: 'rgba(176,125,58,0.75)',
  low: 'rgba(139,58,58,0.75)',
};

export const chartTheme = {
  colors: [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.tertiary, CHART_COLORS.muted],
  backgroundColor: CHART_COLORS.bg,
  gridColor: CHART_COLORS.grid,
  textColor: CHART_COLORS.tick,
  axisColor: CHART_COLORS.grid,
  tooltipBg: 'rgba(247,243,237,0.97)',
  tooltipBorder: 'rgba(180,160,130,0.28)',
  tooltipText: '#1a1510',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontSize: 12,
};

export const tooltipStyle = {
  backgroundColor: chartTheme.tooltipBg,
  border: `1px solid ${chartTheme.tooltipBorder}`,
  borderRadius: '8px',
  fontSize: '12px',
  color: chartTheme.tooltipText,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontFamily: chartTheme.fontFamily,
};

export const axisTickStyle = {
  fill: chartTheme.textColor,
  fontSize: chartTheme.fontSize,
  fontFamily: chartTheme.fontFamily,
};
