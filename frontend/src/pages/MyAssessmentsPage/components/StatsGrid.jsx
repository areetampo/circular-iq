import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/common';
import { titleize } from '@/lib/formatting';

const scoreColor = (s) =>
  s >= 75
    ? 'var(--color-success)'
    : s >= 50
      ? 'var(--color-warning)'
      : s
        ? 'var(--color-error)'
        : 'var(--color-text-primary)';

const sizeMap = {
  '28px': 'text-[28px]',
  '24px': 'text-2xl',
  '20px': 'text-xl',
  '18px': 'text-lg',
};

// Reusable StatCard component
const StatCard = ({ label, value, subtitle, color, fontSize = '28px' }) => (
  <div className="flex flex-col gap-1 rounded-2xl border-2 border-[rgba(180,160,130,0.28)] bg-[rgba(245,240,232,0.5)] p-5">
    <span className="text-[0.725rem] font-semibold tracking-[0.12em] text-(--color-text-muted) uppercase">
      {label}
    </span>
    <span
      className={`font-mono leading-none tracking-[-0.04em] ${sizeMap[fontSize] || 'text-base'} ${color ? `text-[${color}]` : 'text-(--color-text-primary)'}`}
    >
      {value}
    </span>
    <span className="mt-0.5 text-[0.75rem] font-medium text-(--color-text-muted)">{subtitle}</span>
  </div>
);

export function StatsGrid({
  averageScore,
  totalAssessments,
  highestScore,
  lowestScore,
  topIndustries,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const industryDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isDropdownOpen &&
        industryDropdownRef.current &&
        !industryDropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Handle case where industry might be an object
  const getIndustryName = (industry) => {
    if (typeof industry === 'string') return industry;
    if (typeof industry === 'object' && industry !== null) {
      return industry.name || industry.industry || industry.toString();
    }
    return String(industry);
  };

  const displayIndustries =
    topIndustries && topIndustries.length > 0
      ? topIndustries.map((item) => ({
          ...item,
          industry: getIndustryName(item.industry),
        }))
      : [];

  const getDisplayText = () => {
    if (displayIndustries.length === 0) return '—';
    if (displayIndustries.length === 1) return titleize(displayIndustries[0].industry);
    if (displayIndustries.length === 2) {
      return `${titleize(displayIndustries[0].industry)} & ${titleize(displayIndustries[1].industry)}`;
    }
    return `${titleize(displayIndustries[0].industry)},\n${titleize(displayIndustries[1].industry)},\n...`;
  };

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {/* Stats Cards */}
      <StatCard
        label="Avg Score"
        value={averageScore ? averageScore.toFixed(2) : '0.00'}
        subtitle="out of 100"
        color={scoreColor(averageScore)}
      />

      <StatCard label="Total" value={totalAssessments} subtitle="assessments" />

      <StatCard
        label="Highest Score"
        value={highestScore ? highestScore.toFixed(2) : '0.00'}
        subtitle="out of 100"
        color={scoreColor(highestScore)}
      />

      <StatCard
        label="Lowest Score"
        value={lowestScore ? lowestScore.toFixed(2) : '0.00'}
        subtitle="out of 100"
        color={scoreColor(lowestScore)}
      />

      {/* Top Industry Card */}
      <div className="flex flex-col gap-1 rounded-2xl border-2 border-[rgba(180,160,130,0.28)] bg-[rgba(245,240,232,0.5)] p-5">
        <span className="text-[0.625rem] font-bold tracking-[0.12em] text-(--color-text-muted) uppercase">
          Top {displayIndustries.length > 1 ? 'Industries' : 'Industry'}
        </span>

        {displayIndustries.length > 0 ? (
          <div className="relative">
            <div className="flex flex-col items-start gap-1">
              <span className="font-mono text-base leading-none tracking-[-0.04em] wrap-break-word text-(--color-text-primary)">
                {getDisplayText()}
              </span>

              <div className="flex w-full items-center justify-center">
                {displayIndustries.length > 2 && (
                  <Button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    variant="ghastly"
                    size="sm"
                  >
                    View all
                  </Button>
                )}
              </div>
            </div>

            {isDropdownOpen && (
              <div
                ref={industryDropdownRef}
                className="dropdown absolute top-full left-0 z-10 mt-1 min-w-50 rounded-lg border border-[rgba(180,160,130,0.28)] bg-[rgba(245,240,232,0.95)] p-2 shadow-lg"
              >
                {displayIndustries.map((item, index) => {
                  // Handle different possible data structures
                  const industryName = item.industry || (typeof item === 'string' ? item : '');
                  let count = 0;

                  // Extract count from different possible structures
                  if (typeof item === 'object' && item !== null) {
                    if (typeof item.count === 'number') {
                      count = item.count;
                    } else if (item.count && typeof item.count === 'object') {
                      // Handle nested object structure like {count: {count: X, avg_score: Y}}
                      count = item.count.count || 0;
                    }
                  } else if (typeof item === 'number') {
                    count = item;
                  }

                  return (
                    <div
                      key={index}
                      className="flex w-full items-center justify-between rounded-sm px-2 py-1 hover:bg-[rgba(180,160,130,0.1)]"
                    >
                      <span className="text-xs">{titleize(industryName)}</span>
                      <span className="ml-2 text-xs text-(--color-text-muted)">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            <span className="truncate font-mono text-[2.125rem] leading-none tracking-[-0.04em] text-(--color-text-primary)">
              —
            </span>
            <span className="mt-0.5 text-[0.75rem] text-(--color-text-muted)">—</span>
          </>
        )}
      </div>
    </div>
  );
}

StatsGrid.propTypes = {
  averageScore: PropTypes.number,
  totalAssessments: PropTypes.number.isRequired,
  highestScore: PropTypes.number,
  lowestScore: PropTypes.number,
  topIndustries: PropTypes.arrayOf(
    PropTypes.shape({
      industry: PropTypes.string,
      count: PropTypes.number,
    }),
  ),
};
