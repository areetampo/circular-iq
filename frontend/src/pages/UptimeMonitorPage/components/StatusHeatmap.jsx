import { Tooltip } from '@heroui/react';

import { Tilt3D } from '@/components/common';
import { cn } from '@/utils/cn';

export default function StatusHeatmap({ hours, hasNoData = false }) {
  return (
    <Tilt3D
      rotateRange={{ x: 2, y: 0.5 }}
      block
      className="w-full overflow-x-auto rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4"
    >
      <h3 className="mb-4 text-center font-mono text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
        Last 24h Status (every 30 min)
      </h3>

      {hasNoData || !hours || hours.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-(--color-text-muted)">
          No data available
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-x-4.5 gap-y-1">
          {hours.map((h, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <Tooltip delay={0}>
                <Tooltip.Trigger
                  className={cn(
                    'size-6 rounded-full shadow-sm',
                    h.anyFailure ? 'bg-(--color-error)' : 'bg-(--color-success)',
                  )}
                />
                <Tooltip.Content className="flex flex-col items-center justify-center">
                  <span className="font-mono">{h.timeLabel}</span>
                  <span className="font-sniglet">
                    {h.anyFailure ? 'failure occurred' : 'all good'}
                  </span>
                </Tooltip.Content>
              </Tooltip>
              <span className="mt-1 font-mono text-[0.56rem] font-medium whitespace-nowrap text-(--color-text-muted)">
                {h.timeLabel}
              </span>
            </div>
          ))}
        </div>
      )}
    </Tilt3D>
  );
}
