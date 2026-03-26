import { Drawer } from '@heroui/react';
import { Star } from 'lucide-react';
import PropTypes from 'prop-types';
import { useMemo } from 'react';

import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useFeaturedSolutions } from '@/features/assessments/hooks/useFeaturedSolutions';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';
import { cn } from '@/utils/cn';

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
      <Drawer.Backdrop>
        <Drawer.Content placement={direction}>
          <Drawer.Dialog>
            {direction === 'bottom' && <Drawer.Handle />}
            {direction === 'right' && <Drawer.CloseTrigger aria-label="Close drawer" />}
            <Drawer.Header>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg shrink-0 transition-[transform,box-shadow] duration-300 ease-out',
                      isDrawerOpen
                        ? 'scale-[1.12] -rotate-6 drop-shadow-md'
                        : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                    )}
                    style={{
                      backgroundColor: 'var(--warning-soft)',
                    }}
                  >
                    <Star className="size-5" style={{ color: 'var(--warning)' }} />
                  </div>
                  <div>
                    <Drawer.Heading className="text-lg font-semibold">
                      Explore Featured Solutions
                    </Drawer.Heading>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      Browse featured solutions matching your query
                    </p>
                  </div>
                </div>
              </div>
            </Drawer.Header>

            <Drawer.Body className="px-0">
              <div className="space-y-4 max-h-[70vh] overflow-auto">
                {isLoading ? (
                  <div className="py-6 text-center">Loading...</div>
                ) : solutions.length === 0 ? (
                  <div className="py-6 text-center" style={{ color: 'var(--muted)' }}>
                    No results
                  </div>
                ) : (
                  Array.from(grouped.entries()).map(([cat, list]) => (
                    <div key={cat}>
                      <div
                        className="text-sm font-semibold mb-2 px-4"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {cat}
                      </div>
                      <div className="space-y-1 px-4">
                        {list.map((s) => (
                          <div
                            key={s.id}
                            className="py-3 border-b border-[var(--border)] transition-all duration-200"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <h4
                                className="text-sm font-semibold truncate"
                                style={{ color: 'var(--foreground)' }}
                              >
                                {s.title}
                              </h4>
                              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                                {s.wordCount || 0} words
                              </span>
                            </div>
                            <p
                              className="text-xs leading-relaxed line-clamp-2 mb-2"
                              style={{ color: 'var(--muted)' }}
                            >
                              {s.solution || s.problem || ''}
                            </p>
                            <a
                              href="#"
                              className="text-xs font-medium inline-flex items-center gap-1 hover:gap-1.5 transition-all duration-150"
                              style={{ color: 'var(--accent)' }}
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
