/**
 * @module StatsGrid
 * @description Summary statistics grid (counts, averages) above the assessments list.
 */

import { Popover } from '@heroui/react';
import { Minus } from 'lucide-react';
import PropTypes from 'prop-types';

import { Button, Tilt3D } from '@/components/common';
import { toTitleCase } from '@/lib/formatting';

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
  <Tilt3D className="flex h-full flex-col gap-1 rounded-2xl border-2 border-(--color-border-strong-alpha-80) bg-(--color-bg-card-light) p-5">
    <span className="text-[0.725rem] font-semibold tracking-[0.12em] text-(--color-text-muted) uppercase">
      {label}
    </span>
    <span
      className={`font-mono leading-none tracking-[-0.04em] ${sizeMap[fontSize] || 'text-base'} ${color ? `text-[${color}]` : 'text-(--color-text-primary)'}`}
    >
      {value}
    </span>
    <span className="mt-0.5 text-[0.75rem] font-medium text-(--color-text-muted)">{subtitle}</span>
  </Tilt3D>
);

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string.isRequired,
  color: PropTypes.string,
  fontSize: PropTypes.oneOf(['28px', '24px', '20px', '18px']),
};

/**
 * Summary statistics grid (counts, averages) above the assessments list.
 *
 * @param {Object} props
 * @param {number|string} props.averageScore
 * @param {number} props.totalAssessments
 * @param {number} props.highestScore
 * @param {number} props.lowestScore
 * @param {Array<Object>|Array<string>} props.topIndustries
 * @returns {import('react').ReactElement}
 */
export default function StatsGrid({
  averageScore,
  totalAssessments,
  highestScore,
  lowestScore,
  topIndustries,
}) {
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
      ? topIndustries
          .filter((item) => {
            const name = getIndustryName(item.industry).toLowerCase();
            return name !== 'other' && name !== 'general';
          })
          .map((item) => ({
            ...item,
            industry: getIndustryName(item.industry),
          }))
          .sort((a, b) => {
            // Extract count from different possible structures for comparison
            const getCount = (item) => {
              if (typeof item.count === 'number') {
                return item.count;
              } else if (item.count && typeof item.count === 'object') {
                return item.count.count || 0;
              }
              return 0;
            };

            const countA = getCount(a);
            const countB = getCount(b);

            // Primary sort: by count (decreasing)
            if (countB !== countA) {
              return countB - countA;
            }

            // Secondary sort: by industry name (alphabetical)
            const nameA = getIndustryName(a.industry) || '';
            const nameB = getIndustryName(b.industry) || '';
            return nameA.localeCompare(nameB);
          })
      : [];

  const getDisplayText = () => {
    if (displayIndustries.length === 0) return '—';
    if (displayIndustries.length === 1) return toTitleCase(displayIndustries[0].industry);
    if (displayIndustries.length === 2) {
      return `${toTitleCase(displayIndustries[0].industry)}\n&\n${toTitleCase(displayIndustries[1].industry)}`;
    }
    return `${toTitleCase(displayIndustries[0].industry)},\n${toTitleCase(displayIndustries[1].industry)},\n...`;
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
      <Tilt3D className="flex flex-col gap-1 rounded-2xl border-2 border-(--color-border-strong-alpha-80) bg-(--color-bg-card-light) p-5">
        <span className="text-[0.625rem] font-bold tracking-[0.12em] text-(--color-text-muted) uppercase">
          Top {displayIndustries.length > 1 ? 'Industries' : 'Industry'}
        </span>

        {displayIndustries.length > 0 ? (
          <div className="flex flex-col items-start gap-1">
            <span className="font-mono text-base leading-none tracking-[-0.04em] wrap-break-word whitespace-pre-line text-(--color-text-primary)">
              {getDisplayText()}
            </span>

            {displayIndustries.length > 2 ? (
              <Popover>
                <Popover.Trigger>
                  <Button variant="ghastly" size="sm" className="px-2 py-0.5">
                    View all
                  </Button>
                </Popover.Trigger>
                <Popover.Content className="min-w-50" placement="bottom">
                  <Popover.Dialog>
                    <Popover.Heading className="flex items-center gap-1 uppercase">
                      <span>Industries</span>
                      <Minus size={16} strokeWidth={2} />
                      <span className="font-mono">{displayIndustries.length}</span>
                    </Popover.Heading>
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
                          className="flex w-full items-center justify-between rounded-sm px-2 py-1 hover:bg-(--color-chip-bg)"
                        >
                          <span className="text-xs">{toTitleCase(industryName)}</span>
                          <span className="ml-2 font-mono text-xs text-(--color-text-muted)">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </Popover.Dialog>
                </Popover.Content>
              </Popover>
            ) : null}
          </div>
        ) : (
          <>
            <span className="truncate font-mono text-[2.125rem] leading-none tracking-[-0.04em] text-(--color-text-primary)">
              —
            </span>
            <span className="mt-0.5 text-[0.75rem] text-(--color-text-muted)">—</span>
          </>
        )}
      </Tilt3D>
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
