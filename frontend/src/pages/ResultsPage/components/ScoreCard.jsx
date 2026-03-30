import { Card } from '@heroui/react';
import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
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
    <Card
      className="border rounded-xl card-lift"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
              {title}
            </h3>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {description}
            </p>
          </div>
          {score != null && (
            <div className="text-right">
              <div className="text-3xl font-bold" style={{ color: scoreColor }}>
                {score}
                <span className="text-sm" style={{ color: 'var(--muted)' }}>
                  /100
                </span>
              </div>
              {rating && (
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  {rating}
                </div>
              )}
            </div>
          )}
        </div>

        {message && (
          <p className="text-sm mb-3" style={{ color: 'var(--foreground)' }}>
            {message}
          </p>
        )}

        {factors.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {factors.map((f) => {
              const factorColor = getFactorColor(factorType);
              return (
                <Chip
                  key={f}
                  variant="default"
                  className="text-xs"
                  style={{ backgroundColor: factorColor.bg, color: factorColor.color }}
                >
                  {formatFactorName(f)}
                </Chip>
              );
            })}
          </div>
        )}

        {children}
      </div>
    </Card>
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
