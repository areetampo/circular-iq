import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/utils/cn';
import { Star } from 'lucide-react';
import { Drawer } from '@heroui/react';
import { useFeaturedSolutions } from '@/features/assessments/hooks/useFeaturedSolutions';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';

export default function DashboardFeaturedSolutionsDrawer({ data = {} }) {
  // if data is {} return null
  if (Object.keys(data).length === 0) return null;
  const { q, industry } = data;

  const { isDrawerOpen, onClose } = useGlobalDrawer();
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
      placement={direction === 'right' ? 'right' : 'left'}
    >
      <Drawer.Backdrop>
        <Drawer.Content>
          <Drawer.Dialog>
            <Drawer.Header>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg bg-yellow-50 shrink-0 transition-[transform,box-shadow] duration-300 ease-out',
                      isDrawerOpen
                        ? 'scale-[1.12] -rotate-6 drop-shadow-md'
                        : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                    )}
                  >
                    <Star className="size-5 text-yellow-500" />
                  </div>
                  <div>
                    <Drawer.Heading className="text-lg font-semibold">
                      Explore Featured Solutions
                    </Drawer.Heading>
                    <p className="text-sm text-gray-600">
                      Browse featured solutions matching your query
                    </p>
                  </div>
                </div>

                {direction === 'right' && <Drawer.CloseTrigger />}
              </div>
            </Drawer.Header>

            <Drawer.Body className="px-0">
              <div className="space-y-4 max-h-[70vh] overflow-auto">
                {isLoading ? (
                  <div className="py-6 text-center">Loading...</div>
                ) : solutions.length === 0 ? (
                  <div className="py-6 text-center text-slate-500">No results</div>
                ) : (
                  Array.from(grouped.entries()).map(([cat, list]) => (
                    <div key={cat}>
                      <div className="text-sm font-semibold text-slate-700 mb-2 px-4">{cat}</div>
                      <div className="space-y-3 px-4">
                        {list.map((s) => (
                          <div
                            key={s.id}
                            className="p-4 rounded-xl bg-white border border-gray-100 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold truncate">{s.title}</h4>
                              <span className="text-xs text-slate-400">
                                {s.wordCount || 0} words
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-2 truncate">
                              {s.solution || s.problem}
                            </p>
                            <div className="mt-2 text-xs text-slate-400">
                              Source: {s.sourceId || s.id}
                            </div>
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
