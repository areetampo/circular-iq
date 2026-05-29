/**
 * Guide page section — Business Context.
 */

import { MoveRight } from 'lucide-react';

import GuideSectionHeading from './GuideSectionHeading';
import GUIDE_PAGE_CONTENT from '../content/guidePageContent';

/**
 * Renders context-field guidance and why those fields improve benchmark calibration.
 *
 * @returns {import('react').ReactElement} Business-context section with TOC anchor subsections.
 */
export default function BusinessContextSection() {
  return (
    <section id="business-context" className="scroll-mt-24">
      <GuideSectionHeading>Business Context</GuideSectionHeading>
      {GUIDE_PAGE_CONTENT.businessContext.intro ? (
        <p className="mb-8 max-w-2xl text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.businessContext.intro}
        </p>
      ) : (
        <p className="mb-8 text-sm text-(--color-text-muted)">
          These optional fields improve AI calibration by providing structured context about your
          business, enabling stage-appropriate benchmarking and more precise recommendations.
        </p>
      )}

      {/* Why It Matters */}
      <div id="context-why" className="scroll-mt-24">
        <h3 className="mb-4 font-sniglet text-lg text-(--color-text-primary)">Why It Matters</h3>
        <p className="mb-4 text-sm/relaxed text-(--color-text-secondary)">
          Business context fields feed directly into the AI&apos;s benchmarking calibration. Without
          them, the model compares your submission against all 40,000+ cases indiscriminately. With
          them, it narrows the comparison to cases that match your stage, model type, and geography
          — producing more relevant scores and recommendations.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: 'Stage-Appropriate Benchmarks',
              desc: 'An idea-stage submission is not compared against mature operations — the scoring expectations adjust to your operational stage.',
            },
            {
              label: 'Model-Specific Comparisons',
              desc: 'A Product-as-a-Service business is compared with other PaaS cases, not against recycling operations with very different economics.',
            },
            {
              label: 'Geographic Context',
              desc: 'Infrastructure availability, regulatory environment, and market maturity vary significantly by region — context fields capture this.',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-(--color-border-ui) bg-(--color-surface-raised) p-4"
            >
              <p className="mb-1 text-sm font-semibold text-(--color-text-primary)">{item.label}</p>
              <p className="text-xs/relaxed text-(--color-text-muted)">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Field Definitions */}
      <div id="context-fields" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-sniglet text-lg text-(--color-text-primary)">Field Definitions</h3>
        <div className="space-y-1">
          {GUIDE_PAGE_CONTENT.businessContext.fields.map((field, idx) => (
            <div key={idx} className="border-b border-(--color-border-faint) py-4 last:border-b-0">
              <p className="mb-0.5 text-sm font-semibold text-(--color-text-primary)">
                {field.title}
              </p>
              <p className="mb-1.5 text-sm text-(--color-text-secondary)">{field.description}</p>
              <div className="flex items-center gap-1.5">
                <MoveRight className="mt-0.5 size-3 shrink-0 text-(--color-accent)" />
                <p className="text-xs text-(--color-text-primary)/75">{field.hint}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
