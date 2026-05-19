/**
 * @module CompareForm
 * @description Form to enter two assessment public IDs and navigate to comparison results.
 */

import { FieldError, Input, Label, TextField } from '@heroui/react';
import { Files, MoveLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button, DetailsBadge } from '@/components/common';
import { useAssessmentValidation } from '@/features/assessments/hooks';
import { clearCompareFormState, loadCompareFormState, saveCompareFormState } from '@/lib/storage';
import { isValidUUID } from '@/lib/validation';
import { useSafeBack } from '@/utils/navigation';

/**
 * Form to enter two assessment public IDs and navigate to comparison results.
 * @returns {import('react').ReactElement}
 */
export default function CompareForm() {
  const navigate = useNavigate();
  const goBackSafely = useSafeBack();

  const [publicId1, setPublicId1] = useState('');
  const [publicId2, setPublicId2] = useState('');

  const [error, setError] = useState(null);
  const [showEmptyError, setShowEmptyError] = useState({ id1: false, id2: false });
  const [validating, setValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState(null);
  const [validationData, setValidationData] = useState(null);

  // Save form state to sessionStorage whenever publicId1 or publicId2 changes
  useEffect(() => {
    // Only save if there are values
    if (publicId1.trim() || publicId2.trim()) {
      saveCompareFormState(publicId1, publicId2);
    }
  }, [publicId1, publicId2]);

  // Load saved state from sessionStorage when component mounts
  useEffect(() => {
    const saved = loadCompareFormState();
    if (saved) {
      if (saved.publicId1 && isValidUUID(saved.publicId1)) {
        setPublicId1(saved.publicId1);
      }
      if (saved.publicId2 && isValidUUID(saved.publicId2)) {
        setPublicId2(saved.publicId2);
      }
    }
  }, []);

  // Call the hook at the top level of the component, but only enable when both IDs are valid UUIDs
  const { validate, validationQuery } = useAssessmentValidation(
    isValidUUID(publicId1) ? publicId1 : null,
    isValidUUID(publicId2) ? publicId2 : null,
  );

  // Sync error state and validation data from validation query to local state
  useEffect(() => {
    if (validationQuery.error) {
      setError(validationQuery.error.message || 'Validation failed');
      setValidationData(null);
    } else if (validationQuery.data) {
      setError(null);
      setValidationData(validationQuery.data);
    }
  }, [validationQuery.error, validationQuery.data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setShowEmptyError({ id1: false, id2: false });

    const id1 = (publicId1 || '').trim();
    const id2 = (publicId2 || '').trim();

    // Check for empty inputs first
    const isEmpty1 = !id1;
    const isEmpty2 = !id2;

    if (isEmpty1 || isEmpty2) {
      setShowEmptyError({ id1: isEmpty1, id2: isEmpty2 });
      return;
    }

    // Check UUID format if inputs are not empty
    const isId1Valid = isValidUUID(id1);
    const isId2Valid = isValidUUID(id2);

    if (!isId1Valid || !isId2Valid) {
      // Set specific empty error for invalid fields to trigger inline error messages
      setShowEmptyError({
        id1: !isEmpty1 && !isId1Valid,
        id2: !isEmpty2 && !isId2Valid,
      });
      setError('Incorrect assessment ID format');
      return;
    }

    if (id1 === id2) {
      setError('Please enter two different Assessment IDs');
      return;
    }

    setValidating(true);
    setValidationMessage('Validating assessments...');

    // Force a re-render to show the validation message
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Update validation message to show we're making API calls
    setValidationMessage('Checking assessment availability...');

    try {
      // Use the validate function from the hook
      await validate();

      // Check for validation error after the validate call
      if (validationQuery.error) {
        setValidating(false);
        setValidationMessage(null);
        setError(validationQuery.error.message || 'One or more ids incorrect');
        return;
      }

      // If validation passes, redirect
      setValidating(false);
      setValidationMessage('Validation successful! Redirecting...');

      // Brief delay to show success message
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Clear validation state and navigate
      setValidationMessage(null);
      navigate(`/assessments/compare?id1=${id1}&id2=${id2}`);
    } catch (err) {
      logger.error(err);
      setValidating(false);
      setValidationMessage(null);
      setError(err.message || 'One or more ids incorrect');
    }
  };

  const handleClear = () => {
    setPublicId1('');
    setPublicId2('');
    setError(null);
    setShowEmptyError({ id1: false, id2: false });
    setValidating(false);
    setValidationMessage(null);
    setValidationData(null);
    clearCompareFormState();
  };

  const handleInputChange = (setter, field) => (e) => {
    setter(e.target.value);
    // Clear all errors when user starts typing
    if (e.target.value.trim()) {
      setShowEmptyError((prev) => ({ ...prev, [field]: false }));
      setError(null);
      setValidating(false);
      setValidationMessage(null);
      setValidationData(null);
    } else {
      // If field becomes empty, clear UUID format error but set empty error for validation
      setShowEmptyError((prev) => ({ ...prev, [field]: true }));
      setError(null);
      setValidating(false);
      setValidationMessage(null);
      setValidationData(null);
    }
  };

  return (
    <div className="relative space-y-6">
      <div>
        <h1 className="font-sans text-3xl/tight font-medium text-(--color-text-primary)">
          Compare Assessments
        </h1>
        <p className="mt-2 text-sm text-(--color-text-secondary)">
          Enter the IDs of two assessments you want to compare side by side.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Assessment ID 1 */}
          <div className="space-y-2">
            <TextField
              className="w-full space-y-0.5"
              name="public-id-1"
              isInvalid={showEmptyError.id1}
            >
              <div>
                <Label>First Assessment ID</Label>
                {showEmptyError.id1 && (
                  <FieldError className="hidden">
                    {!publicId1.trim() ? 'is required' : 'has invalid format'}
                  </FieldError>
                )}
              </div>
              <Input
                id="public-id-1"
                value={publicId1}
                onChange={handleInputChange(setPublicId1, 'id1')}
                placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                size="lg"
              />
            </TextField>
          </div>

          {/* Assessment ID 2 */}
          <div className="space-y-2">
            <TextField
              className="w-full space-y-0.5"
              name="public-id-2"
              isInvalid={showEmptyError.id2}
            >
              <div>
                <Label>Second Assessment ID</Label>
                {showEmptyError.id2 && (
                  <FieldError className="hidden">
                    {!publicId2.trim() ? 'is required' : 'has invalid format'}
                  </FieldError>
                )}
              </div>
              <Input
                id="public-id-2"
                value={publicId2}
                onChange={handleInputChange(setPublicId2, 'id2')}
                placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                size="lg"
              />
            </TextField>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button type="submit" variant="primary" isLoading={validating}>
              Compare
            </Button>
            <Button variant="ghost" onPress={handleClear}>
              Clear
            </Button>
          </div>
          <div>
            {/* Validation message display - show when validating and no error */}
            {validating && validationMessage && !error && (
              <DetailsBadge variant="info" message={validationMessage} spinner />
            )}
            {/* Loading state from validation query - show when auto-fetching */}
            {validationQuery.isLoading && !validating && !error && (
              <DetailsBadge variant="info" message="Validating assessment IDs..." spinner />
            )}
            {/* Success state after auto-fetching completes - show ready message */}
            {!validating && !error && validationData && !validationMessage && (
              <DetailsBadge variant="success" message="Assessments validated! Ready to compare." />
            )}
            {/* Error display - show when not validating and has error */}
            {!validating && error && <DetailsBadge variant="error" message={error} />}
          </div>
        </div>
      </form>

      {/* Info box */}
      <div className="mt-6 rounded-xl border-3 border-dashed border-(--color-border-ui) bg-transparent p-4">
        <p className="mb-2 text-xs font-semibold tracking-wide text-(--color-text-muted) uppercase">
          About Comparison
        </p>
        <ul className="space-y-1.5">
          {[
            'You can compare any of your own assessments',
            'You can compare public assessments from other users',
            'Use the Assessment IDs from your assessments list or shared links',
            <>
              Assessment IDs follow the standard UUID format:
              <br />
              <pre className="font-mono text-xs">f47ac10b-58cc-4372-a567-0e02b2c3d479</pre>
            </>,
          ].map((item, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm text-(--color-text-secondary)"
            >
              <span className="mt-2 size-1 shrink-0 rounded-full bg-(--color-accent)" />
              <div className="leading-relaxed">{item}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-center gap-3">
        <Button type="button" variant="ghost" onPress={goBackSafely} icon={MoveLeft}>
          Back
        </Button>
        <Button variant="info-soft" as={Link} to="/assessments" icon={Files}>
          Compare your assessments
        </Button>
      </div>
    </div>
  );
}
