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
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center gap-2">
        <Label
          htmlFor={id}
          className="text-sm font-medium tracking-wide text-(--color-text-primary) mb-1 flex items-center gap-2"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.025em' }}
        >
          {label}
        </Label>
        <BadgeInfo
          className="info-icon cursor-pointer transition-all duration-200 hover:scale-110"
          size={16}
          style={{ color: 'var(--color-accent)' }}
          onClick={onInfoClick}
          aria-label={`Get more information about ${label}`}
          tabIndex={0}
          role="button"
        />
      </div>

      {/* Description */}
      <p
        className="text-[13px] leading-relaxed"
        style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
      >
        {description}
      </p>

      {/* Textarea */}
      <Textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        {...register(fieldName, {
          onBlur: () => flushAutosave(),
        })}
        disabled={loading}
        className="bg-(--color-bg-field) border border-(--color-border-strong) rounded-lg p-4 text-[15px] text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-light) resize transition-all duration-200 outline-none w-full min-h-35"
        style={{
          fontFamily: 'var(--font-body)',
          lineHeight: '1.6',
          letterSpacing: '0.01em',
        }}
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
