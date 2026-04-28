import { FieldError, Input, Label, TextField } from '@heroui/react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/common';
import { isValidUUID } from '@/lib/validation';
import AssessmentViewPage from '@/pages/AssessmentViewPage/AssessmentViewPage';

const STORAGE_KEY = 'sharePageInput';

export default function SharePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [publicId, setPublicId] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEmptyError, setShowEmptyError] = useState(false);

  // Save to sessionStorage whenever input changes
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, publicId);
  }, [publicId]);

  // Handle query parameter for direct share links
  const idFromQuery = searchParams.get('id');
  if (idFromQuery) {
    // Direct access with query parameter - redirect to AssessmentViewPage
    return <AssessmentViewPage publicId={idFromQuery} />;
  }

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
      setError(
        `Incorrect assessment ID format.\nExample format: 123e4567-e89b-12d3-a456-426614174000`,
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/assessments/validate/${encodeURIComponent(id)}`);
      if (res.status === 400 || res.status === 404) {
        setError('Invalid ID');
        return;
      }
      if (res.status === 403) {
        setError('Assessment not publicly available');
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Invalid ID');
        return;
      }

      // Valid - clear saved input and redirect to public view
      sessionStorage.removeItem(STORAGE_KEY);
      navigate(`/assessments/share?id=${id}`);
    } catch (err) {
      logger.error(err);
      setError('Invalid ID');
    } finally {
      setLoading(false);
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
                <FieldError>{showEmptyError ? 'is required' : 'has invalid format'}</FieldError>
              )}
            </div>
            <Input
              id="public-id"
              value={publicId}
              onChange={(e) => {
                setPublicId(e.target.value);
                // Clear all errors when user starts typing
                if (e.target.value.trim()) {
                  setShowEmptyError(false);
                  setError(null);
                } else {
                  // If field becomes empty, clear UUID format error but keep empty error for validation
                  setError(null);
                }
              }}
              placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              size="lg"
            />
          </TextField>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" isLoading={loading}>
            View
          </Button>
          <Button
            type="button"
            variant="ghost"
            onPress={() => {
              setPublicId('');
              setError(null);
              setShowEmptyError(false);
            }}
          >
            Clear
          </Button>
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
