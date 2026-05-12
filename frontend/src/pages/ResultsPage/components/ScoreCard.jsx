import { BarChart3 } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip, SectionHeading } from '@/components/common';
import { formatFactorName } from '@/lib/scoring';
import { cn } from '@/utils/cn';

/**
 * ScoreCard - Reusable card component for displaying score information
 * Shows title, description, score, rating, message, and optional factors
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Card title to display
 * @param {string} props.description - Card description text
 * @param {number|null} props.score - Score value to display (null hides score)
 * @param {string} [props.rating] - Rating text to display
 * @param {string} [props.message] - Message text to display
 * @param {string} [props.scoreColor] - CSS color variable for score display
 * @param {Array} [props.factors=[]] - Array of factor objects to display
 * @param {string} [props.factorType='default'] - Type of factors (warning, danger, success, default)
 * @param {ReactNode} [props.children] - Child elements to render
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered ScoreCard
 *
 * @example
 * Basic usage
 * <ScoreCard title="Overall Score" description="Your assessment result" score={85} rating="Excellent" message="Great job!" />
 *
 * @example
 * With factors
 * <ScoreCard title="Parameter Analysis" score={75} factors={factorList} factorType="warning" />
 *
 * @example
 * With custom color
 * <ScoreCard title="Custom Score" score={90} scoreColor="var(--color-accent)" />
 */
export default function ScoreCard({
  title,
  description,
  score,
  rating,
  message,
  scoreColor,
  factors = [],
  factorType = 'default',
  children,
  ...props
}) {
  const getFactorColor = (type) => {
    switch (type) {
      case 'warning':
        return { bg: '--warning-soft', text: '--warning' };
      case 'danger':
        return { bg: '--danger-soft', text: '--danger' };
      case 'success':
        return { bg: '--success-soft', text: '--success' };
      default:
        return { bg: '--info-soft', text: '--info' };
    }
  };

  return (
    <div {...props}>
      {/* Section heading with icon */}
      <div className="mb-6 flex items-center justify-between">
        <SectionHeading
          variant="small"
          icon={<BarChart3 className="size-4 text-(--color-accent)" />}
          className="mb-0"
        >
          {title}
        </SectionHeading>
        {score != null && (
          <div className="text-right">
            <div className="text-3xl font-bold" style={{ color: scoreColor }}>
              {score}
              <span className="text-sm text-(--color-text-muted)">/100</span>
            </div>
            {rating && <div className="text-xs text-(--color-text-muted)">{rating}</div>}
          </div>
        )}
      </div>

      {/* Description */}
      <p className="mb-4 text-sm text-(--color-text-secondary)">{description}</p>

      {/* Message */}
      {message && <p className="mb-4 text-sm/relaxed text-(--color-text-secondary)">{message}</p>}

      {/* Factors */}
      {factors.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1">
          {factors.map((f) => {
            const { bg, text } = getFactorColor(factorType);

            return (
              <Chip key={f} variant="factor" className={cn('text-xs', `bg-(${bg}) text-(${text})`)}>
                {formatFactorName(f)}
              </Chip>
            );
          })}
        </div>
      )}

      {/* Children content */}
      {children}
    </div>
  );
}

ScoreCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  score: PropTypes.number,
  rating: PropTypes.string,
  message: PropTypes.string,
  scoreColor: PropTypes.string,
  factors: PropTypes.arrayOf(PropTypes.string),
  factorType: PropTypes.oneOf(['default', 'warning', 'danger', 'success']),
  children: PropTypes.node,
};
