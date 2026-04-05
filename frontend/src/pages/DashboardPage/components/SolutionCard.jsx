import PropTypes from 'prop-types';

import { Chip } from '@/components/common';

function SolutionCard({ title, preview, category, score, onView }) {
  return (
    <div
      className="border border-[rgba(180,160,130,0.25)] rounded-[14px] p-5 bg-transparent hover:border-[rgba(184,145,106,0.4)] cursor-pointer transition-colors"
      onClick={onView}
    >
      {/* Title - no truncation, let it wrap to 2 lines max */}
      <h4 className="text-[15px] font-semibold text-(--color-text-primary) mb-1 leading-[1.35] line-clamp-2">
        {title}
      </h4>

      {/* Description - clamp to 3 lines */}
      <p className="text-[13px] text-(--color-text-secondary) leading-[1.6] line-clamp-3 mb-2">
        {preview}
      </p>

      {/* Industry chip */}
      {category && <Chip variant="factor">{category}</Chip>}

      {/* Score */}
      {score && (
        <div className="font-(--font-mono) text-[22px] font-semibold text-(--color-accent) mt-2">
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
