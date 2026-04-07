import { Input, Label } from '@heroui/react';
import { Frown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/common';

const STORAGE_KEY = 'sharePageInput';

export default function SharePage() {
  const [publicId, setPublicId] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Save to sessionStorage whenever input changes
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, publicId);
  }, [publicId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const id = (publicId || '').trim();
    if (!id) {
      setError('Invalid Public ID');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/assessments/validate/${encodeURIComponent(id)}`);
      if (res.status === 400) {
        setError('Invalid Public ID');
        return;
      }
      if (res.status === 404) {
        setError('Invalid Public ID');
        return;
      }
      if (res.status === 403) {
        setError('Assessment not publicly available');
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Invalid Public ID');
        return;
      }

      // Valid - clear saved input and redirect to public view
      sessionStorage.removeItem(STORAGE_KEY);
      navigate(`/assessments/share/${id}`);
    } catch (err) {
      logger.error(err);
      setError('Invalid Public ID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-6 py-12">
      <h1 className="mb-4 font-display text-2xl/tight font-bold text-(--color-text-primary)">
        Open a Shared Assessment
      </h1>
      <p className="mb-8 max-w-md text-sm text-(--color-text-secondary)">
        Enter the public ID for the assessment you want to view.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label
            htmlFor="public-id"
            className="mb-2 block text-xs font-semibold tracking-wide text-(--color-text-secondary) uppercase"
          >
            Public ID
          </Label>
          <Input
            id="public-id"
            value={publicId}
            onChange={(e) => setPublicId(e.target.value)}
            placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            size="lg"
            className="mt-2 w-full rounded-md border border-(--color-border-strong) bg-transparent text-(--color-text-primary) transition-all outline-none placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-light)"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-(--color-error)">
            <Frown size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" isLoading={loading}>
            Open
          </Button>
          <Button type="button" variant="ghost" onPress={() => setPublicId('')}>
            Clear
          </Button>
        </div>
      </form>

      {/* Info box */}
      <div className="mt-8 rounded-xl border-3 border-border bg-transparent p-4">
        <p className="mb-2 text-xs font-semibold tracking-wide text-(--color-text-muted) uppercase">
          About assessment
        </p>
        <ul className="space-y-1.5">
          {['Only assessments set to public are viewable'].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-(--color-text-secondary)">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-(--color-accent)" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

SharePage.propTypes = {};
