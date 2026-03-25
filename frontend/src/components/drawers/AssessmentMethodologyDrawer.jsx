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
            {direction === 'bottom' && <Drawer.Handle />}
            {direction === 'right' && <Drawer.CloseTrigger aria-label="Close drawer" />}
            {/* ── HEADER ─────────────────────────────────────────────── */}
            <Drawer.Header>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-xl shrink-0',
                      'transition-[transform,box-shadow] duration-300 ease-out',
                      isDrawerOpen
                        ? 'scale-[1.12] -rotate-6 drop-shadow-md'
                        : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                    )}
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                    }}
                  >
                    <ChartSpline
                      className="size-5"
                      style={{ color: 'var(--accent)' }}
                      strokeWidth={1.75}
                    />
                  </div>
                  <div>
                    <Drawer.Heading
                      className="text-base font-semibold"
                      style={{
                        color: 'var(--foreground)',
                      }}
                    >
                      Assessment Methodology
                    </Drawer.Heading>
                    <p
                      className="text-xs mt-0.5"
                      style={{
                        color: 'var(--muted)',
                      }}
                    >
                      Our AI-powered evaluation framework
                    </p>
                  </div>
                </div>
              </div>
            </Drawer.Header>

            {/* ── BODY ───────────────────────────────────────────────── */}
            <Drawer.Body className="space-y-5">
              {/* Intro */}
              <p
                className="text-sm leading-relaxed"
                style={{
                  color: 'var(--muted)',
                }}
              >
                This evaluation uses a proprietary AI-powered framework combining vector similarity
                search with GPT-4o-mini reasoning against a database of{' '}
                <strong className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  6,000+ high-quality circular economy projects
                </strong>
                .
              </p>

              {/* Methodology cards */}
              <div className="space-y-2.5">
                {ASSESSMENT_METHODOLOGY_CONTENT.items.map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'group/card relative flex items-start gap-3.5',
                      'p-4 rounded-xl border border-transparent',
                      'bg-linear-to-br',
                      item.gradientFrom,
                      item.gradientTo,
                      'border-l-4',
                      item.accentBorder,
                      // Hover lift
                      'transition-all duration-300 ease-out cursor-default',
                      'hover:shadow-md hover:border-opacity-100',
                      'hover:-translate-y-0.5',
                    )}
                  >
                    {/* Animated icon */}
                    <div
                      className={cn(
                        'shrink-0 p-2 rounded-lg mt-0.5',
                        item.iconBg,
                        'transition-[transform,box-shadow] duration-300 ease-out',
                        'group-hover/card:scale-110 group-hover/card:-rotate-6 group-hover/card:shadow-md',
                      )}
                    >
                      {React.createElement(item.icon, {
                        className: cn('size-4', item.iconColor),
                        strokeWidth: 1.75,
                      })}
                    </div>

                    {/* Text */}
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span
                        className="text-sm font-bold leading-snug"
                        style={{
                          color: 'var(--foreground)',
                        }}
                      >
                        {item.title}
                      </span>
                      <span
                        className="text-xs leading-relaxed"
                        style={{
                          color: 'var(--muted)',
                        }}
                      >
                        {item.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Data source card */}
              <div
                className="group/card flex items-start gap-3.5 p-4 rounded-xl
                          bg-[var(--success-soft)]
                          border-[var(--success)]
                          transition-all duration-300 hover:shadow-md hover:-translate-y-0.5
                          cursor-default select-none"
              >
                <div
                  className="shrink-0 p-2 rounded-lg bg-[var(--success)] mt-0.5
                            transition-[transform,box-shadow] duration-300
                            group-hover/card:scale-110 group-hover/card:-rotate-6 group-hover/card:shadow-md"
                >
                  <BookCopy
                    className="size-4 text-[var(--success-foreground)]"
                    strokeWidth={1.75}
                  />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span
                    className="text-sm font-bold leading-snug"
                    style={{
                      color: 'var(--success)',
                    }}
                  >
                    Data Source
                  </span>
                  <p
                    className="text-xs leading-relaxed"
                    style={{
                      color: 'var(--muted)',
                    }}
                  >
                    <strong className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      GreenTechGuardians AI EarthHack Dataset:
                    </strong>{' '}
                    A curated collection of{' '}
                    <strong className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      4,000+ high-quality
                    </strong>{' '}
                    circular economy solutions (filtered from 1,300) spanning waste reduction,
                    resource optimization, renewable energy, sustainable materials, and regenerative
                    agriculture across multiple industries and geographic regions.
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <div
                className="flex items-start gap-3 p-4 rounded-xl border-l-4"
                style={{
                  backgroundColor: 'var(--danger-soft)',
                  borderColor: 'var(--danger)',
                }}
              >
                <TriangleAlert
                  className="size-4 shrink-0 mt-0.5"
                  style={{ color: 'var(--danger)' }}
                  strokeWidth={1.75}
                />
                <p
                  className="text-xs leading-relaxed"
                  style={{
                    color: 'var(--muted)',
                  }}
                >
                  <strong className="font-semibold" style={{ color: 'var(--foreground)' }}>
                    Disclaimer:{' '}
                  </strong>
                  This assessment is designed to provide{' '}
                  <strong className="font-semibold" style={{ color: 'var(--foreground)' }}>
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
