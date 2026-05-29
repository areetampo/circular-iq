/**
 * Guide page section — Understanding Results.
 */

import { Table } from '@heroui/react';
import { Info } from 'lucide-react';

import GuideSectionHeading from './GuideSectionHeading';
import GUIDE_PAGE_CONTENT from '../content/guidePageContent';

/**
 * Renders result-section explanations, improvement-roadmap fields, SDG notes, evidence copy, and export guidance.
 *
 * @returns {import('react').ReactElement} Understanding-results section with TOC anchor subsections.
 */
export default function UnderstandingResultsSection() {
  return (
    <section id="understanding-results" className="scroll-mt-24">
      <GuideSectionHeading>Understanding Results</GuideSectionHeading>
      <p className="mb-2 text-sm text-(--color-text-muted)">
        {GUIDE_PAGE_CONTENT.understandingResults.subtitle}
      </p>
      <p className="mb-10 max-w-2xl text-sm/relaxed text-(--color-text-secondary)">
        {GUIDE_PAGE_CONTENT.understandingResults.intro}
      </p>

      {/* Results Overview */}
      <div id="results-overview" className="scroll-mt-24">
        <h3 className="mb-5 font-sniglet text-lg text-(--color-text-primary)">Results Overview</h3>
        <div className="space-y-3">
          {GUIDE_PAGE_CONTENT.understandingResults.sections
            .filter(
              (s) =>
                !['Improvement Roadmap', 'SDG Alignment', 'Database Evidence'].includes(s.title),
            )
            .map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl bg-(--color-warning-soft-ui) p-4"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-(--color-border-ui) bg-(--color-warning-soft-mid) font-mono text-xs font-bold">
                  {i + 1}
                </div>
                <div>
                  <p className="mb-1 text-sm font-semibold text-(--color-text-primary)">
                    {s.title}
                  </p>
                  <p className="text-xs/relaxed text-(--color-text-muted)">{s.description}</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Improvement Roadmap */}
      <div id="improvement-roadmap" className="mt-10 scroll-mt-24">
        <h3 className="mb-5 font-sniglet text-lg text-(--color-text-primary)">
          Improvement Roadmap
        </h3>
        <p className="mb-5 text-sm/relaxed text-(--color-text-secondary)">
          {
            GUIDE_PAGE_CONTENT.understandingResults.sections.find(
              (s) => s.title === 'Improvement Roadmap',
            )?.description
          }
        </p>
        <p className="mb-4 text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.understandingResults.improvementRoadmapDetail.howGenerated}
        </p>
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Action fields table">
              <Table.Header>
                <Table.Column
                  isRowHeader
                  className="px-3 py-2 font-semibold text-(--color-text-muted)"
                >
                  Field
                </Table.Column>
                <Table.Column className="px-3 py-2 font-semibold text-(--color-text-muted)">
                  Description
                </Table.Column>
              </Table.Header>
              <Table.Body>
                {GUIDE_PAGE_CONTENT.understandingResults.improvementRoadmapDetail.actionFields.map(
                  (f) => (
                    <Table.Row key={f.field}>
                      <Table.Cell className="px-3 py-2">
                        <p className="text-xs font-semibold text-(--color-accent)">{f.field}</p>
                      </Table.Cell>
                      <Table.Cell className="px-3 py-2">
                        <p className="text-xs text-(--color-text-muted)">{f.desc}</p>
                      </Table.Cell>
                    </Table.Row>
                  ),
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>

      {/* SDG Alignment */}
      <div id="sdg-alignment" className="mt-10 scroll-mt-24">
        <h3 className="mb-5 font-sniglet text-lg text-(--color-text-primary)">SDG Alignment</h3>
        <p className="mb-4 text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.understandingResults.sdgDetail.explanation}
        </p>
        <div className="space-y-2">
          {GUIDE_PAGE_CONTENT.understandingResults.sdgDetail.commonSDGs.map((sdg) => (
            <div
              key={sdg.goal}
              className="flex items-start gap-3 rounded-xl border border-(--color-border-ui) bg-(--color-accent-soft-ui) px-4 py-3"
            >
              <span className="shrink-0 rounded-md border border-(--color-info-alpha-50) bg-(--color-info-soft) px-2 py-0.5 font-mono text-[11px] font-bold text-(--color-info)">
                {sdg.goal}
              </span>
              <div>
                <p className="text-xs font-semibold text-(--color-text-primary)">{sdg.name}</p>
                <p className="text-xs text-(--color-text-muted)">{sdg.relevance}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Database Evidence */}
      <div id="database-evidence" className="mt-10 scroll-mt-24">
        <h3 className="mb-5 font-sniglet text-lg text-(--color-text-primary)">Database Evidence</h3>
        {(() => {
          const s = GUIDE_PAGE_CONTENT.understandingResults.sections.find(
            (s) => s.title === 'Database Evidence',
          );
          return s ? (
            <>
              <p className="mb-4 text-sm/relaxed text-(--color-text-secondary)">{s.description}</p>
              <div className="rounded-lg border border-(--color-border-faint) bg-(--color-surface-raised) px-4 py-3">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 size-4 shrink-0 text-(--color-text-muted)" />
                  <p className="text-sm text-(--color-text-secondary)">
                    {GUIDE_PAGE_CONTENT.understandingResults.exportNote}
                  </p>
                </div>
              </div>
            </>
          ) : null;
        })()}
      </div>

      {/* Saving & Exporting */}
      <div id="saving-exporting" className="mt-10 scroll-mt-24">
        <h3 className="mb-5 font-sniglet text-lg text-(--color-text-primary)">
          Saving & Exporting
        </h3>
        <div className="mb-6 space-y-2">
          {GUIDE_PAGE_CONTENT.understandingResults.savingAndExporting.saving.map((item) => (
            <div
              key={item.action}
              className="rounded-lg border border-(--color-border-ui) bg-(--color-surface-raised) px-4 py-3"
            >
              <p className="mb-0.5 text-sm font-semibold text-(--color-text-primary)">
                {item.action}
              </p>
              <p className="text-xs text-(--color-text-muted)">{item.how}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {GUIDE_PAGE_CONTENT.understandingResults.savingAndExporting.exporting.map((fmt) => (
            <div
              key={fmt.format}
              className="rounded-xl border border-(--color-border-ui) bg-(--color-surface-raised) p-4"
            >
              <p className="mb-1 font-mono text-sm font-bold text-(--color-accent)">
                .{fmt.format.toLowerCase()}
              </p>
              <p className="text-xs/relaxed text-(--color-text-muted)">{fmt.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
