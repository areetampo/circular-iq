/**
 * Guide page section — Getting Started.
 */

import { Info } from 'lucide-react';

import { cn } from '@/utils/cn';

import GuideSectionHeading from './GuideSectionHeading';
import GUIDE_PAGE_CONTENT from '../content/guidePageContent';

/**
 * Renders quickstart steps, anonymous versus signed-in limits, and best-practice tips.
 *
 * @returns {import('react').ReactElement} Getting-started section with TOC anchor subsections.
 */
export default function GettingStartedSection() {
  return (
    <section id="getting-started" className="scroll-mt-24">
      <GuideSectionHeading>Getting Started</GuideSectionHeading>
      <p className="mb-2 text-sm text-(--color-text-muted)">
        {GUIDE_PAGE_CONTENT.gettingStarted.subtitle}
      </p>
      <p className="mb-10 max-w-2xl text-sm/relaxed text-(--color-text-secondary)">
        {GUIDE_PAGE_CONTENT.gettingStarted.intro}
      </p>

      {/* Quickstart Steps */}
      <div id="quickstart-steps" className="scroll-mt-24">
        <h3 className="mb-5 font-sniglet text-lg text-(--color-text-primary)">Quickstart Steps</h3>
        <ol className="space-y-4">
          {GUIDE_PAGE_CONTENT.gettingStarted.quickstartSteps.map((step) => (
            <li key={step.number} className="flex items-start gap-4">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--color-accent) font-mono text-sm font-bold text-white">
                {step.number}
              </div>
              <div className="flex-1 rounded-xl border border-(--color-border-ui) bg-(--color-surface-raised) px-4 py-3">
                <p className="mb-0.5 text-sm font-semibold text-(--color-text-primary)">
                  {step.title}
                </p>
                <p className="text-xs/relaxed text-(--color-text-muted)">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        {GUIDE_PAGE_CONTENT.gettingStarted.autoFillNote && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-(--color-border-faint) bg-(--color-surface-raised) px-4 py-3">
            <Info className="mt-0.5 size-3.5 shrink-0 text-(--color-text-muted)" />
            <p className="text-xs/relaxed text-(--color-text-muted)">
              <span className="font-medium">Auto-fill:</span>{' '}
              {GUIDE_PAGE_CONTENT.gettingStarted.autoFillNote}
            </p>
          </div>
        )}
      </div>

      {/* Anonymous vs Signed In */}
      <div id="anon-vs-auth" className="mt-10 scroll-mt-24">
        <h3 className="mb-5 font-sniglet text-lg text-(--color-text-primary)">
          Anonymous vs. Signed In
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            GUIDE_PAGE_CONTENT.gettingStarted.anonymousVsAuth.anonymous,
            GUIDE_PAGE_CONTENT.gettingStarted.anonymousVsAuth.authenticated,
          ].map((mode, i) => (
            <div
              key={mode.title}
              className={cn(
                'rounded-xl border p-4',
                i === 0
                  ? 'border-(--color-border-ui) bg-(--color-surface-raised)'
                  : 'border-(--color-success-border) bg-(--color-success-soft-ui)',
              )}
            >
              <p
                className={cn(
                  'mb-3 text-sm font-semibold',
                  i === 0 ? 'text-(--color-text-primary)' : 'text-(--color-success)',
                )}
              >
                {mode.title}
              </p>
              <ul className="space-y-1.5">
                {mode.points.map((point, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-(--color-text-muted)">
                    <span
                      className={cn(
                        'mt-0.5 size-1.5 shrink-0 rounded-full',
                        i === 0 ? 'bg-(--color-text-muted)' : 'bg-(--color-success)',
                      )}
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Tips for Best Results */}
      <div id="tips-for-best-results" className="mt-10 scroll-mt-24">
        <h3 className="mb-5 font-sniglet text-lg text-(--color-text-primary)">
          Tips for Best Results
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {GUIDE_PAGE_CONTENT.gettingStarted.bestPracticeTips.map((tip) => (
            <div
              key={tip.title}
              className="rounded-xl border border-(--color-border-ui) bg-(--color-surface-raised) p-4"
            >
              <p className="mb-1 text-sm font-semibold text-(--color-text-primary)">{tip.title}</p>
              <p className="text-xs/relaxed text-(--color-text-muted)">{tip.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
