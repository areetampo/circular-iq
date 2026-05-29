/**
 * Guide page section — Business Problem.
 */

import { CheckSquare, Info } from 'lucide-react';

import GuideSectionHeading from './GuideSectionHeading';
import GUIDE_PAGE_CONTENT from '../content/guidePageContent';

/**
 * Renders problem-statement guidance, scoring impact copy, writing tips, and an example.
 *
 * @returns {import('react').ReactElement} Business-problem section with TOC anchor subsections.
 */
export default function BusinessProblemSection() {
  return (
    <section id="business-problem" className="scroll-mt-24">
      <GuideSectionHeading>Business Problem</GuideSectionHeading>
      {GUIDE_PAGE_CONTENT.businessProblem.intro && (
        <p className="mb-8 max-w-2xl text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.businessProblem.intro}
        </p>
      )}

      {GUIDE_PAGE_CONTENT.businessProblem.scoringImpact && (
        <div className="mb-8 flex items-start gap-3 rounded-lg border border-(--color-border-faint) bg-(--color-surface-raised) px-4 py-3">
          <Info className="mt-0.5 size-3.5 shrink-0 text-(--color-text-muted)" />
          <p className="text-xs/relaxed text-(--color-text-muted)">
            {GUIDE_PAGE_CONTENT.businessProblem.scoringImpact}
          </p>
        </div>
      )}

      {/* Essential Elements */}
      <div id="problem-elements" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-sniglet text-lg text-(--color-text-primary)">
          Essential Elements
        </h3>
        <div className="space-y-1">
          {GUIDE_PAGE_CONTENT.businessProblem.elements.map((element, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 border-b border-(--color-border-faint) py-3 last:border-b-0"
            >
              <div className="mt-0.5 shrink-0 rounded-md bg-(--color-success-soft-ui) p-1.5">
                <CheckSquare className="size-3.5 text-(--color-success)" />
              </div>
              <div>
                <p className="text-sm font-semibold text-(--color-text-primary)">{element.title}</p>
                <p className="mt-0.5 text-xs text-(--color-text-muted)">{element.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Writing Tips */}
      <div id="problem-tips" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-sniglet text-lg text-(--color-text-primary)">Writing Tips</h3>
        <div className="rounded-lg border border-(--color-info-alpha-20) bg-(--color-info-soft-ui) p-4">
          <p className="mb-3 text-xs font-bold tracking-wider text-(--color-info) uppercase">
            Writing Tips
          </p>
          <ol className="space-y-2">
            {GUIDE_PAGE_CONTENT.businessProblem.writingTips.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-sm text-(--color-text-secondary)"
              >
                <span className="w-5 shrink-0 text-right font-mono text-xs font-bold text-(--color-info)">
                  {i + 1}.
                </span>
                {tip}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Example */}
      <div id="problem-example" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-sniglet text-lg text-(--color-text-primary)">Example Statement</h3>
        <blockquote className="rounded-lg border-l-4 border-(--color-accent) bg-(--color-accent-light) p-3 font-mono text-sm text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.businessProblem.example}
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
