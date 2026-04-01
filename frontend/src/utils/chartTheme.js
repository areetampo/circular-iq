export const chartTheme = {
  colors: ['#b8916a', '#8a6f52', '#d4b896', '#6b8f71', '#7a9eb5', '#c4956a', '#9b7e6a'],
  backgroundColor: 'transparent',
  gridColor: 'rgba(180, 160, 130, 0.12)',
  textColor: '#9a8f82',
  axisColor: 'rgba(180, 160, 130, 0.20)',
  tooltipBg: 'rgba(245, 240, 232, 0.97)',
  tooltipBorder: 'rgba(180, 160, 130, 0.25)',
  tooltipText: '#1a1510',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontSize: 11,
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
