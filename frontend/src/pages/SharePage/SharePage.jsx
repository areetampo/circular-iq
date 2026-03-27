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
    <div className="min-h-[70vh] flex flex-col justify-center max-w-lg mx-auto px-6 py-12">
      <h1
        className="heading-display text-[24px] mb-4"
        style={{
          color: 'var(--foreground)',
        }}
      >
        Open a Shared Assessment
      </h1>
      <p
        className="text-[14px] mb-8 max-w-md"
        style={{
          color: 'var(--muted)',
        }}
      >
        Enter the public ID for the assessment you want to view.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label
            htmlFor="public-id"
            className="text-[13px] font-medium"
            style={{
              color: 'var(--foreground)',
            }}
          >
            Public ID
          </Label>
          <Input
            id="public-id"
            value={publicId}
            onChange={(e) => setPublicId(e.target.value)}
            placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            size="lg"
            className="mt-2 w-full"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2" style={{ color: 'var(--danger)' }}>
            <Frown size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" isLoading={loading}>
            Open
          </Button>
          <Button type="button" variant="secondary" onPress={() => setPublicId('')}>
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
}

SharePage.propTypes = {};
