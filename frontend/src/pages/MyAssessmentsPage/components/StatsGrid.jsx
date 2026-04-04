import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

const scoreColor = (s) =>
  s >= 75
    ? 'var(--color-success)'
    : s >= 50
      ? 'var(--color-warning)'
      : s
        ? 'var(--color-error)'
        : 'var(--color-text-primary)';

const titleize = (str) => str.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export function StatsGrid({
  averageScore,
  totalAssessments,
  highestScore,
  lowestScore,
  topIndustries,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.industry-dropdown')) {
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
      return `${titleize(displayIndustries[0].industry)}, ${titleize(displayIndustries[1].industry)}`;
    }
    return `${titleize(displayIndustries[0].industry)}, ${titleize(displayIndustries[1].industry)}...`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {/* Avg Score */}
      <div className="border border-[rgba(180,160,130,0.28)] rounded-2xl p-5 bg-[rgba(245,240,232,0.5)] flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-(--color-text-muted)">
          Avg Score
        </span>
        <span
          className="font-(--font-mono) text-[28px] text-(--color-text-primary) tracking-[-0.04em] leading-none"
          style={{ color: scoreColor(averageScore) }}
        >
          {averageScore ? averageScore.toFixed(2) : '0.00'}
        </span>
        <span className="text-[12px] text-(--color-text-muted) mt-0.5">out of 100</span>
      </div>

      {/* Total */}
      <div className="border border-[rgba(180,160,130,0.28)] rounded-2xl p-5 bg-[rgba(245,240,232,0.5)] flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-(--color-text-muted)">
          Total
        </span>
        <span className="font-(--font-mono) text-[28px] text-(--color-text-primary) tracking-[-0.04em] leading-none">
          {totalAssessments}
        </span>
        <span className="text-[12px] text-(--color-text-muted) mt-0.5">assessments</span>
      </div>

      {/* Highest */}
      <div className="border border-[rgba(180,160,130,0.28)] rounded-2xl p-5 bg-[rgba(245,240,232,0.5)] flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-(--color-text-muted)">
          Highest
        </span>
        <span
          className="font-(--font-mono) text-[28px] text-(--color-text-primary) tracking-[-0.04em] leading-none"
          style={{ color: scoreColor(highestScore) }}
        >
          {highestScore ? highestScore.toFixed(2) : '0.00'}
        </span>
        <span className="text-[12px] text-(--color-text-muted) mt-0.5">best score</span>
      </div>

      {/* Lowest */}
      <div className="border border-[rgba(180,160,130,0.28)] rounded-2xl p-5 bg-[rgba(245,240,232,0.5)] flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-(--color-text-muted)">
          Lowest
        </span>
        <span
          className="font-(--font-mono) text-[28px] text-(--color-text-primary) tracking-[-0.04em] leading-none"
          style={{ color: scoreColor(lowestScore) }}
        >
          {lowestScore ? lowestScore.toFixed(2) : '0.00'}
        </span>
        <span className="text-[12px] text-(--color-text-muted) mt-0.5">lowest score</span>
      </div>

      {/* Top Industry */}
      <div className="border border-[rgba(180,160,130,0.28)] rounded-2xl p-5 bg-[rgba(245,240,232,0.5)] flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-(--color-text-muted)">
          Top Industry
        </span>

        {displayIndustries.length > 0 ? (
          <div className="relative">
            <span className="font-(--font-mono) text-[24px] text-(--color-text-primary) tracking-[-0.04em] leading-none break-words">
              {getDisplayText()}
            </span>

            {displayIndustries.length > 2 && (
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-[10px] h-6 min-h-6 px-2 py-0 border-[rgba(180,160,130,0.28)] bg-[rgba(245,240,232,0.6)] text-(--color-text-muted) rounded hover:bg-[rgba(180,160,130,0.15)] transition-colors"
              >
                View all
              </button>
            )}

            {isDropdownOpen && (
              <div className="industry-dropdown absolute top-full left-0 mt-1 bg-[rgba(245,240,232,0.95)] border border-[rgba(180,160,130,0.28)] rounded-lg shadow-lg z-10 p-2 min-w-[200px]">
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
                      className="flex justify-between items-center w-full py-1 px-2 hover:bg-[rgba(180,160,130,0.1)] rounded"
                    >
                      <span className="text-xs">{titleize(industryName)}</span>
                      <span className="text-(--color-text-muted) text-xs ml-2">-{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            <span className="font-(--font-mono) text-[34px] text-(--color-text-primary) tracking-[-0.04em] leading-none truncate">
              —
            </span>
            <span className="text-[12px] text-(--color-text-muted) mt-0.5">—</span>
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
