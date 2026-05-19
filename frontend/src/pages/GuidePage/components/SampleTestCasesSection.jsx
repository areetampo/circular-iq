/**
 * @module SampleTestCasesSection
 * @description Guide page section — Sample Test Cases.
 */

import { CircleCheck, Lightbulb } from 'lucide-react';

import GuideSectionHeading from './GuideSectionHeading';
import GUIDE_PAGE_CONTENT from '../content/guidePageContent';

/**
 * Renders the Sample Test Cases guide section (`#sample-test-cases`) — how to load and use preset inputs.
 * @returns {import('react').ReactElement}
 */
export default function SampleTestCasesSection() {
  return (
    <section id="sample-test-cases" className="scroll-mt-24">
      <GuideSectionHeading>Sample Test Cases</GuideSectionHeading>
      <p className="mb-2 text-sm text-(--color-text-muted)">
        Real circular economy business examples for reference
      </p>
      {GUIDE_PAGE_CONTENT.sampleTestCases.intro && (
        <p className="mb-8 max-w-2xl text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.sampleTestCases.intro}
        </p>
      )}

      {/* Description + Benefits */}
      <div className="mb-8">
        <p className="mb-4 text-sm text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.sampleTestCases.description}
        </p>
        <ul className="space-y-2">
          {GUIDE_PAGE_CONTENT.sampleTestCases.benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-(--color-text-secondary)">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-(--color-success)" />
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* How to Use */}
      <div id="test-cases-how-to" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-sniglet text-lg text-(--color-text-primary)">How to Use</h3>
        <div className="space-y-1">
          {GUIDE_PAGE_CONTENT.sampleTestCases.steps.map((step) => (
            <div
              key={step.num}
              className="flex items-start gap-3 border-b border-(--color-border-faint) py-3 last:border-b-0"
            >
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-(--color-border-ui) bg-(--color-warning-soft-10) font-mono text-xs font-bold text-(--color-accent)">
                {step.num}
              </div>
              <div>
                <p className="mb-0.5 text-sm font-semibold text-(--color-text-primary)">
                  {step.title}
                </p>
                <p className="text-xs text-(--color-text-muted)">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip callout */}
      <div className="mt-4 flex items-start gap-3 rounded-lg border border-(--color-accent-border) bg-(--color-accent-light) px-4 py-3">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-(--color-accent)" />
        <p className="text-sm text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.sampleTestCases.tip}
        </p>
      </div>
    </section>
  );
}
