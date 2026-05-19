/**
 * @module FieldDisplayCard
 * @description Tilt card for a labeled metadata field (value plus help text) on Results.
 */

import PropTypes from 'prop-types';

import { Tilt3D } from '@/components/common';
import { toTitleCase } from '@/lib/formatting';

/**
 * Displays a labeled metadata field with optional help text inside a tilt card.
 *
 * @param {Object} props
 * @param {string} props.label - Field label (shown uppercase).
 * @param {string} [props.value] - Field value; title-cased for display.
 * @param {string} props.helpText - Supporting explanation below the value.
 * @returns {import('react').ReactElement}
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
