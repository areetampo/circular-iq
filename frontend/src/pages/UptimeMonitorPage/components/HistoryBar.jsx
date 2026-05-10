import { Tooltip } from '@heroui/react';

import { cn } from '@/utils/cn';

export default function HistoryBar({ checks }) {
  const last = checks.slice(-40);
  const emptyCount = Math.max(0, 40 - last.length);

  return (
    <div className="flex h-5 items-end gap-px">
      {Array.from({ length: emptyCount }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="h-3 flex-1 rounded-xs bg-(--color-border-ui) opacity-30"
        />
      ))}
      {last.map((c, i) => (
        <Tooltip key={i} delay={0}>
          <Tooltip.Trigger
            style={{ opacity: 0.45 + (i / last.length) * 0.55 }}
            className={cn(
              'flex-1 rounded-xs transition-all',
              c.up ? 'h-5 bg-(--color-success)' : 'h-3 bg-(--color-error)',
            )}
          />
          <Tooltip.Content>{`${c.status} — ${c.ms}ms`}</Tooltip.Content>
        </Tooltip>
      ))}
    </div>
  );
}
