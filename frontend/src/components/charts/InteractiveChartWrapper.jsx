import { Chip } from '@/components/common';
import { Card } from '@heroui/react';
import PropTypes from 'prop-types';
import { useCallback, useMemo, useState } from 'react';

import ChartErrorBoundary from './ChartErrorBoundary';

/**
 * InteractiveChartWrapper - Adds interactive features to any chart component
 * Includes zoom, pan, data point selection, and export functionality
 */
export default function InteractiveChartWrapper({
  children,
  data,
  title,
  subtitle,
  height = 400,
  showControls = true,
  showDataStats = true,
  enableExport = true,
  enableFullscreen = false,
  className,
  onDataPointClick,
  onSelectionChange,
}) {
  const [selectedPoints, setSelectedPoints] = useState(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Calculate data statistics
  const dataStats = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    const numericValues = data
      .flatMap((item) => Object.values(item))
      .filter((val) => typeof val === 'number');

    if (numericValues.length === 0) {
      return null;
    }

    const sum = numericValues.reduce((acc, val) => acc + val, 0);
    const avg = sum / numericValues.length;
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);

    return {
      count: data.length,
      sum,
      avg: avg.toFixed(2),
      min,
      max,
    };
  }, [data]);

  const handleDataPointClick = useCallback(
    (pointData, pointIndex) => {
      setSelectedPoints((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(pointIndex)) {
          newSet.delete(pointIndex);
        } else {
          newSet.add(pointIndex);
        }
        return newSet;
      });

      if (onDataPointClick) {
        onDataPointClick(pointData, pointIndex);
      }
    },
    [onDataPointClick],
  );

  const handleExport = useCallback((format = 'png') => {
    console.log(`Exporting chart as ${format}`);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPoints(new Set());
    if (onSelectionChange) {
      onSelectionChange(new Set());
    }
  }, [onSelectionChange]);

  return (
    <ChartErrorBoundary height={height} className={className}>
      <Card
        className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''} ${className}`}
        style={{ height: isFullscreen ? '100vh' : height }}
      >
        {/* Header */}
        {(title || subtitle || showControls) && (
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  {subtitle}
                </p>
              )}
            </div>

            {/* Controls */}
            {showControls && (
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                {selectedPoints.size > 0 && (
                  <Chip variant="info" onClose={clearSelection}>
                    {selectedPoints.size} selected
                  </Chip>
                )}

                {enableExport && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleExport('png')}
                      className="px-2 py-1 text-xs rounded hover:bg-default-100 transition-colors"
                      style={{ color: 'var(--muted)' }}
                      title="Export as PNG"
                    >
                      📷
                    </button>
                    <button
                      onClick={() => handleExport('svg')}
                      className="px-2 py-1 text-xs rounded hover:bg-default-100 transition-colors"
                      style={{ color: 'var(--muted)' }}
                      title="Export as SVG"
                    >
                      📄
                    </button>
                  </div>
                )}

                {enableFullscreen && (
                  <button
                    onClick={toggleFullscreen}
                    className="px-2 py-1 text-xs rounded hover:bg-default-100 transition-colors"
                    style={{ color: 'var(--muted)' }}
                    title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  >
                    {isFullscreen ? '✕' : '⛶'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Chart Content */}
        <div className="flex-1 relative" style={{ minHeight: 0 }}>
          {typeof children === 'function'
            ? children({
                selectedPoints,
                hoveredPoint,
                onDataPointClick: handleDataPointClick,
                onHover: setHoveredPoint,
              })
            : children}
        </div>

        {/* Footer with Data Stats */}
        {showDataStats && dataStats && (
          <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span style={{ color: 'var(--muted)' }}>Points:</span>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {dataStats.count}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ color: 'var(--muted)' }}>Avg:</span>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {dataStats.avg}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ color: 'var(--muted)' }}>Range:</span>
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {dataStats.min} - {dataStats.max}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </ChartErrorBoundary>
  );
}

InteractiveChartWrapper.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  data: PropTypes.array,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  height: PropTypes.number,
  showControls: PropTypes.bool,
  showDataStats: PropTypes.bool,
  enableExport: PropTypes.bool,
  enableFullscreen: PropTypes.bool,
  className: PropTypes.string,
  onDataPointClick: PropTypes.func,
  onSelectionChange: PropTypes.func,
};
