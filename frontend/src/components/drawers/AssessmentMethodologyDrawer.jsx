import { Drawer } from '@heroui/react';
import { BookCopy, ChartSpline, TriangleAlert } from 'lucide-react';
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
                  <p className="mt-0.5 text-[0.7rem] font-normal text-[#6b5f56]">
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
                  6,000+ high-quality circular economy projects
                </strong>
                .
              </p>

              {/* Methodology cards */}
              <div className="space-y-3">
                {ASSESSMENT_METHODOLOGY_CONTENT.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex cursor-default items-start gap-3.5 rounded-2xl bg-(--color-bg-card) p-4 transition-colors duration-300 ease-out"
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
                      <span className="text-[0.6875rem] leading-relaxed text-(--color-text-muted)">
                        {item.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Data source card */}
              <div className="flex cursor-default items-start gap-3.5 rounded-2xl bg-(--color-bg-card) p-4 transition-colors duration-300 select-none">
                <div className="mt-0.5 shrink-0 rounded-xl bg-(--color-success-light) p-2.5">
                  <BookCopy className="size-4 text-(--color-success)" strokeWidth={1.75} />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[0.8125rem] leading-snug font-medium text-(--color-text-primary)">
                    Data Source
                  </span>
                  <p className="text-[0.6875rem] leading-relaxed text-(--color-text-muted)">
                    <strong className="font-semibold text-(--color-text-primary)">
                      GreenTechGuardians AI EarthHack Dataset:
                    </strong>{' '}
                    A curated collection of{' '}
                    <strong className="font-semibold text-(--color-text-primary)">
                      4,000+ high-quality
                    </strong>{' '}
                    circular economy solutions (filtered from 1,300) spanning waste reduction,
                    resource optimization, renewable energy, sustainable materials, and regenerative
                    agriculture across multiple industries and geographic regions.
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-3 rounded-xl border-l-4 border-l-(--color-danger) bg-danger-soft p-4">
                <TriangleAlert
                  className="mt-0.5 size-4 shrink-0 text-(--color-danger)"
                  strokeWidth={1.75}
                />
                <p className="text-xs/relaxed text-(--color-text-muted)">
                  <strong className="font-semibold text-(--color-text-primary)">
                    Disclaimer:{' '}
                  </strong>
                  This assessment is designed to provide{' '}
                  <strong className="font-semibold text-(--color-text-primary)">
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
