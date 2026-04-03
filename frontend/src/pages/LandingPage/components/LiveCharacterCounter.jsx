import { useFormContext, useWatch } from 'react-hook-form';

import { getCharacterCount } from '@/lib/validation';
import { cn } from '@/utils/cn';

/**
 * LiveCharacterCounter - Isolated character counter component
 * Uses useWatch to avoid triggering parent re-renders
 *
 * @param {Object} props
 * @param {string} props.fieldName - The form field name to watch
 * @param {number} props.minLength - Minimum required character count (default: 200)
 */
export default function LiveCharacterCounter({ fieldName, minLength = 200 }) {
  const { control } = useFormContext();
  const fieldValue = useWatch({
    control,
    name: fieldName,
    defaultValue: '',
  });

  const charCount = getCharacterCount(fieldValue || '');
  const isValid = charCount >= minLength;

  return (
    <div
      className={cn(
        'text-[12px] font-semibold transition-colors text-right' /* font-semibold not medium */,
        isValid ? 'text-(--color-success)' : 'text-(--color-text-muted)',
      )}
    >
      {charCount} / {minLength} characters
    </div>
  );
}

LiveCharacterCounter.propTypes = {
  fieldName: (props, propName, componentName) => {
    if (!props[propName]) {
      return new Error(
        `Missing prop '${propName}' in '${componentName}'. 'fieldName' is required.`,
      );
    }
    if (typeof props[propName] !== 'string') {
      return new Error(`Invalid prop '${propName}' in '${componentName}'. Expected a string.`);
    }
    return null;
  },
  minLength: (props, propName, componentName) => {
    if (props[propName] && typeof props[propName] !== 'number') {
      return new Error(`Invalid prop '${propName}' in '${componentName}'. Expected a number.`);
    }
    return null;
  },
};
