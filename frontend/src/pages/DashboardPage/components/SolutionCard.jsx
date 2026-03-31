import PropTypes from 'prop-types';

function SolutionCard({ title, preview, category, onView }) {
  return (
    <div
      className="border rounded-xl px-4 py-3 card-lift flex items-center gap-3"
      style={{ backgroundColor: 'transparent', borderColor: 'var(--border)' }}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[15px] font-bold"
        style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-soft-fg)' }}
      >
        {title?.[0]?.toUpperCase() || '?'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
          {title}
        </p>
        <p
          className="text-xs line-clamp-2 mt-0.5 leading-relaxed"
          style={{ color: 'var(--muted)' }}
        >
          {preview}
        </p>
        {category && (
          <span
            className="inline-block text-[10px] font-semibold uppercase tracking-wide
                           px-2 py-0.5 rounded mt-1"
            style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-soft-fg)' }}
          >
            {category}
          </span>
        )}
      </div>

      {/* View link */}
      <button
        onClick={onView}
        className="text-xs shrink-0 transition-colors duration-150
                   hover:text-[var(--accent)]"
        style={{ color: 'var(--muted)' }}
      >
        View →
      </button>
    </div>
  );
}

SolutionCard.propTypes = {
  /** Title text for the solution */
  title: PropTypes.string.isRequired,
  /** Preview text/description */
  preview: PropTypes.string,
  /** Category label */
  category: PropTypes.string,
  /** Callback function invoked when view is clicked */
  onView: PropTypes.func.isRequired,
};

export { SolutionCard };
export default SolutionCard;
