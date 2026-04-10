import PropTypes from 'prop-types';

import { Chip } from '@/components/common';

function SolutionCard({ title, preview, category, score, onView }) {
  return (
    <div
      className="cursor-pointer rounded-[14px] border border-(--color-border-ui) bg-transparent p-5 transition-colors hover:border-[rgba(184,145,106,0.4)]"
      onClick={onView}
    >
      {/* Title - no truncation, let it wrap to 2 lines max */}
      <h4 className="mb-1 line-clamp-2 text-[0.9375rem] leading-[1.35] font-semibold text-(--color-text-primary)">
        {title}
      </h4>

      {/* Description - clamp to 3 lines */}
      <p className="mb-2 line-clamp-3 text-[0.8125rem] leading-[1.6] text-(--color-text-secondary)">
        {preview}
      </p>

      {/* Industry chip */}
      {category && <Chip variant="factor">{category}</Chip>}

      {/* Score */}
      {score && (
        <div className="mt-2 font-mono text-[1.375rem] font-semibold text-(--color-accent)">
          {score}
        </div>
      )}
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
