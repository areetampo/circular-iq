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
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center justify-start gap-2">
            <Label
              htmlFor={id}
              className="text-base font-semibold"
              style={{ color: 'var(--foreground)' }}
            >
              {label}
            </Label>
            <BadgeInfo
              className="info-icon cursor-pointer"
              size={22}
              style={{ color: 'var(--accent)' }}
              onClick={onInfoClick}
            />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
            {description}
          </p>
        </div>
      </div>
      <Textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        {...register(fieldName, {
          onBlur: () => flushAutosave(),
        })}
        disabled={loading}
        className="w-full rounded-md border placeholder:opacity-60 transition-all duration-200 font-medium"
        style={{
          borderColor: 'var(--field-border)',
          backgroundColor: 'var(--field-bg)',
          color: 'var(--foreground)',
        }}
      />
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
