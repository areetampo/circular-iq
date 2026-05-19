/**
 * @module ScoringBenchmarkingSection
 * @description Guide page section — Scoring Benchmarking.
 */

import { Info } from 'lucide-react';

import { cn } from '@/utils/cn';

import GuideSectionHeading from './GuideSectionHeading';
import { R_STRATEGY_COLORS } from '../constants/navTree';
import GUIDE_PAGE_CONTENT from '../content/guidePageContent';

/**
 * Renders the Scoring & Benchmarking guide section (`#scoring-benchmarking`) — tiers, weights, and R-strategy alignment.
 * @returns {import('react').ReactElement}
 */
export default function ScoringBenchmarkingSection() {
  return (
    <section id="scoring-benchmarking" className="scroll-mt-24">
      <GuideSectionHeading>Scoring & Benchmarking</GuideSectionHeading>
      <p className="mb-2 text-sm text-(--color-text-muted)">
        {GUIDE_PAGE_CONTENT.scoringBenchmarking.subtitle}
      </p>
      <p className="mb-10 max-w-2xl text-sm/relaxed text-(--color-text-secondary)">
        {GUIDE_PAGE_CONTENT.scoringBenchmarking.intro}
      </p>

      {/* Circularity Tiers */}
      <div id="circularity-tiers" className="scroll-mt-24">
        <h3 className="mb-4 font-sniglet text-lg text-(--color-text-primary)">Circularity Tiers</h3>
        <div className="overflow-hidden rounded-xl border-[1.5px] border-(--color-border-ui)">
          {GUIDE_PAGE_CONTENT.scoringBenchmarking.tiers.map((tier, i) => (
            <div
              key={tier.name}
              className={cn(
                'flex items-start gap-4 px-4 py-3.5',
                i !== GUIDE_PAGE_CONTENT.scoringBenchmarking.tiers.length - 1 &&
                  'border-b-[1.5px] border-(--color-border-faint)',
                tier.color === 'success' && 'bg-(--color-success-soft-10)',
                tier.color === 'info' && 'bg-(--color-info-soft-10)',
                tier.color === 'warning' && 'bg-(--color-warning-soft-10)',
                tier.color === 'accent' && 'bg-(--color-accent-soft-10)',
              )}
            >
              <div className="flex w-24 shrink-0 flex-col gap-1">
                <p
                  className={cn(
                    'text-sm font-semibold',
                    tier.color === 'success' && 'text-(--color-success)',
                    tier.color === 'info' && 'text-(--color-info)',
                    tier.color === 'warning' && 'text-(--color-warning)',
                    tier.color === 'accent' && 'text-(--color-accent)',
                  )}
                >
                  {tier.name}
                </p>
                <p className="font-mono text-xs opacity-70">({tier.range})</p>
              </div>
              <p className="text-sm/relaxed text-(--color-text-secondary)">{tier.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weighted Scoring */}
      <div id="weighted-scoring" className="mt-10 scroll-mt-24">
        <h3 className="mb-5 font-sniglet text-lg text-(--color-text-primary)">Weighted Scoring</h3>
        <p className="mb-4 text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.scoringBenchmarking.weightedScoring.explanation}
        </p>
        <div className="my-4 rounded-lg border-[1.5px] border-(--color-border-faint) bg-(--color-surface-raised) px-5 py-4 text-center font-mono text-sm font-semibold text-(--color-text-primary)">
          {GUIDE_PAGE_CONTENT.scoringBenchmarking.weightedScoring.formula}
        </div>
        <p className="mt-3 text-sm text-(--color-text-muted) italic">
          {GUIDE_PAGE_CONTENT.scoringBenchmarking.weightedScoring.note}
        </p>
      </div>

      {/* Consistency Check */}
      <div id="consistency-check" className="mt-10 scroll-mt-24">
        <h3 className="mb-5 font-sniglet text-lg text-(--color-text-primary)">Consistency Check</h3>
        <p className="mb-4 text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.scoringBenchmarking.consistencyCheck.explanation}
        </p>
        <ul className="mb-4 space-y-2">
          {GUIDE_PAGE_CONTENT.scoringBenchmarking.consistencyCheck.rules.map((rule, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-(--color-text-secondary)">
              <Info className="mt-0.5 size-3.5 shrink-0 text-(--color-info)" />
              {rule}
            </li>
          ))}
        </ul>
        <p className="text-sm text-(--color-text-muted) italic">
          {GUIDE_PAGE_CONTENT.scoringBenchmarking.consistencyCheck.note}
        </p>
      </div>

      {/* Knowledge Base */}
      <div id="knowledge-base" className="mt-10 scroll-mt-24">
        <h3 className="mb-5 font-sniglet text-lg text-(--color-text-primary)">Knowledge Base</h3>
        <p className="mb-5 text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.scoringBenchmarking.knowledgeBase.summary}
        </p>
        <div className="overflow-hidden rounded-xl border-[1.5px] border-(--color-border-ui)">
          {GUIDE_PAGE_CONTENT.scoringBenchmarking.knowledgeBase.sources.map((src, i) => (
            <div
              key={src.name}
              className={cn(
                'flex items-center justify-between gap-4 px-4 py-3',
                i % 2 === 1 && 'bg-(--color-table-stripe)',
                i !== GUIDE_PAGE_CONTENT.scoringBenchmarking.knowledgeBase.sources.length - 1 &&
                  'border-b-[1.5px] border-(--color-border-faint)',
              )}
            >
              <div>
                <p className="text-sm font-medium text-(--color-text-primary)">{src.name}</p>
                <p className="text-xs text-(--color-text-muted)">{src.type}</p>
              </div>
              <span className="font-mono text-sm font-bold text-(--color-accent)">{src.count}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-(--color-text-muted) italic">
          {GUIDE_PAGE_CONTENT.scoringBenchmarking.knowledgeBase.searchNote}
        </p>
      </div>

      {/* R-Strategy Alignment */}
      <div id="r-strategy" className="mt-10 scroll-mt-24">
        <h3 className="mb-5 font-sniglet text-lg text-(--color-text-primary)">
          R-Strategy Alignment
        </h3>
        <p className="mb-5 text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.scoringBenchmarking.rStrategy.explanation}
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDE_PAGE_CONTENT.scoringBenchmarking.rStrategy.strategies.map((s) => (
            <div
              key={s.code}
              className={cn(
                'rounded-xl bg-(--color-success-soft-ui) p-3',
                R_STRATEGY_COLORS[s.code],
              )}
            >
              <p
                className="mb-0.5 text-sm font-semibold"
                style={{
                  color: (() => {
                    const classes = R_STRATEGY_COLORS[s.code];
                    // Find the class containing the variable, e.g., "border-(--color-success)"
                    const colorClass = classes.split(' ').find((c) => c.includes('(--'));
                    if (colorClass) {
                      // Extract what is inside the parentheses: --color-success
                      const match = colorClass.match(/\(([^)]+)\)/);
                      if (match) {
                        return `var(${match[1]})`;
                      }
                    }
                    // fallback
                    return 'var(--color-success)';
                  })(),
                }}
              >
                {s.code}
              </p>
              <p className="text-xs text-(--color-text-muted)">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
