import { Chip } from '@heroui/react';
import PropTypes from 'prop-types';
import React from 'react';

import { getIndustryTheme } from '@/constants/industryThemes';
import { cn } from '@/utils/cn';

const IndustryFilterChip = React.memo(function IndustryFilterChip({
  industry,
  isSelected,
  onToggle,
  label,
}) {
  const theme = getIndustryTheme(industry);

  return (
    <Chip
      onClick={() => onToggle(industry)}
      className={cn(
        'cursor-pointer select-none transition-colors duration-200 ease-in-out',
        'border font-medium',
        isSelected
          ? `${theme.selectedBg} ${theme.selectedText} ${theme.selectedBorder}`
          : `bg-white ${theme.unselectedText} ${theme.unselectedBorder}`,
        !isSelected && theme.hoverClasses,
      )}
      aria-pressed={isSelected}
    >
      <Chip.Label className="px-1">{label}</Chip.Label>
    </Chip>
  );
});

IndustryFilterChip.propTypes = {
  industry: PropTypes.string.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};

export { IndustryFilterChip };
export default IndustryFilterChip;
