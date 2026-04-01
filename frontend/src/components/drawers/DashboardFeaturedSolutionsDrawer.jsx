import { Drawer } from '@heroui/react';
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

  const { solutions = [], isLoading } = useFeaturedSolutions({
    limit: 10,
    industry,
    q,
    enabled: isDrawerOpen,
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
    <Drawer
      isOpen={isDrawerOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Drawer.Backdrop className="bg-black/15 backdrop-blur-sm">
        <Drawer.Content
          placement={direction}
          className="bg-(--color-bg) border-l border-(--color-border-strong) shadow-[-8px_0_24px_rgba(0,0,0,0.08)]"
        >
          <Drawer.Dialog>
            {direction === 'bottom' && <Drawer.Handle />}
            {direction === 'right' && <Drawer.CloseTrigger aria-label="Close drawer" />}
            <Drawer.Header>
              <div className="flex items-start justify-between p-6 border-b border-(--color-border) shrink-0">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-10 h-10 rounded-sm bg-gray-100 flex items-center justify-center text-(--color-accent) mt-0.5">
                    <Star size={16} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-(--color-text-primary)">
                      Explore Featured Solutions
                    </h2>
                    <p className="text-xs text-(--color-text-muted) mt-0.5">
                      Browse featured solutions matching your query
                    </p>
                  </div>
                </div>
                <Drawer.CloseTrigger
                  className="w-8 h-8 flex items-center justify-center rounded-sm text-(--color-text-muted) hover:text-(--color-text-primary) hover:bg-(--color-accent-light) transition-colors shrink-0"
                  aria-label="Close"
                />
              </div>
            </Drawer.Header>

            <Drawer.Body className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4 max-h-[70vh] overflow-auto">
                {isLoading ? (
                  <div className="py-6 text-center text-(--color-text-muted)">Loading...</div>
                ) : solutions.length === 0 ? (
                  <div className="py-6 text-center text-(--color-text-muted)">No results</div>
                ) : (
                  Array.from(grouped.entries()).map(([cat, list]) => (
                    <div key={cat}>
                      <div className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-3 border-t border-(--color-border) pt-4 mt-4 first:border-0 first:pt-0 first:mt-0">
                        {cat}
                      </div>
                      <div className="space-y-1">
                        {list.map((s) => (
                          <div
                            key={s.id}
                            className="py-3 border-b border-(--color-border) transition-all duration-200"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-semibold truncate text-(--color-text-primary) mb-1">
                                {s.title}
                              </h4>
                              <span className="text-xs text-(--color-text-muted)">
                                {s.wordCount || 0} words
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed line-clamp-2 mb-2 text-(--color-text-secondary)">
                              {s.solution || s.problem || ''}
                            </p>
                            <a
                              href="#"
                              className="text-xs font-medium inline-flex items-center gap-1 hover:gap-1.5 transition-all duration-150 text-(--color-accent) hover:underline"
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
