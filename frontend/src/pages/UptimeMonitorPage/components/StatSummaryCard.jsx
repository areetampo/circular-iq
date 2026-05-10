import { Tilt3D } from '@/components/common';

export default function StatSummaryCard({ title, value, subtext }) {
  return (
    <Tilt3D
      block
      className="flex flex-col items-start justify-center gap-1.5 rounded-3xl border-2 border-(--color-border-ui) bg-transparent p-5"
    >
      <p className="font-mono text-[0.625rem] font-semibold tracking-widest text-(--color-text-muted) uppercase">
        {title}
      </p>
      <p className="font-mono text-2xl font-medium tracking-[-0.02em] text-(--color-text-primary)">
        {value ?? '—'}
      </p>
      {subtext && <p className="text-xs text-(--color-text-muted)">{subtext}</p>}
    </Tilt3D>
  );
}
