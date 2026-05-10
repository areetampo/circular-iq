import PropTypes from 'prop-types';

import { Tilt3D } from '@/components/common';
import { toTitleCase } from '@/lib/formatting';

/**
 * FieldDisplayCard Component
 * Reusable card component for displaying field information with consistent styling
 *
 * Location: src/pages/ResultsPage/components/FieldDisplayCard.jsx
 */
export default function FieldDisplayCard({ label, value, helpText }) {
  return (
    <Tilt3D className="rounded-xl border-[1.5px] border-(--color-border-ui) p-4">
      <div className="mb-1 text-sm font-semibold tracking-wide text-(--color-text-label) uppercase">
        {label}
      </div>
      <div className="text-sm font-medium text-(--color-text-primary)">
        {toTitleCase(value || '')}
      </div>
      <div className="mt-1 text-sm wrap-break-word text-(--color-text-muted) italic">
        {helpText}
      </div>
    </Tilt3D>
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
