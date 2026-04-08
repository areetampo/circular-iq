import { Label } from '@heroui/react';
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
    <div className="space-y-0">
      <div className="mb-3 flex flex-col gap-1.5 pl-2">
        {/* Label */}
        <div className="flex items-center gap-2">
          <Label htmlFor={id} className="font-mono text-sm font-semibold">
            {label}
          </Label>
          <BadgeInfo
            className="info-icon mt-px shrink-0 cursor-pointer text-(--color-accent) transition-all duration-200 hover:scale-110"
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
        className="textarea min-h-35 w-full rounded-xl! bg-[rgba(245,240,232,0.5)] p-4 text-(--color-text-primary) transition-all duration-200"
        onBlur={(e) => {
          register(fieldName).onBlur(e);
          if (flushAutosave) flushAutosave();
        }}
      />

      {/* Character counter */}
      <div className="mt-1 pr-2">
        <LiveCharacterCounter fieldName={fieldName} minLength={minLength} />
      </div>
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
