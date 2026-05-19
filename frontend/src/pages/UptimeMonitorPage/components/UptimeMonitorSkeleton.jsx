/**
 * @module UptimeMonitorSkeleton
 * @description Full-page skeleton while uptime monitor initial history loads.
 */

import { Skeleton } from '@heroui/react';

import { Separator } from '@/components/common';
import { cn } from '@/utils/cn';

import { ENDPOINTS } from '../constants';

/**
 * Full-page skeleton while uptime monitor initial history loads.
 * @returns {import('react').ReactElement}
 */
export default function UptimeMonitorSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
      {/* ── PAGE HEADER ──────────────────────────────────────────────────────
          Left:  Activity icon (size-7) + h1 text-[2rem] font-medium
                 subheading: "Server-polling N endpoints every 30s — N total checks stored" two spans separated by a Minus icon → single line of text-sm/relaxed pl-1
                 Clock-aligned toggle
          Right: Export CSV button (h-9)
                 "LIVE • Next update in __s" row (font-mono text-[0.65rem])
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="mt-10 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          {/* icon + "Uptime Monitor" — h1 text-[2rem] ≈ 40px line-height */}
          <Skeleton className="h-10 w-64 rounded-lg" />
          {/* subheading — text-sm/relaxed, two segments + separator icon */}
          <Skeleton className="h-4 w-96 rounded-md" />
          {/* Clock-aligned toggle */}
          <Skeleton className="h-4 w-40 rounded-md" />
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {/* Export CSV button: h-9 */}
          <Skeleton className="h-9 w-32 rounded-lg" />
          {/* "LIVE • Next update in __s" */}
          <div className="flex items-center gap-2 pr-1">
            <Skeleton className="h-2.5 w-10 rounded-sm" />
            <Skeleton className="size-2.5 rounded-full" />
            <Skeleton className="h-2.5 w-28 rounded-sm" />
          </div>
        </div>
      </div>

      {/* ── SUMMARY STATS — 5 × StatSummaryCard ──────────────────────────────
          rounded-3xl border-2 p-5 flex-col items-start gap-1.5
          title:   font-mono text-[0.625rem] tracking-widest uppercase → ~10px
          value:   font-mono text-2xl → ~32px
          subtext: text-xs → ~12px
      ─────────────────────────────────────────────────────────────────────── */}
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

      {/* ── CHARTS 2×2 ────────────────────────────────────────────────────────
          All: rounded-2xl border-2 p-4
          Title: font-mono text-xs mb-2

          Top-left:    HealthDistributionChart   — PieChart height={220}  → h-55
          Top-right:   GlobalResponseTrendChart  — LineChart height={220} → h-55
          Bottom-left: UptimeOverTimeChart       — LineChart height={220} → h-55
          Bottom-right:EndpointLatencyBarChart   — BarChart  height={280} → h-70 (taller)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Health Distribution */}
        {['h-55', 'h-55', 'h-70', 'h-70'].map((h, idx) => (
          <div
            key={idx}
            className="rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4"
          >
            <Skeleton className="mb-2 h-3 w-36 rounded-sm" />
            <Skeleton className={cn(h, 'w-full rounded-lg')} />
          </div>
        ))}
      </div>

      {/* ── STATUS HEATMAP ────────────────────────────────────────────────────
          StatusHeatmap: rounded-2xl border-2 p-4
          Title: font-mono text-xs text-center mb-4 — "LAST 34 DAYS STATUS (EVERY 1 HR)"
          Body: 2 rows of dot/cell items (each row h-6, gap-0.5 between rows)
                The heatmap renders circles/dots in a grid — 2 rows visible in screenshot
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="w-full rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4">
        <Skeleton className="mx-auto mb-4 h-3 w-64 rounded-sm" />
        <div className="flex flex-col gap-0.5 pb-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-full rounded-sm" />
          ))}
        </div>
      </div>

      {/* ── SECTION LABEL — "ENDPOINTS  10" ──────────────────────────────────
          label: font-mono text-sm font-bold tracking-[0.14em] uppercase pl-2
          count: text-sm
          justify-between pb-2 → then Separator (h-px)
      ─────────────────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-baseline justify-between pb-2">
          <Skeleton className="h-3.5 w-24 rounded-sm" />
          <Skeleton className="h-3.5 w-4 rounded-sm" />
        </div>
        <div className="h-px w-full bg-(--color-border-ui)" />
      </div>

      {/* ── ENDPOINT CARDS ────────────────────────────────────────────────────
          EndpointCard: rounded-2xl border-2 p-5 flex-col gap-4

          Header (items-start justify-between gap-3)
          Left:
            • dot: size-2 rounded-full  +  name: font-sniglet text-3.75 uppercase
            • path: font-mono text-[0.65rem] mt-1
            • desc: text-xs mt-1.75
          Right:
            • uptime%: font-mono text-2xl leading-none
            • "UPTIME": font-mono text-[0.6rem] mt-1 tracking-widest

          HistoryGrid — h-5, full width row of tiny colored bars

          Sparkline 1 — "RESPONSE TIME – LAST 1 HR"
            label: font-mono text-[0.6rem] mb-4
            chart: LineChart height={80} → h-20

          Sparkline 2 — "RESPONSE TIME – LAST 24H (15 MINS AVG)"
            label: font-mono text-[0.6rem] mb-4
            chart: LineChart height={80} → h-20

          Separator

          Metrics footer (justify-between)
            AVG LATENCY | LAST CHECK | STATUS | CHECKS
            Each: label h-[0.6rem] + value (text-base or text-sm)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ENDPOINTS.map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-4 rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-5"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-2 shrink-0 rounded-full" />
                  {/* name: font-sniglet text-3.75 uppercase */}
                  <Skeleton className="h-3.75 w-32 rounded-sm" />
                </div>
                {/* path: font-mono text-[0.65rem] */}
                <Skeleton className="mt-1 h-[0.65rem] w-28 rounded-sm" />
                {/* desc: text-xs mt-1.75 */}
                <Skeleton className="mt-1.75 h-3 w-44 rounded-sm" />
              </div>
              <div className="shrink-0 text-right">
                {/* uptime%: font-mono text-2xl leading-none */}
                <Skeleton className="ml-auto h-6 w-20 rounded-sm" />
                {/* "UPTIME": font-mono text-[0.6rem] mt-1 */}
                <Skeleton className="mt-1 ml-auto h-[0.6rem] w-10 rounded-sm" />
              </div>
            </div>

            {/* HistoryGrid — h-5 row of tiny colored tick bars */}
            <Skeleton className="h-5 w-full rounded-sm" />

            {/* Sparkline 1 — RESPONSE TIME – LAST 1 HR */}
            <div>
              <Skeleton className="mb-4 h-[0.6rem] w-44 rounded-sm" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>

            {/* Sparkline 2 — RESPONSE TIME – LAST 24H (15 MINS AVG) */}
            <div>
              <Skeleton className="mb-4 h-[0.6rem] w-52 rounded-sm" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>

            {/* Separator */}
            <Separator />

            {/* Metrics footer: AVG LATENCY | LAST CHECK | STATUS | CHECKS */}
            <div className="flex items-stretch justify-between">
              {/* AVG LATENCY — text-base value */}
              <div className="flex shrink-0 flex-col justify-between gap-1.5">
                <Skeleton className="h-[0.6rem] w-16 rounded-sm" />
                <Skeleton className="h-4.5 w-10 rounded-sm" />
              </div>
              {/* LAST CHECK — px-5, whitespace-nowrap */}
              <div className="flex flex-col justify-between gap-1.5 px-5">
                <Skeleton className="h-[0.6rem] w-16 rounded-sm" />
                <Skeleton className="h-3.5 w-24 rounded-sm" />
              </div>
              {/* STATUS — text-sm uppercase */}
              <div className="flex shrink-0 flex-col justify-between gap-1.5">
                <Skeleton className="h-[0.6rem] w-10 rounded-sm" />
                <Skeleton className="h-3.5 w-20 rounded-sm" />
              </div>
              {/* CHECKS — text-sm text-right */}
              <div className="flex shrink-0 flex-col items-end justify-between gap-1.5">
                <Skeleton className="h-[0.6rem] w-12 rounded-sm" />
                <Skeleton className="h-3.5 w-8 rounded-sm" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
