import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/common';
import { useFeaturedSolutions } from '@/features/assessments/hooks/useFeaturedSolutions';
import { useGlobalModal } from '@/contexts/ModalContext';

export default function DashboardFeaturedSolutionsModal({ data = {} }) {
  //if data is {} return null
  if (Object.keys(data).length === 0) return null;
  const { q, industry } = data;

  const { isModalOpen, onClose } = useGlobalModal();

  const { solutions = [], isLoading } = useFeaturedSolutions({
    limit: 10,
    industry,
    q,
    enabled: isModalOpen,
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

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Explore Featured Solutions</h3>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-auto">
          {isLoading ? (
            <div className="py-6 text-center">Loading...</div>
          ) : solutions.length === 0 ? (
            <div className="py-6 text-center text-slate-500">No results</div>
          ) : (
            Array.from(grouped.entries()).map(([cat, list]) => (
              <div key={cat}>
                <div className="text-sm font-semibold text-slate-700 mb-2">{cat}</div>
                <div className="space-y-2">
                  {list.map((s) => (
                    <div key={s.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold truncate">{s.title}</h4>
                        <span className="text-xs text-slate-400">{s.wordCount || 0} words</span>
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
      </div>
    </div>
  );
}

DashboardFeaturedSolutionsModal.propTypes = {
  isModalOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.shape({
    q: PropTypes.string,
    industry: PropTypes.string,
  }),
};
