/**
 * @module BusinessInputField
 * @description Single labeled textarea with character counter for business context fields.
 */

import { Label } from '@heroui/react';
import { BadgeInfo } from 'lucide-react';
import PropTypes from 'prop-types';

import LiveCharacterCounter from './LiveCharacterCounter';

/**
 * Single labeled textarea with character counter for business context fields.
 *
 * @param {Object} props
 * @param {string|number} props.id
 * @param {string} props.label
 * @param {string} props.description
 * @param {string} props.placeholder
 * @param {string} props.fieldName
 * @param {Function} props.register
 * @param {Function} props.onInfoClick
 * @param {boolean} props.loading
 * @param {Function} props.flushAutosave
 * @param {number} props.rows
 * @param {number} props.minLength
 * @returns {import('react').ReactElement}
 */
export default function BusinessInputField({
  id,
  label,
  description,
  placeholder,
  fieldName,
  register,
  onInfoClick,
  loading,
  flushAutosave,
  rows = 4,
  minLength = 200,
}) {
  return (
    <div>
      <div className="mb-3 flex flex-col gap-1.5 pl-2">
        {/* Label */}
        <div className="flex items-center gap-2">
          <Label htmlFor={id} className="font-mono text-sm font-medium uppercase">
            {label}
          </Label>
          <BadgeInfo
            className="icon--info text-(--color-accent)"
            size={20}
            strokeWidth={2}
            onClick={onInfoClick}
            aria-label={`Get more information about ${label}`}
            tabIndex={0}
            role="button"
          />
        </div>

        {/* Description */}
        <p className="font-mono text-xs/relaxed opacity-60">{description}</p>
      </div>

      {/* Textarea */}
      <textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        {...register(fieldName)}
        disabled={loading}
        /* Keep the className minimal to avoid conflicts */
        className="textarea min-h-35 w-full"
        onBlur={(e) => {
          register(fieldName).onBlur(e);
          if (flushAutosave) flushAutosave();
        }}
      />

      {/* Character counter */}
      <LiveCharacterCounter fieldName={fieldName} minLength={minLength} className="mt-1 pr-2" />
    </div>
  );
}

BusinessInputField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  fieldName: PropTypes.string.isRequired,
  register: PropTypes.func.isRequired,
  onInfoClick: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  flushAutosave: PropTypes.func.isRequired,
  rows: PropTypes.number,
  minLength: PropTypes.number,
};
