import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import { PieChart as MuiPieChart } from '@mui/x-charts/PieChart';

const DEFAULT_COLORS = [
  '#2563eb',
  '#059669',
  '#f97316',
  '#8b5cf6',
  '#ef4444',
  '#f59e0b',
  '#6366f1',
  '#ec4899',
];

export default function PieChart({
  data,
  dataKey = 'value',
  nameKey = 'name',
  height = 300,
  colors = DEFAULT_COLORS,
  showLegend = true,
  showDataSummary = true,
  innerRadius = 0,
  centerLabel = null,
}) {
  const theme = useTheme();
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(360);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(
          Math.min(entry.contentRect.width - 16, height - (showDataSummary ? 44 : 0)),
        );
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [height, showDataSummary]);

  const seriesData = useMemo(() => {
    if (!data || !data.length) return [];
    const total = data.reduce((sum, row) => sum + (Number(row[dataKey]) || 0), 0);
    return data.map((row, idx) => ({
      id: idx,
      value: Number(row[dataKey]) || 0,
      label: row[nameKey] ?? row.name ?? '—',
      color: row.color ?? colors[idx % colors.length],
    }));
  }, [data, dataKey, nameKey, colors]);

  const total = useMemo(() => seriesData.reduce((sum, d) => sum + d.value, 0), [seriesData]);

  const series = useMemo(
    () => [
      {
        data: seriesData,
        innerRadius: innerRadius > 0 ? innerRadius : 0,
        outerRadius: '90%',
        paddingAngle: 2,
        cornerRadius: 4,
        arcLabel: (item) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return `${item.label}: ${item.value} (${pct}%)`;
        },
        arcLabelMinAngle: 14,
        valueFormatter: (value) => {
          const pct = total > 0 ? Math.round((value / total) * 100) : 0;
          return `${value} (${pct}%)`;
        },
      },
    ],
    [seriesData, total, innerRadius],
  );

  if (!data || data.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        minWidth: 0,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        p: 1,
      }}
    >
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          width: '100%',
          height: height - (showDataSummary ? 44 : 0),
          minHeight: 200,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <MuiPieChart
          series={series}
          colors={seriesData.map((d) => d.color)}
          width={containerWidth}
          height={height - (showDataSummary ? 44 : 0)}
          slotProps={{
            legend: showLegend
              ? {
                  hidden: false,
                  direction: 'row',
                  position: { vertical: 'bottom', horizontal: 'middle' },
                  padding: 8,
                  itemMarkWidth: 10,
                  itemMarkHeight: 10,
                  markGap: 8,
                  itemGap: 12,
                  labelStyle: { fontSize: 12, fontWeight: 500 },
                }
              : { hidden: true },
          }}
          sx={{
            '& .MuiChartsLegend-mark': { rx: 2 },
            '& .MuiPieArcLabel-root': {
              fontSize: 11,
              fontWeight: 600,
              fill: theme.palette.text.primary,
            },
          }}
        />
      </Box>

      {centerLabel && innerRadius > 0 && (
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {centerLabel.subLabel}
          </Typography>
          <Typography variant="h6" fontWeight={600}>
            {centerLabel.main}
          </Typography>
        </Box>
      )}

      {showDataSummary && seriesData.length > 0 && total > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 1.5,
            pt: 1,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          {seriesData.map((item, idx) => (
            <Typography
              key={idx}
              variant="caption"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: 1,
                  bgcolor: item.color,
                }}
              />
              <Box component="span" fontWeight={600}>
                {item.label}:
              </Box>
              {item.value} ({Math.round((item.value / total) * 100)}%)
            </Typography>
          ))}
        </Box>
      )}
    </Paper>
  );
}
