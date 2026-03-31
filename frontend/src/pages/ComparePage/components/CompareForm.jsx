import { Input, Label } from '@heroui/react';
import { ArrowLeft, Frown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/common';

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
  const navigate = useNavigate();

  // Save to sessionStorage whenever inputs change
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ id1: publicId1, id2: publicId2 }));
  }, [publicId1, publicId2]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const id1 = (publicId1 || '').trim();
    const id2 = (publicId2 || '').trim();

    if (!id1 || !id2) {
      setError('Please enter both Assessment IDs');
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
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-(--font-display) text-3xl text-(--color-text-primary) leading-tight">
          Compare Assessments
        </h1>
        <p className="mt-2 text-sm text-(--color-text-secondary)">
          Enter the public IDs of two assessments you want to compare side by side.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Assessment ID 1 */}
          <div>
            <Label
              htmlFor="public-id-1"
              className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary) mb-2 block"
            >
              First Assessment ID
            </Label>
            <Input
              id="public-id-1"
              value={publicId1}
              onChange={(e) => setPublicId1(e.target.value)}
              placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              size="lg"
              className="w-full mt-2 bg-transparent border border-(--color-border-strong) rounded-md text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-light) transition-all outline-none"
            />
          </div>

          {/* Assessment ID 2 */}
          <div>
            <Label
              htmlFor="public-id-2"
              className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary) mb-2 block"
            >
              Second Assessment ID
            </Label>
            <Input
              id="public-id-2"
              value={publicId2}
              onChange={(e) => setPublicId2(e.target.value)}
              placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              size="lg"
              className="w-full mt-2 bg-transparent border border-(--color-border-strong) rounded-md text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-light) transition-all outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg border border-[rgba(139,58,58,0.25)] bg-[rgba(139,58,58,0.05)] text-sm text-(--color-error)">
            <Frown size={20} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" isLoading={loading}>
            Compare
          </Button>
          <Button type="button" variant="secondary" onPress={handleClear}>
            Clear
          </Button>
          <Button type="button" variant="ghost" onPress={() => navigate('/assessments')}>
            <ArrowLeft size={14} />
            Back to Assessments
          </Button>
        </div>
      </form>

      {/* Info box */}
      <div className="mt-8 p-4 rounded-xl border border-(--color-border) bg-transparent">
        <p className="text-xs font-semibold uppercase tracking-wide mb-2 text-(--color-text-muted)">
          About Comparison
        </p>
        <ul className="space-y-1.5">
          {[
            'You can compare any of your own assessments',
            'You can compare public assessments from other users',
            'Use the Assessment IDs from your assessments list or shared links',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-(--color-text-secondary)">
              <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-(--color-accent)" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
