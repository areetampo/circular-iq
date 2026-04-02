export const chartTheme = {
  colors: ['#b8916a', '#4a7c59', '#5a7a9a', '#b07d3a', '#8b3a3a', '#5a4f42', '#9a8f82'],
  backgroundColor: 'transparent',
  gridColor: 'rgba(180, 160, 130, 0.15)',
  textColor: '#9a8f82',
  axisColor: 'rgba(180, 160, 130, 0.15)',
  tooltipBg: 'rgba(245, 240, 232, 0.97)',
  tooltipBorder: 'rgba(180, 160, 130, 0.3)',
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
