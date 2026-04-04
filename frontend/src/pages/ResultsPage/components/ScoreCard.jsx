import { BarChart3 } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { SectionHeading } from '@/components/common/SectionHeading';
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
    <div className="border-t border-(--color-border) pt-8 mt-8">
      {/* Section heading with icon */}
      <div className="flex items-center justify-between mb-6">
        <SectionHeading
          variant="small"
          icon={<BarChart3 className="w-4 h-4 text-(--color-accent)" />}
          className="mb-0"
        >
          {title}
        </SectionHeading>
        {score != null && (
          <div className="text-right">
            <div
              className="text-3xl font-bold text-(--color-text-primary)"
              style={{ color: scoreColor }}
            >
              {score}
              <span className="text-sm text-(--color-text-muted)">/100</span>
            </div>
            {rating && <div className="text-xs text-(--color-text-muted)">{rating}</div>}
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-(--color-text-secondary) mb-4">{description}</p>

      {/* Message */}
      {message && (
        <p className="text-sm text-(--color-text-secondary) mb-4 leading-relaxed">{message}</p>
      )}

      {/* Factors */}
      {factors.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {factors.map((f) => {
            const factorColor = getFactorColor(factorType);
            return (
              <Chip
                key={f}
                variant="tag"
                className="text-xs"
                style={{ backgroundColor: factorColor.bg, color: factorColor.color }}
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
