import { Label, TextArea as Textarea } from '@heroui/react';
import { BadgeInfo } from 'lucide-react';
import PropTypes from 'prop-types';

import LiveCharacterCounter from './LiveCharacterCounter';

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
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center gap-1">
        <Label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary) mb-2 flex items-center gap-1"
        >
          {label}
        </Label>
        <BadgeInfo
          className="info-icon cursor-pointer"
          size={16}
          style={{ color: 'var(--color-text-muted)' }}
          onClick={onInfoClick}
          aria-label={`Get more information about ${label}`}
          tabIndex={0}
          role="button"
        />
      </div>

      {/* Textarea */}
      <Textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        {...register(fieldName, {
          onBlur: () => flushAutosave(),
        })}
        disabled={loading}
        className="bg-[rgba(245,240,232,0.5)] border border-(--color-border-strong) rounded-md p-4 text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-light) resize-none transition-all outline-none w-full min-h-35"
      />

      {/* Character counter */}
      <LiveCharacterCounter fieldName={fieldName} minLength={minLength} />
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
