import { Tooltip } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';

import { Tilt3D } from '@/components/common';
import { cn } from '@/utils/cn';

const TOTAL_ITEMS = 288;
const IDEAL_ITEMS_PER_ROW = 72; // 4 rows
const MIN_ITEM_WIDTH = 6; // px
const GAP = 2; // gap-0.5 = 2px

function getStatusColor(hasData, anyFailure) {
  if (!hasData) return 'bg-(--color-border-ui)';
  return anyFailure ? 'bg-(--color-error)' : 'bg-(--color-success)';
}

function getTooltipText(timeLabel, hasData, anyFailure) {
  if (!hasData) return `${timeLabel} – no data`;
  return anyFailure ? `${timeLabel} – failure occurred` : `${timeLabel} – all good`;
}

function computeLayout(containerWidth) {
  // Start from ideal (72/row). Only increase rows if item width drops below MIN.
  // itemWidth = (containerWidth - (itemsPerRow - 1) * GAP) / itemsPerRow
  const idealWidth = (containerWidth - (IDEAL_ITEMS_PER_ROW - 1) * GAP) / IDEAL_ITEMS_PER_ROW;

  if (idealWidth >= MIN_ITEM_WIDTH) {
    // Ideal layout fits fine
    return { itemsPerRow: IDEAL_ITEMS_PER_ROW, itemWidth: idealWidth };
  }

  // Need more rows — find the smallest itemsPerRow such that width >= MIN_ITEM_WIDTH
  // itemsPerRow = ceil(TOTAL_ITEMS / rows), increase rows until width is enough
  let rows = 5;
  while (rows <= TOTAL_ITEMS) {
    const itemsPerRow = Math.ceil(TOTAL_ITEMS / rows);
    const itemWidth = (containerWidth - (itemsPerRow - 1) * GAP) / itemsPerRow;
    if (itemWidth >= MIN_ITEM_WIDTH) {
      return { itemsPerRow, itemWidth };
    }
    rows++;
  }

  // Absolute fallback: 1 item per row
  return { itemsPerRow: 1, itemWidth: MIN_ITEM_WIDTH };
}

export default function StatusHeatmap({ hours, hasNoData = false }) {
  const containerRef = useRef(null);
  const [layout, setLayout] = useState({ itemsPerRow: IDEAL_ITEMS_PER_ROW, itemWidth: null });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setLayout(computeLayout(width));
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Group items into rows
  const rows = [];
  if (hours?.length) {
    for (let i = 0; i < hours.length; i += layout.itemsPerRow) {
      rows.push(hours.slice(i, i + layout.itemsPerRow));
    }
  }

  return (
    <Tilt3D
      rotateRange={{ x: 2, y: 0.5 }}
      block
      className="w-full overflow-x-auto rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4"
    >
      <h3 className="mb-4 text-center font-mono text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
        Last 24h Status (every 5 min)
      </h3>

      {hasNoData || !hours || hours.length === 0 ? (
        <div className="flex h-20 items-center justify-center text-sm text-(--color-text-muted)">
          No data available
        </div>
      ) : (
        <div ref={containerRef} className="flex flex-col gap-0.5 pb-2">
          {layout.itemWidth !== null &&
            rows.map((row, rowIdx) => (
              <div key={rowIdx} className="flex justify-center gap-0.5">
                {row.map((h, idx) => (
                  <Tooltip key={idx} delay={0}>
                    <Tooltip.Trigger>
                      <div
                        className={cn(
                          'h-6 shrink-0 rounded-sm',
                          getStatusColor(h.hasData, h.anyFailure),
                        )}
                        style={{ width: `${layout.itemWidth}px` }}
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                      <div className="font-mono text-xs">
                        {getTooltipText(h.timeLabel, h.hasData, h.anyFailure)}
                      </div>
                    </Tooltip.Content>
                  </Tooltip>
                ))}
              </div>
            ))}
        </div>
      )}
    </Tilt3D>
  );
}
