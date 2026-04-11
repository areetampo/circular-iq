import { Drawer, Separator } from '@heroui/react';
import {
  BookCopy,
  ChartSpline,
  Database,
  FileText,
  Globe,
  Target,
  TriangleAlert,
} from 'lucide-react';
import React from 'react';

import { ASSESSMENT_METHODOLOGY_CONTENT } from '@/constants/drawers';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';
import { cn } from '@/utils/cn';

export default function AssessmentMethodologyDrawer() {
  const { isDrawerOpen, onClose } = useGlobalDrawer();
  const direction = useDrawerDirection();

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Drawer.Backdrop>
        <Drawer.Content placement={direction}>
          <Drawer.Dialog>
            {direction === 'bottom' ? (
              <Drawer.Handle />
            ) : (
              <Drawer.CloseTrigger aria-label="Close" />
            )}
            {/* ── HEADER ─────────────────────────────────────────────── */}
            <Drawer.Header>
              <div className="flex items-center gap-3 pr-8">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(45,90,61,0.1)]">
                  <ChartSpline size={16} className="text-[#2d5a3d]" strokeWidth={1.75} />
                </div>
                <div>
                  <Drawer.Heading className="drawer__heading">
                    {ASSESSMENT_METHODOLOGY_CONTENT.title}
                  </Drawer.Heading>
                  <p className="mt-0.5 text-[0.7rem] font-normal text-(--color-text-secondary)">
                    {ASSESSMENT_METHODOLOGY_CONTENT.subtitle}
                  </p>
                </div>
              </div>
            </Drawer.Header>

            {/* ── BODY ───────────────────────────────────────────────── */}
            <Drawer.Body className="space-y-5">
              {/* Intro */}
              <p className="text-[0.8125rem] leading-relaxed text-(--color-text-muted)">
                This evaluation uses a proprietary AI-powered framework combining vector similarity
                search with GPT-4o-mini reasoning against a database of{' '}
                <strong className="font-medium text-(--color-text-primary)">
                  40,000+ high-quality circular economy projects
                </strong>
                .
              </p>

              {/* Methodology cards */}
              <div className="space-y-3">
                {ASSESSMENT_METHODOLOGY_CONTENT.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex cursor-default items-start gap-3.5 rounded-2xl bg-(--color-bg-card) transition-colors duration-300 ease-out"
                  >
                    {/* Animated icon */}
                    <div className="mt-0.5 shrink-0 rounded-xl bg-(--color-accent-light) p-2.5">
                      {React.createElement(item.icon, {
                        className: cn('size-4', item.iconColor),
                        strokeWidth: 1.75,
                      })}
                    </div>

                    {/* Text */}
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="text-[0.8125rem] leading-snug font-medium text-(--color-text-primary)">
                        {item.title}
                      </span>
                      <span className="text-xs text-(--color-text-muted)">{item.description}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex w-full justify-center">
                <Separator className="w-3/5" variant="secondary" />
              </div>

              {/* Data Sources Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex shrink-0 items-center justify-center rounded-lg bg-(--color-success-soft-ui) p-2">
                    <BookCopy className="text-(--color-success)" size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <span className="text-[0.8125rem] leading-snug font-medium text-(--color-text-primary)">
                      {ASSESSMENT_METHODOLOGY_CONTENT.dataSources.title}
                    </span>
                    <p className="text-sm text-(--color-text-muted)">
                      {ASSESSMENT_METHODOLOGY_CONTENT.dataSources.subtitle}
                    </p>
                  </div>
                </div>

                {/* Data Categories */}
                <div className="space-y-6">
                  {ASSESSMENT_METHODOLOGY_CONTENT.dataSources.categories.map((category, catIdx) => {
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
                        className="w-full rounded-xl transition-colors duration-300"
                      >
                        <div className="mb-4 flex items-center gap-3 pl-3">
                          <div className="mt-0.5 shrink-0 rounded-lg bg-(--color-accent-light) p-2">
                            <IconComponent
                              className="text-(--color-accent)"
                              size={16}
                              strokeWidth={2}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-medium text-(--color-text-primary)">
                              {category.name}
                            </h4>
                            <p className="mt-0.5 text-xs text-(--color-text-muted)">
                              {category.description}
                            </p>
                          </div>
                        </div>

                        {/* Datasets Grid */}
                        <div className="grid gap-2 sm:grid-cols-2">
                          {category.datasets
                            // .slice(0, 4)
                            .map((dataset, dsIdx) => (
                              <div
                                key={dsIdx}
                                className="flex flex-col gap-2 rounded-xl border-[1.5px] border-(--color-border-ui) bg-(--color-success)/5 px-2 py-1 text-[0.7rem] leading-relaxed text-(--color-text-muted) [&>*:last-child]:mt-auto"
                              >
                                <div className="mb-1 flex flex-col justify-center gap-1 font-medium text-(--color-text-secondary)">
                                  <span>{dataset.name}</span>
                                  <span className="w-fit rounded-lg bg-(--color-success-b)/10 px-1.5 py-0.5 text-[0.7rem] text-(--color-text-secondary)">
                                    {dataset.count}
                                  </span>
                                </div>
                                <div className="mt-0.5 text-sm">{dataset.description}</div>
                                <div className="mt-0.5 rounded-lg font-mono text-[0.65rem] text-(--color-text-muted)">
                                  Source: {dataset.source}
                                </div>
                              </div>
                            ))}
                          {/* {category.datasets.length > 4 && (
                                <div className="text-[0.625rem] text-(--color-text-muted) italic">
                                  +{category.datasets.length - 4} more datasets...
                                </div>
                              )} */}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-3 rounded-xl bg-(--color-danger)/10 p-4">
                <TriangleAlert
                  size={20}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-(--color-danger)"
                />
                <p className="text-sm/relaxed text-(--color-text-muted)">
                  <strong className="font-medium text-(--color-danger)">Disclaimer:</strong>
                  <br />
                  This assessment is designed to provide{' '}
                  <strong className="font-medium text-(--color-text-primary)">
                    constructive feedback for early-stage ideation
                  </strong>
                  . Scores reflect alignment with established circular economy principles and should
                  be used as guidance, not as definitive validation of commercial viability.
                </p>
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

AssessmentMethodologyDrawer.propTypes = {};
