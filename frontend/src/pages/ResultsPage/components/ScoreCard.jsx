import { BarChart3 } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip, SectionHeading } from '@/components/common';
import { formatFactorName } from '@/lib/scoring';
import { cn } from '@/utils/cn';

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
    <div className="mt-8 border-t border-border pt-8">
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
