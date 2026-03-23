import { ChevronRight, Lightbulb } from 'lucide-react';
import PropTypes from 'prop-types';

import { cn } from '@/utils/cn';

function SolutionCard({ solution, onOpen }) {
  const preview = solution.solution || solution.problem || '';
  const initial = (solution.title || 'S').charAt(0).toUpperCase();
  const bgColors = [
    'bg-indigo-100 text-indigo-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-purple-100 text-purple-700',
  ];
  const colorIdx = initial.charCodeAt(0) % bgColors.length;

  return (
    <button
      type="button"
      onClick={() => onOpen(solution)}
      className="w-full text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-150 group"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-opacity',
            bgColors[colorIdx],
          )}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          {/* Title — full text, wraps */}
          <p className="text-xs font-bold text-slate-900 mb-1 leading-snug group-hover:text-indigo-700 transition-colors">
            {solution.title || 'Untitled'}
          </p>
          {/* Preview — 4 lines */}
          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-4">
            {preview || 'Click to view full details'}
          </p>
          {/* Tags */}
          <div className="flex gap-1 mt-2.5 flex-wrap">
            {solution.category && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                {solution.category}
              </span>
            )}
            {solution.industry && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600">
                {solution.industry}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 mt-3 pt-2.5 border-t border-slate-100 text-slate-400 group-hover:text-indigo-500 transition-colors">
        <Lightbulb size={11} strokeWidth={2} />
        <span className="text-[10px] font-semibold">View full details in drawer</span>
        <ChevronRight size={10} className="ml-auto" />
      </div>
    </button>
  );
}

SolutionCard.propTypes = {
  /** Solution object with title, problem, solution, category, industry properties */
  solution: PropTypes.shape({
    title: PropTypes.string,
    problem: PropTypes.string,
    solution: PropTypes.string,
    category: PropTypes.string,
    industry: PropTypes.string,
  }).isRequired,
  /** Callback function invoked when card is clicked, receives solution object */
  onOpen: PropTypes.func.isRequired,
};

export { SolutionCard };
export default SolutionCard;
