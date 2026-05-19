/**
 * @module BusinessSolutionSection
 * @description Guide page section — Business Solution.
 */

import { Check, Info, X } from 'lucide-react';

import GuideSectionHeading from './GuideSectionHeading';
import GUIDE_PAGE_CONTENT from '../content/guidePageContent';

/**
 * Renders the Business Solution guide section (`#business-solution`) — components, loop, pitfalls, and example.
 * @returns {import('react').ReactElement}
 */
export default function BusinessSolutionSection() {
  return (
    <section id="business-solution" className="scroll-mt-24">
      <GuideSectionHeading>Business Solution</GuideSectionHeading>
      {GUIDE_PAGE_CONTENT.businessSolution.intro && (
        <p className="mb-8 max-w-2xl text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.businessSolution.intro}
        </p>
      )}

      {GUIDE_PAGE_CONTENT.businessSolution.scoringImpact && (
        <div className="mb-8 flex items-start gap-3 rounded-lg border border-(--color-border-faint) bg-(--color-surface-raised) px-4 py-3">
          <Info className="mt-0.5 size-3.5 shrink-0 text-(--color-text-muted)" />
          <p className="text-xs/relaxed text-(--color-text-muted)">
            {GUIDE_PAGE_CONTENT.businessSolution.scoringImpact}
          </p>
        </div>
      )}

      {/* Critical Components */}
      <div id="solution-components" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-sniglet text-lg text-(--color-text-primary)">
          Critical Components
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {GUIDE_PAGE_CONTENT.businessSolution.components.map(({ title, description }) => (
            <div
              key={title}
              className="rounded-lg border border-(--color-border-ui) bg-(--color-surface-raised) p-3"
            >
              <p className="mb-1 text-sm font-semibold text-(--color-text-primary)">{title}</p>
              <p className="text-xs text-(--color-text-muted)">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* The Circularity Loop */}
      <div id="circularity-loop" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-sniglet text-lg text-(--color-text-primary)">
          The Circularity Loop
        </h3>
        <p className="mb-5 text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.businessSolution.circularityLoopExplainer.intro}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-(--color-success-border) bg-(--color-success-soft-ui) p-4">
            <p className="mb-3 text-xs font-bold tracking-wider text-(--color-success) uppercase">
              Strong Loop Signals
            </p>
            <ul className="space-y-2">
              {GUIDE_PAGE_CONTENT.businessSolution.circularityLoopExplainer.strongLoop.map(
                (item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-(--color-text-secondary)"
                  >
                    <Check className="mt-0.5 size-3.5 shrink-0 text-(--color-success)" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
          <div className="rounded-xl border border-(--color-warning-border) bg-(--color-warning-soft-ui) p-4">
            <p className="mb-3 text-xs font-bold tracking-wider text-(--color-warning) uppercase">
              Weak Loop Signals
            </p>
            <ul className="space-y-2">
              {GUIDE_PAGE_CONTENT.businessSolution.circularityLoopExplainer.weakLoop.map(
                (item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-(--color-text-secondary)"
                  >
                    <X className="mt-0.5 size-3.5 shrink-0 text-(--color-warning)" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Common Pitfalls */}
      <div id="solution-pitfalls" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-sniglet text-lg text-(--color-text-primary)">Common Pitfalls</h3>
        <div className="space-y-2 rounded-lg border border-(--color-warning-border) bg-(--color-warning-soft-ui) p-4">
          <p className="mb-3 text-xs font-bold tracking-wider text-(--color-warning) uppercase">
            Common Pitfalls
          </p>
          {GUIDE_PAGE_CONTENT.businessSolution.pitfalls.map((pitfall, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <X className="mt-0.5 size-3.5 shrink-0 text-(--color-warning)" />
              <div>
                <span className="font-semibold text-(--color-text-primary)">
                  {typeof pitfall === 'string' ? pitfall : pitfall.title || pitfall}:{' '}
                </span>
                <span className="text-(--color-text-muted)">
                  {typeof pitfall === 'string' ? '' : pitfall.description || ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pro Tips */}
      <div id="solution-tips" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-sniglet text-lg text-(--color-text-primary)">Pro Tips</h3>
        <div className="space-y-2 rounded-lg border border-(--color-success-border) bg-(--color-success-soft-ui) p-4">
          <p className="mb-3 text-xs font-bold tracking-wider text-(--color-success) uppercase">
            Pro Tips
          </p>
          {GUIDE_PAGE_CONTENT.businessSolution.proTips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-(--color-text-secondary)">
              <Check className="mt-0.5 size-3.5 shrink-0 text-(--color-success)" />
              {tip}
            </div>
          ))}
        </div>
      </div>

      {/* Example */}
      <div id="solution-example" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-sniglet text-lg text-(--color-text-primary)">Example Statement</h3>
        <blockquote className="rounded-lg border-l-4 border-(--color-accent) bg-(--color-accent-light) p-3 font-mono text-sm text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.businessSolution.example}
        </blockquote>
      </div>

      {/* Minimum character note */}
      <div className="mt-6 flex items-start gap-3 rounded-lg bg-(--color-info-soft-ui) p-2">
        <Info className="mt-0.5 size-4 shrink-0 text-(--color-info)" />
        <div className="flex-1">
          <p className="text-sm font-medium text-(--color-text-primary)">
            Minimum 200 characters required
          </p>
          <p className="text-xs text-(--color-text-muted)">
            Longer descriptions help the AI provide more accurate analysis and better scoring.
          </p>
        </div>
      </div>
    </section>
  );
}
