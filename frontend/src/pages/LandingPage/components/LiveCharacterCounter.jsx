/**
 * Live character count and limit indicator for business text fields.
 */

import PropTypes from 'prop-types';
import { useFormContext, useWatch } from 'react-hook-form';

import { getCharacterCount } from '@/lib/validation';
import { cn } from '@/utils/cn';
import { dominantCharRatio, nonLetterDensity, uniqueWordRatio } from '@/utils/formHelpers';

/**
 * Watches one form field and renders its character count plus lightweight quality warnings.
 */
export default function LiveCharacterCounter({ fieldName, minLength = 200, className }) {
  const { control } = useFormContext();
  const fieldValue = useWatch({
    control,
    name: fieldName,
    defaultValue: '',
  });

  const charCount = getCharacterCount(fieldValue || '');
  const meetsMinLength = charCount >= minLength;

  // Match the landing page's junk-input checks so warnings appear before submit.
  const uniqRatio = uniqueWordRatio(fieldValue || '');
  const nonLetterRatio = nonLetterDensity(fieldValue || '');
  const dominantRatio = dominantCharRatio(fieldValue || '');
  const hasQualityIssues = uniqRatio < 0.3 || nonLetterRatio > 0.25 || dominantRatio > 0.5;

  let textColor = 'text-(--color-text-muted)';
  if (meetsMinLength && !hasQualityIssues) {
    textColor = 'text-(--color-success)';
  } else if (meetsMinLength && hasQualityIssues) {
    textColor = 'text-(--color-warning)';
  }

  const getQualityWarning = () => {
    if (!meetsMinLength) return null;

    const warnings = [];
    if (uniqRatio < 0.3) warnings.push('repetitive');
    if (nonLetterRatio > 0.25) warnings.push('many symbols');
    if (dominantRatio > 0.5) warnings.push('repetitive chars');

    return warnings.length > 0 ? ` (${warnings.join(', ')})` : '';
  };

  return (
    <div
      className={cn(
        'text-right text-[0.75rem] font-semibold transition-colors',
        textColor,
        className,
      )}
    >
      {charCount} / {minLength} characters{getQualityWarning()}
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
  className: PropTypes.string,
};
