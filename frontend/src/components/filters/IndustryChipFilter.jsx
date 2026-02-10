import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@heroui/react';
import { getIndustryTheme } from '@/constants/industryThemes';

export default function IndustryChipFilter({ industries, selected, onToggle, labelMap }) {
  return (
    <div className="flex flex-wrap gap-2">
      {industries.map((industry) => {
        const theme = getIndustryTheme(industry);
        const isSelected = selected.includes(industry);
        return (
          <Chip
            key={industry}
            onClick={() => onToggle(industry)}
            className={[
              'cursor-pointer select-none transition-colors duration-200 ease-in-out border font-medium',
              isSelected
                ? `${theme.selectedBg} ${theme.selectedText} ${theme.selectedBorder}`
                : `bg-white ${theme.unselectedText} ${theme.unselectedBorder}`,
              !isSelected && theme.hoverClasses,
            ].join(' ')}
            aria-pressed={isSelected}
          >
            <Chip.Label className="px-1">
              {labelMap?.[industry] ||
                (industry === 'all'
                  ? 'All Industries'
                  : industry.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))}
            </Chip.Label>
          </Chip>
        );
      })}
    </div>
  );
}

IndustryChipFilter.propTypes = {
  industries: PropTypes.arrayOf(PropTypes.string).isRequired,
  selected: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggle: PropTypes.func.isRequired,
  labelMap: PropTypes.object,
};
