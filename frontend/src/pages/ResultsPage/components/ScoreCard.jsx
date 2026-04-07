import { BarChart3 } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip, SectionHeading } from '@/components/common';
import { formatFactorName } from '@/lib/scoring';

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
        return { bg: 'var(--warning-soft)', color: 'var(--warning)' };
      case 'danger':
        return { bg: 'var(--danger-soft)', color: 'var(--danger)' };
      case 'success':
        return { bg: 'var(--success-soft)', color: 'var(--success)' };
      default:
        return { bg: 'var(--info-soft)', color: 'var(--info)' };
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
            <div
              className="text-3xl font-bold"
              style={{ '--score-color': scoreColor, color: 'var(--score-color)' }}
            >
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
            const factorColor = getFactorColor(factorType);
            return (
              <Chip
                key={f}
                variant="factor"
                className="text-xs"
                style={{
                  '--factor-bg': factorColor.bg,
                  '--factor-color': factorColor.color,
                  backgroundColor: 'var(--factor-bg)',
                  color: 'var(--factor-color)',
                }}
              >
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
