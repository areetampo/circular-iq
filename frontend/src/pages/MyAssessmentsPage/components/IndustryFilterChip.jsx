import PropTypes from 'prop-types';
import React from 'react';

import { Chip } from '@/components/common';

const IndustryFilterChip = React.memo(function IndustryFilterChip({
  industry,
  isSelected,
  onToggle,
  label,
}) {
  return (
    <Chip
      variant="filter"
      active={isSelected}
      onClick={() => onToggle(industry)}
      aria-pressed={isSelected}
    >
      {label}
    </Chip>
  );
});

IndustryFilterChip.propTypes = {
  industry: PropTypes.string.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};

export default IndustryFilterChip;
