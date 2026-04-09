import PropTypes from 'prop-types';

import { titleize } from '@/lib/formatting';

/**
 * FieldDisplayCard Component
 * Reusable card component for displaying field information with consistent styling
 *
 * Location: src/pages/ResultsPage/components/FieldDisplayCard.jsx
 */
export function FieldDisplayCard({ label, value, helpText }) {
  return (
    <div className="rounded-xl border-[1.5px] border-[rgba(180,160,130,0.3)] bg-[rgba(245,240,232,0.25)] p-4">
      <div className="mb-1 text-xs font-bold tracking-wide text-[#2d5a3d] uppercase">{label}</div>
      <div className="text-sm font-bold text-(--color-text-primary)">{titleize(value || '')}</div>
      <div className="mt-1 text-sm text-(--color-text-muted) italic">{helpText}</div>
    </div>
  );
}

FieldDisplayCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  helpText: PropTypes.string.isRequired,
};

FieldDisplayCard.defaultProps = {
  value: '',
};
