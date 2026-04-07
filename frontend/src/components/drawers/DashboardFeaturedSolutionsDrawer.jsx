import { Drawer, useOverlayState } from '@heroui/react';
import { Star } from 'lucide-react';
import PropTypes from 'prop-types';
import { useMemo } from 'react';

import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useFeaturedSolutions } from '@/features/assessments/hooks/useFeaturedSolutions';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';

export default function DashboardFeaturedSolutionsDrawer({ data = {} }) {
  // if data is {} return null
  if (Object.keys(data).length === 0) return null;
  const { q, industry } = data;

  const { isDrawerOpen, onClose, openResultsDatabaseEvidenceDetailsDrawer } = useGlobalDrawer();
  const direction = useDrawerDirection();

  // Use HeroUI v3 useOverlayState for proper state management
  const drawerState = useOverlayState({
    defaultOpen: isDrawerOpen,
    onOpenChange: (open) => {
      if (!open) onClose();
    },
  });

  const { solutions = [], isLoading } = useFeaturedSolutions({
    limit: 10,
    industry,
    q,
    enabled: drawerState.isOpen,
  });

  const grouped = useMemo(() => {
    // group by category for simple sections
    const map = new Map();
    (solutions || []).forEach((s) => {
      const cat = s.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(s);
    });
    return map;
  }, [solutions]);

  return (
    <Drawer state={drawerState}>
      <Drawer.Backdrop>
        <Drawer.Content placement={direction}>
          <Drawer.Dialog>
            {direction === 'bottom' ? (
              <Drawer.Handle />
            ) : (
              <Drawer.CloseTrigger aria-label="Close" />
            )}
            <Drawer.Header>
              <div className="flex items-center gap-3 pr-8">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(45,90,61,0.1)]">
                  <Star size={16} className="text-[#2d5a3d]" strokeWidth={1.75} />
                </div>
                <div>
                  <Drawer.Heading className="drawer__heading">
                    Explore Featured Solutions
                  </Drawer.Heading>
                  <p className="mt-0.5 text-[0.7rem] font-normal text-[#6b5f56]">
                    Browse featured solutions matching your query
                  </p>
                </div>
              </div>
            </Drawer.Header>

            <Drawer.Body className="flex-1 overflow-y-auto p-6">
              <div className="max-h-[70vh] space-y-4 overflow-auto">
                {isLoading ? (
                  <div className="py-6 text-center text-[0.8125rem] text-(--color-text-muted)">
                    Loading...
                  </div>
                ) : solutions.length === 0 ? (
                  <div className="py-6 text-center text-[0.8125rem] text-(--color-text-muted)">
                    No results
                  </div>
                ) : (
                  Array.from(grouped.entries()).map(([cat, list]) => (
                    <div key={cat}>
                      <div className="mt-4 mb-3 border-t border-border pt-4 text-[0.625rem] font-semibold tracking-widest text-(--color-text-muted) first:mt-0 first:border-0 first:pt-0">
                        {cat}
                      </div>
                      <div className="space-y-2">
                        {list.map((s) => (
                          <div
                            key={s.id}
                            className="border-b border-border py-3 transition-all duration-200"
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <h4 className="mb-1 truncate text-[0.8125rem] font-semibold text-(--color-text-primary)">
                                {s.title}
                              </h4>
                              <span className="text-[0.6875rem] text-(--color-text-muted)">
                                {s.wordCount || 0} words
                              </span>
                            </div>
                            <p className="mb-2 line-clamp-2 text-[0.6875rem] leading-relaxed text-(--color-text-secondary)">
                              {s.solution || s.problem || ''}
                            </p>
                            <a
                              href="#"
                              className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-(--color-accent) transition-all duration-150 hover:gap-1.5 hover:underline"
                              onClick={(e) => {
                                e.preventDefault();
                                openResultsDatabaseEvidenceDetailsDrawer({
                                  title: s.title || 'Solution Details',
                                  solution: s.solution || '',
                                  problem: s.problem || '',
                                  category: s.category || '',
                                  wordCount: s.wordCount || 0,
                                });
                              }}
                            >
                              View →
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

DashboardFeaturedSolutionsDrawer.propTypes = {
  data: PropTypes.shape({
    q: PropTypes.string,
    industry: PropTypes.string,
  }),
};
