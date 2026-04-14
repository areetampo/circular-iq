import { FieldError, Input, Label, TextField } from '@heroui/react';
import { MoveLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/common';
import { isValidUUID } from '@/lib/validation';

const STORAGE_KEY = 'comparePageInputs';

export default function CompareForm() {
  const [publicId1, setPublicId1] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).id1 : '';
    } catch {
      return '';
    }
  });
  const [publicId2, setPublicId2] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).id2 : '';
    } catch {
      return '';
    }
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEmptyError, setShowEmptyError] = useState({ id1: false, id2: false });
  const navigate = useNavigate();

  // Save to sessionStorage whenever inputs change
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ id1: publicId1, id2: publicId2 }));
  }, [publicId1, publicId2]);

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
        id1: !isId1Valid,
        id2: !isId2Valid,
      });
      setError(
        `Incorrect assessment ID format.\nExample format: 123e4567-e89b-12d3-a456-426614174000`,
      );
      return;
    }

    if (id1 === id2) {
      setError('Please enter two different Assessment IDs');
      return;
    }

    setLoading(true);
    try {
      // Validate both IDs (they must be your own assessments or public)
      const [res1, res2] = await Promise.all([
        fetch(`/api/assessments/validate/${encodeURIComponent(id1)}`),
        fetch(`/api/assessments/validate/${encodeURIComponent(id2)}`),
      ]);

      // Check if either ID is invalid
      if (res1.status === 404 || res2.status === 404) {
        setError('One or more ids incorrect');
        return;
      }

      if (res1.status === 403 || res2.status === 403) {
        setError('One or more assessments are not public');
        return;
      }

      if (!res1.ok || !res2.ok) {
        const body1 = await res1.json().catch(() => ({}));
        const body2 = await res2.json().catch(() => ({}));
        setError(body1.error || body2.error || 'Failed to validate assessment IDs');
        return;
      }

      // Valid - clear saved inputs and navigate to comparison page
      sessionStorage.removeItem(STORAGE_KEY);
      navigate(`/assessments/compare/${id1}/${id2}`);
    } catch (err) {
      logger.error(err);
      setError('One or more ids incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPublicId1('');
    setPublicId2('');
    setError(null);
    setShowEmptyError({ id1: false, id2: false });
  };

  const handleInputChange = (setter, field) => (e) => {
    setter(e.target.value);
    // Clear all errors when user starts typing
    if (e.target.value.trim()) {
      setShowEmptyError((prev) => ({ ...prev, [field]: false }));
      setError(null);
    } else {
      // If field becomes empty, clear UUID format error but set empty error for validation
      setShowEmptyError((prev) => ({ ...prev, [field]: true }));
      setError(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl/tight font-bold text-(--color-text-primary)">
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
                  <FieldError>
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
                  <FieldError>
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

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" isLoading={loading}>
            Compare
          </Button>
          <Button type="button" variant="ghost" onPress={handleClear}>
            Clear
          </Button>
        </div>
      </form>

      {/* Info box */}
      <div className="mt-8 rounded-xl border-3 border-dashed border-(--color-border-ui) bg-transparent p-4">
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

      <div className="flex justify-center">
        <Button type="button" variant="ghost" as={Link} to="/assessments">
          <MoveLeft size={14} />
          Back to Assessments
        </Button>
      </div>
    </div>
  );
}
