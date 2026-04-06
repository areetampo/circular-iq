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
    <div
      className="p-4 rounded-xl border-[1.5px]"
      style={{
        backgroundColor: 'rgba(245,240,232,0.25)',
        borderColor: 'rgba(180,160,130,0.3)',
      }}
    >
      <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#2d5a3d' }}>
        {label}
      </div>
      <div className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
        {titleize(value || '')}
      </div>
      <div className="text-xs mt-1 italic" style={{ color: 'var(--muted)' }}>
        {helpText}
      </div>
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
