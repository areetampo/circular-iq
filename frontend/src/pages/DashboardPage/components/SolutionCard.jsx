import PropTypes from 'prop-types';

import { Chip } from '@/components/common';

function SolutionCard({ title, preview, category, score, onView }) {
  return (
    <div
      className="border border-(--color-border) rounded-lg p-4 bg-transparent hover:border-(--color-border-strong) cursor-pointer transition-colors"
      onClick={onView}
    >
      {/* Title */}
      <h4 className="text-sm font-semibold text-(--color-text-primary) mb-1 truncate">{title}</h4>

      {/* Description */}
      <p className="text-xs text-(--color-text-muted) leading-relaxed line-clamp-3 mb-2">
        {preview}
      </p>

      {/* Industry chip */}
      {category && <Chip variant="category">{category}</Chip>}

      {/* Score */}
      {score && <div className="font-mono text-sm text-(--color-accent) mt-2">Score: {score}</div>}
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
  /** Score value */
  score: PropTypes.number,
  /** Callback function invoked when view is clicked */
  onView: PropTypes.func.isRequired,
};

export { SolutionCard };
export default SolutionCard;
