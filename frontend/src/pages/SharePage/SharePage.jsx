import { FieldError, Input, Label, TextField } from '@heroui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, DetailsBadge, Spinner } from '@/components/common';
import { useAssessmentValidationSingle } from '@/features/assessments/hooks';
import { useAuth } from '@/hooks';
import { clearShareFormState, loadShareFormState, saveShareFormState } from '@/lib/storage';
import { isValidUUID } from '@/lib/validation';

export default function SharePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [publicId, setPublicId] = useState('');
  const [error, setError] = useState(null);
  const [showEmptyError, setShowEmptyError] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState(null);
  const [validationData, setValidationData] = useState(null);

  // Save form state to sessionStorage whenever publicId changes
  useEffect(() => {
    // Only save if there's a value
    if (publicId.trim()) {
      saveShareFormState(publicId);
    }
  }, [publicId]);

  // Load saved state from sessionStorage when component mounts
  useEffect(() => {
    const saved = loadShareFormState();
    if (saved?.publicId && isValidUUID(saved.publicId)) {
      setPublicId(saved.publicId);
    }
  }, []);

  // Call the hook at the top level of the component, but only enable when ID is valid UUID
  const { validate, validationQuery } = useAssessmentValidationSingle(
    isValidUUID(publicId) ? publicId : null,
  );

  // Note: Direct share links are now handled by the /assessments/share/:id route
  // This component only renders the share form at /assessments/share

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
    setShowEmptyError(false);

    const id = (publicId || '').trim();

    // Check for empty input first
    if (!id) {
      setShowEmptyError(true);
      return;
    }

    // Check UUID format if input is not empty
    if (!isValidUUID(id)) {
      setError('Incorrect assessment ID format');
      return;
    }

    setValidating(true);
    setValidationMessage('Validating assessment...');

    // Force a re-render to show validation message
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Update validation message to show we're making API calls
    setValidationMessage('Checking assessment availability...');

    try {
      // logger.log('Starting validation for:', id);

      // Use the validate function from the hook
      await validate();

      // Check for validation error after the validate call
      if (validationQuery.error) {
        setValidating(false);
        setValidationMessage(null);
        setError(validationQuery.error.message || 'Invalid ID');
        return;
      }

      // If validation passes, determine correct redirect based on authentication and ownership
      setValidating(false);
      setValidationMessage('Validation successful! Redirecting...');

      // Brief delay to show success message
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Clear validation state and navigate to the appropriate route
      setValidationMessage(null);

      const validationResult = validationQuery.data;
      const isOwner = validationResult?.isOwner;

      // Redirect logic:
      // - If user is authenticated and owns the assessment → /assessments/:publicId
      // - Otherwise (logged out or viewing other's public assessment) → /assessments/share/:publicId
      if (isAuthenticated && isOwner) {
        navigate(`/assessments/${id}`);
      } else {
        navigate(`/assessments/share/${id}`);
      }
    } catch (err) {
      logger.error(err);
      setValidating(false);
      setValidationMessage(null);
      setError(err.message || 'Invalid ID');
    }
  };

  const handleClear = () => {
    setPublicId('');
    setError(null);
    setShowEmptyError(false);
    setValidating(false);
    setValidationMessage(null);
    setValidationData(null);
    clearShareFormState();
  };

  const handleInputChange = (e) => {
    setPublicId(e.target.value);
    // Clear all errors when user starts typing
    if (e.target.value.trim()) {
      setShowEmptyError(false);
      setError(null);
      setValidating(false);
      setValidationMessage(null);
      setValidationData(null);
    } else {
      // If field becomes empty, clear UUID format error but set empty error for validation
      setError(null);
      setValidating(false);
      setValidationMessage(null);
      setValidationData(null);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-6 py-12">
      <h1 className="mb-4 font-sans text-2xl/tight font-medium text-(--color-text-primary)">
        Open a Shared Assessment
      </h1>
      <p className="mb-8 max-w-md text-sm text-(--color-text-secondary)">
        Enter the ID for the assessment you want to view.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <TextField className="w-full" name="public-id" isInvalid={showEmptyError || !!error}>
            <div>
              <Label>Assessment ID</Label>
              {(showEmptyError || error) && (
                <FieldError className="hidden">
                  {showEmptyError ? 'is required' : 'has invalid format'}
                </FieldError>
              )}
            </div>
            <Input
              id="public-id"
              value={publicId}
              onChange={handleInputChange}
              placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              size="lg"
            />
          </TextField>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button type="submit" variant="primary" isLoading={validating}>
              View
            </Button>
            <Button type="button" variant="ghost" onPress={handleClear}>
              Clear
            </Button>
          </div>
          <div>
            {/* Validation message display - show when validating and no error */}
            {validating && validationMessage && !error && (
              <DetailsBadge variant="info" message={validationMessage} icon={Spinner} />
            )}
            {/* Loading state from validation query - show when auto-fetching */}
            {validationQuery.isLoading && !validating && !error && (
              <DetailsBadge variant="info" message="Validating assessment ID..." icon={Spinner} />
            )}
            {/* Success state after auto-fetching completes - show ready message */}
            {!validating && !error && validationData && !validationMessage && (
              <DetailsBadge variant="success" message="Assessment validated! Ready to view." />
            )}
            {/* Success state during manual validation - show redirecting message */}
            {!validating && !error && validationData && validationMessage && (
              <DetailsBadge variant="success" message={validationMessage} />
            )}
            {/* Error display - show when not validating and has error */}
            {!validating && error && <DetailsBadge variant="error" message={error} />}
          </div>
        </div>
      </form>

      {/* Info box */}
      <div className="mt-8 rounded-xl border-3 border-dashed border-(--color-border-ui) bg-transparent p-4">
        <p className="mb-2 text-xs font-semibold tracking-wide text-(--color-text-muted) uppercase">
          About assessment
        </p>
        <ul className="space-y-1.5">
          {[
            'Only assessments set to public are viewable',
            'You can view any of your own assessments',
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
    </div>
  );
}

SharePage.propTypes = {};
