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
          className="text-[14px] font-semibold leading-snug tracking-[-0.01em] mb-1 flex items-center gap-2"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}
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
        className="text-[13px] leading-relaxed mt-0.5 mb-1"
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
        className="bg-[rgba(245,240,232,0.5)] border border-(--color-border-strong) rounded-lg p-4 text-(--color-text-primary) placeholder:text-(--color-text-muted) resize-y transition-all duration-200 outline-none w-full min-h-35"
        style={{
          backgroundColor: 'oklch(0.99 0.008 80 / 0.5)',
          borderColor: 'var(--color-border-strong)',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-body)',
          fontSize: '14.5px',
          lineHeight: '1.8',
          letterSpacing: '0.008em',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--color-accent)';
          e.target.style.borderWidth = '1.5px';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--color-border-strong)';
          e.target.style.borderWidth = '1px';
          flushAutosave();
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
