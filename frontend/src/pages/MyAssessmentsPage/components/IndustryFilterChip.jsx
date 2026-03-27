import PropTypes from 'prop-types';
import React from 'react';

import { getIndustryTheme } from '@/constants/industryThemes';

const IndustryFilterChip = React.memo(function IndustryFilterChip({
  industry,
  isSelected,
  onToggle,
  label,
}) {
  const theme = getIndustryTheme(industry);

  return (
    <button
      onClick={() => onToggle(industry)}
      className="px-3 py-1.5 rounded-md text-[12px] font-medium border transition-colors"
      style={{
        backgroundColor: isSelected ? 'var(--accent)' : 'var(--surface)',
        color: isSelected ? 'white' : 'var(--foreground)',
        borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
      }}
      aria-pressed={isSelected}
    >
      {label}
    </button>
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
