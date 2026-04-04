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
      <Drawer.Backdrop variant="blur">
        <Drawer.Content
          placement={direction}
          className="bg-(--color-bg) border-l border-(--color-border-strong) shadow-[-8px_0_24px_rgba(0,0,0,0.08)]"
        >
          <Drawer.Dialog>
            {direction === 'bottom' && <Drawer.Handle />}
            <Drawer.CloseTrigger aria-label="Close" />
            <Drawer.Header>
              <div className="flex items-center gap-3 pr-8">
                <div className="w-8 h-8 rounded-lg bg-[rgba(45,90,61,0.1)] flex items-center justify-center shrink-0">
                  <Star size={16} className="text-[#2d5a3d]" strokeWidth={1.75} />
                </div>
                <div>
                  <Drawer.Heading className="drawer__heading">
                    Explore Featured Solutions
                  </Drawer.Heading>
                  <p className="text-[11px] text-[#6b5f56] mt-0.5 font-normal">
                    Browse featured solutions matching your query
                  </p>
                </div>
              </div>
            </Drawer.Header>

            <Drawer.Body className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4 max-h-[70vh] overflow-auto">
                {isLoading ? (
                  <div className="py-6 text-center text-(--color-text-muted) text-[13px]">
                    Loading...
                  </div>
                ) : solutions.length === 0 ? (
                  <div className="py-6 text-center text-(--color-text-muted) text-[13px]">
                    No results
                  </div>
                ) : (
                  Array.from(grouped.entries()).map(([cat, list]) => (
                    <div key={cat}>
                      <div className="text-[10px] tracking-widest text-(--color-text-muted) mb-3 border-t border-(--color-border) pt-4 mt-4 first:border-0 first:pt-0 first:mt-0 font-semibold">
                        {cat}
                      </div>
                      <div className="space-y-2">
                        {list.map((s) => (
                          <div
                            key={s.id}
                            className="py-3 border-b border-(--color-border) transition-all duration-200"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-[13px] font-semibold truncate text-(--color-text-primary) mb-1">
                                {s.title}
                              </h4>
                              <span className="text-[11px] text-(--color-text-muted)">
                                {s.wordCount || 0} words
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed line-clamp-2 mb-2 text-(--color-text-secondary)">
                              {s.solution || s.problem || ''}
                            </p>
                            <a
                              href="#"
                              className="text-[11px] font-semibold inline-flex items-center gap-1 hover:gap-1.5 transition-all duration-150 text-(--color-accent) hover:underline"
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
