import { Separator } from '@/components/common';

export default function SectionLabel({ label, count }) {
  return (
    <div>
      <div className="flex items-baseline justify-between pb-2">
        <span className="pl-2 font-mono text-sm font-bold tracking-[0.14em] text-(--color-text-muted) uppercase">
          {label}
        </span>
        {count != null && <span className="text-sm text-(--color-text-muted)">{count}</span>}
      </div>
      <Separator />
    </div>
  );
}
