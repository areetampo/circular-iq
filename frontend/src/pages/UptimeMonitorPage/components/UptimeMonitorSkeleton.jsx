import { Skeleton } from '@heroui/react';

import { ENDPOINTS } from '../constants';

export default function UptimeMonitorSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      {/* Real: pt-6, items-end justify-between                                 */}
      {/* Left:  Activity icon (size-7) + h1 text-[2rem] font-medium            */}
      {/*        subheading p text-sm/relaxed pl-1                              */}
      {/* Right: Export CSV button (h-9) + live indicator row                   */}
      <div className="flex items-end justify-between gap-4 pt-8">
        <div className="flex flex-col gap-2">
          {/* h1: icon + "Uptime Monitor" — text-[2rem] ≈ 32px line-height ~40px */}
          <Skeleton className="h-10 w-60 rounded-lg" />
          {/* subheading: text-sm/relaxed pl-1 — ~20px tall */}
          <Skeleton className="h-5 w-80 rounded-md" />
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Export CSV button: h-9 */}
          <Skeleton className="h-9 w-32 rounded-lg" />
          {/* "LIVE • Next update in __s" — text-[0.65rem] flex gap-2 pr-1 */}
          <div className="flex items-center gap-2 pr-1">
            <Skeleton className="h-2.5 w-24 rounded-sm" />
            <Skeleton className="size-2.5 rounded-full" />
          </div>
        </div>
      </div>

      {/* ── SUMMARY STATS ── 5 × StatSummaryCard ─────────────────────────────── */}
      {/* StatSummaryCard: rounded-3xl border-2 p-5 flex-col items-start gap-1.5 */}
      {/* title:   font-mono text-[0.625rem] tracking-widest uppercase → ~10px   */}
      {/* value:   font-mono text-2xl → ~32px                                    */}
      {/* subtext: text-xs → ~12px                                               */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-start justify-center gap-2.5 rounded-3xl border-2 border-(--color-border-ui) bg-transparent p-5"
          >
            <Skeleton className="h-2.5 w-3/4 rounded-sm" />
            <Skeleton className="h-8 w-1/2 rounded-md" />
            <Skeleton className="h-3 w-4/5 rounded-sm" />
          </div>
        ))}
      </div>

      {/* ── CHARTS 2×2 ───────────────────────────────────────────────────────── */}
      {/* All: rounded-2xl border-2 p-4                                          */}
      {/* Title: font-mono text-xs mb-2 → h-4 title + mb-2 (8px)                */}
      {/* Top 2: PieChart/LineChart height={220} + empty state h-55 (220px)      */}
      {/* Bottom-left: LineChart height={220}                                    */}
      {/* Bottom-right: BarChart height={280} — noticeably taller                */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Health Distribution — PieChart height=220 */}
        <div className="rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4">
          <Skeleton className="mb-2 h-3.5 w-36 rounded-sm" />
          <Skeleton className="h-55 w-full rounded-lg" />
        </div>

        {/* Global Avg Response Time (last 24h) — LineChart height=220 */}
        <div className="rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4">
          <Skeleton className="mb-2 h-3.5 w-64 rounded-sm" />
          <Skeleton className="h-55 w-full rounded-lg" />
        </div>

        {/* Uptime % Over Time (daily) — LineChart height=220 */}
        <div className="rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4">
          <Skeleton className="mb-2 h-3.5 w-52 rounded-sm" />
          <Skeleton className="h-55 w-full rounded-lg" />
        </div>

        {/* Avg Response Time by Endpoint (ms) — BarChart height=280 */}
        <div className="rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4">
          <Skeleton className="mb-2 h-3.5 w-60 rounded-sm" />
          <Skeleton className="h-70 w-full rounded-lg" />
        </div>
      </div>

      {/* ── STATUS HEATMAP ───────────────────────────────────────────────────── */}
      {/* StatusHeatmap: rounded-2xl border-2 p-4                               */}
      {/* Title: text-center font-mono text-xs mb-4                             */}
      {/* Body: flex-col gap-0.5 pb-2, 4 rows of h-6 cells (IDEAL_ITEMS_PER_ROW=72) */}
      <div className="w-full rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4">
        <Skeleton className="mx-auto mb-4 h-3.5 w-56 rounded-sm" />
        <div className="flex flex-col gap-0.5 pb-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-full rounded-sm" />
          ))}
        </div>
      </div>

      {/* ── SECTION LABEL ────────────────────────────────────────────────────── */}
      {/* SectionLabel: label (font-mono text-sm font-bold tracking-[0.14em] pl-2 uppercase) */}
      {/*               count (text-sm) — justify-between pb-2 — then Separator  */}
      <div>
        <div className="flex items-baseline justify-between pb-2">
          <Skeleton className="h-3.5 w-24 rounded-sm" />
          <Skeleton className="h-3.5 w-4 rounded-sm" />
        </div>
        <div className="h-px w-full bg-(--color-border-ui)" />
      </div>

      {/* ── ENDPOINT CARDS ───────────────────────────────────────────────────── */}
      {/* EndpointCard: rounded-2xl border-2 p-5 flex-col gap-4                 */}
      {/*                                                                         */}
      {/* ① Header (items-start justify-between gap-3)                           */}
      {/*   Left:                                                                 */}
      {/*     • dot: size-2 rounded-full                                          */}
      {/*     • name: font-sniglet text-3.75 uppercase → h~15px            */}
      {/*     • path: font-mono text-[0.65rem] at -mt-1.25 → h~10px              */}
      {/*     • desc: text-xs mt-1.75 → h~12px                                   */}
      {/*   Right:                                                                */}
      {/*     • uptime%: font-mono text-2xl leading-none → h-6                   */}
      {/*     • "UPTIME": font-mono text-[0.6rem] mt-1 → h~10px                  */}
      {/*                                                                         */}
      {/* ② HistoryBar: h-5 container (flex items-end gap-px)                   */}
      {/*                                                                         */}
      {/* ③ Sparkline section:                                                   */}
      {/*     label: font-mono text-[0.6rem] mb-4 → h~10px                       */}
      {/*     chart: LineChart height={80} → h-20                                */}
      {/*                                                                         */}
      {/* ④ Separator wrapperCn="-mt-4" → h-px -mt-4                            */}
      {/*                                                                         */}
      {/* ⑤ Metrics (justify-between, no gap):                                  */}
      {/*     AVG LATENCY: label h-2.5 / value text-base h-4.5            */}
      {/*     LAST CHECK:  label h-2.5 / value text-sm h-3.5 — px-5             */}
      {/*     STATUS:      label h-2.5 / value text-sm h-3.5                     */}
      {/*     CHECKS:      label h-2.5 / value text-sm h-3.5 — items-end         */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ENDPOINTS.map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-4 rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-5"
          >
            {/* ① Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-2 shrink-0 rounded-full" />
                  {/* font-sniglet text-3.75 uppercase tracking-wider */}
                  <Skeleton className="h-3.75 w-32 rounded-sm" />
                </div>
                {/* font-mono text-[0.65rem] — path */}
                <Skeleton className="mt-1 h-[0.65rem] w-24 rounded-sm" />
                {/* text-xs desc — mt-1.75 */}
                <Skeleton className="mt-1.75 h-3 w-44 rounded-sm" />
              </div>
              <div className="shrink-0 text-right">
                {/* font-mono text-2xl leading-none */}
                <Skeleton className="ml-auto h-6 w-18 rounded-sm" />
                {/* font-mono text-[0.6rem] mt-1 tracking-widest */}
                <Skeleton className="mt-1 ml-auto h-[0.6rem] w-10 rounded-sm" />
              </div>
            </div>

            {/* ② HistoryBar: h-5 (container height from component) */}
            <Skeleton className="h-5 w-full rounded-sm" />

            {/* ③ Sparkline */}
            <div>
              {/* font-mono text-[0.6rem] mb-4 */}
              <Skeleton className="mb-4 h-[0.6rem] w-48 rounded-sm" />
              {/* LineChart height={80} */}
              <Skeleton className="h-20 w-full rounded-md" />
            </div>

            {/* ④ Separator: h-px with -mt-4 */}
            <div className="h-px w-full bg-(--color-border-ui)" />

            {/* ⑤ Metrics footer */}
            <div className="flex items-stretch justify-between">
              {/* AVG LATENCY — text-base */}
              <div className="flex shrink-0 flex-col justify-between gap-1.5">
                <Skeleton className="h-[0.6rem] w-16 rounded-sm" />
                <Skeleton className="h-4.5 w-10 rounded-sm" />
              </div>
              {/* LAST CHECK — px-5, text-sm whitespace-nowrap */}
              <div className="flex flex-col justify-between gap-1.5 px-5">
                <Skeleton className="h-[0.6rem] w-16 rounded-sm" />
                <Skeleton className="h-3.5 w-24 rounded-sm" />
              </div>
              {/* STATUS — text-sm uppercase */}
              <div className="flex shrink-0 flex-col justify-between gap-1.5">
                <Skeleton className="h-[0.6rem] w-10 rounded-sm" />
                <Skeleton className="h-3.5 w-18 rounded-sm" />
              </div>
              {/* CHECKS — text-sm text-right */}
              <div className="flex shrink-0 flex-col items-end justify-between gap-1.5">
                <Skeleton className="h-[0.6rem] w-12 rounded-sm" />
                <Skeleton className="h-3.5 w-5 rounded-sm" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
