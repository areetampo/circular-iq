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
                <div className="w-8 h-8 rounded-lg bg-[rgba(45,90,61,0.1)] flex items-center justify-center shrink-0">
                  <ChartSpline size={16} className="text-[#2d5a3d]" strokeWidth={1.75} />
                </div>
                <div>
                  <Drawer.Heading className="drawer__heading">
                    {ASSESSMENT_METHODOLOGY_CONTENT.title}
                  </Drawer.Heading>
                  <p className="text-[0.7rem] text-[#6b5f56] mt-0.5 font-normal">
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
                <strong className="font-semibold text-(--color-text-primary)">
                  6,000+ high-quality circular economy projects
                </strong>
                .
              </p>

              {/* Methodology cards */}
              <div className="space-y-3">
                {ASSESSMENT_METHODOLOGY_CONTENT.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3.5 p-4 rounded-2xl border border-(--color-border) bg-(--color-accent-light) transition-colors duration-300 ease-out cursor-default"
                  >
                    {/* Animated icon */}
                    <div className="shrink-0 p-2.5 rounded-xl mt-0.5 bg-(--color-accent-light)">
                      {React.createElement(item.icon, {
                        className: cn('size-4', item.iconColor),
                        strokeWidth: 1.75,
                      })}
                    </div>

                    {/* Text */}
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-[0.8125rem] font-bold leading-snug text-(--color-text-primary)">
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
              <div className="flex items-start gap-3.5 p-4 rounded-2xl border border-(--color-border) bg-(--color-accent-light) transition-colors duration-300 cursor-default select-none">
                <div className="shrink-0 p-2.5 rounded-xl mt-0.5 bg-(--color-success-light)">
                  <BookCopy className="size-4 text-(--color-success)" strokeWidth={1.75} />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[0.8125rem] font-bold leading-snug text-(--color-text-primary)">
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
              <div className="flex items-start gap-3 p-4 rounded-xl border-l-4 bg-(--color-danger-soft) border-l-(--color-danger)">
                <TriangleAlert
                  className="size-4 shrink-0 mt-0.5 text-(--color-danger)"
                  strokeWidth={1.75}
                />
                <p className="text-xs leading-relaxed text-(--color-text-muted)">
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
