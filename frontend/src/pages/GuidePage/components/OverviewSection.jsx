/**
 * Guide `#overview` section — assessment flow, data sources, and evaluation layers.
 */

import { BookCopy, Database, FileText, Globe, Target } from 'lucide-react';

import { Chip } from '@/components/common';
import { cn } from '@/utils/cn';

import GuideSectionHeading from './GuideSectionHeading';
import GUIDE_PAGE_CONTENT from '../content/guidePageContent';

/**
 * Renders the guide overview section with methodology cards, source categories, and output layers.
 *
 * @returns {import('react').ReactElement} Overview section with anchors used by the Guide TOC.
 */
export default function OverviewSection() {
  return (
    <section id="overview" className="scroll-mt-24">
      <GuideSectionHeading>Overview</GuideSectionHeading>
      <p className="mb-2 text-sm text-(--color-text-muted)">
        Learn how our AI-powered circular economy assessment works
      </p>
      {GUIDE_PAGE_CONTENT.overview.intro && (
        <p className="mb-8 max-w-2xl text-sm/relaxed text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.overview.intro}
        </p>
      )}

      {/* How It Works */}
      <div id="how-it-works" className="scroll-mt-24">
        <h3 className="mb-4 font-sniglet text-lg text-(--color-text-primary)">How It Works</h3>
        <p className="mb-6 text-sm text-(--color-text-secondary)">
          Our evaluation combines semantic vector search, evidence-based AI reasoning, and
          multi-dimensional scoring to produce actionable assessments grounded in 40,000+ real-world
          circular economy case studies.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {GUIDE_PAGE_CONTENT.overview.methodologyItems.map((item, idx) => (
            <div key={idx} className="rounded-xl bg-(--color-warning-alpha-5) p-4">
              <div className="w-fit rounded-lg bg-(--color-bg) p-2">
                <item.icon className="size-5 text-(--color-accent)" />
              </div>
              <h4 className="mt-2 mb-1 text-sm font-semibold text-(--color-text-primary)">
                {item.title}
              </h4>
              <p className="text-xs/relaxed text-(--color-text-muted)">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Data Sources */}
      <div id="data-sources" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-sniglet text-lg text-(--color-text-primary)">Data Sources</h3>
        <p className="mb-6 text-sm text-(--color-text-secondary)">
          {GUIDE_PAGE_CONTENT.overview.dataSources.subtitle}
        </p>

        {/* Data Categories */}
        <div className="space-y-6">
          {GUIDE_PAGE_CONTENT.overview.dataSources.categories.map((category, catIdx) => {
            const CATEGORY_COLORS = [
              { bg: 'bg-(--color-info-soft)', text: 'text-(--color-info)' },
              { bg: 'bg-(--color-success-soft-ui)', text: 'text-(--color-success)' },
              { bg: 'bg-(--color-warning-soft-ui)', text: 'text-(--color-warning)' },
              { bg: 'bg-(--color-accent-soft-ui)', text: 'text-(--color-accent)' },
            ];
            const colors = CATEGORY_COLORS[catIdx % CATEGORY_COLORS.length];

            const getIcon = (iconName) => {
              switch (iconName) {
                case 'Globe':
                  return Globe;
                case 'FileText':
                  return FileText;
                case 'Database':
                  return Database;
                case 'Target':
                  return Target;
                default:
                  return BookCopy;
              }
            };
            const IconComponent = getIcon(category.icon);

            return (
              <div
                key={catIdx}
                className="rounded-xl border border-(--color-border-ui) bg-(--color-surface-raised) p-4"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={cn(
                      'flex shrink-0 items-center justify-center rounded-lg p-2',
                      colors.bg,
                    )}
                  >
                    <IconComponent className={colors.text} size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-(--color-text-primary)">
                      {category.name}
                    </h4>
                    <p className="text-xs text-(--color-text-muted)">{category.description}</p>
                  </div>
                </div>

                {/* Datasets Grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {category.datasets.map((dataset, dsIdx) => (
                    <div
                      key={dsIdx}
                      className="flex flex-col gap-2 rounded-xl border border-(--color-border-faint) bg-(--color-bg-card) p-3"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-(--color-text-primary)">
                          {dataset.name}
                        </span>
                        <Chip className="w-fit shadow-sm">{dataset.count}</Chip>
                      </div>
                      <p className="text-xs/relaxed text-(--color-text-muted)">
                        {dataset.description}
                      </p>
                      <p className="font-mono text-[0.65rem] text-(--color-text-muted)">
                        Source: {dataset.source}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assessment Layers */}
      <div id="assessment-layers" className="mt-10 scroll-mt-24">
        <h3 className="mb-4 font-sniglet text-lg text-(--color-text-primary)">Assessment Layers</h3>
        <div className="space-y-1">
          {GUIDE_PAGE_CONTENT.overview.layers.map((layer) => (
            <div
              key={layer.number}
              className="flex items-start gap-3 border-b border-(--color-border-faint) py-3 last:border-b-0"
            >
              <div
                className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                  layer.color === 'accent'
                    ? 'bg-(--color-accent) text-white'
                    : layer.color === 'success'
                      ? 'bg-(--color-success) text-white'
                      : 'bg-(--color-info) text-white'
                }`}
              >
                {layer.number}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-(--color-text-primary)">{layer.name}</h4>
                {layer.description && (
                  <p className="mb-1.5 text-xs text-(--color-text-muted)">{layer.description}</p>
                )}
                <div className="mt-1 flex flex-wrap gap-1">
                  {layer.outputs.map((output) => (
                    <Chip key={output} variant="info" size="sm">
                      {output}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-lg border border-(--color-warning-border) bg-(--color-warning-soft-ui) px-4 py-3 text-sm text-(--color-text-secondary)">
          <strong className="text-(--color-warning)">Note:</strong> This assessment is designed for
          constructive feedback during early-stage ideation. Scores reflect alignment with circular
          economy principles — use as guidance, not commercial validation.
        </div>
      </div>
    </section>
  );
}
