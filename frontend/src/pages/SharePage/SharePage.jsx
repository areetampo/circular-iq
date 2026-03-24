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
    <div className="max-w-2xl mx-auto py-16">
      <h1
        className="text-2xl font-bold mb-4"
        style={{
          color: 'var(--foreground)',
          fontFamily: 'Lora, Georgia, serif',
        }}
      >
        Open a Shared Assessment
      </h1>
      <p
        className="text-sm mb-6"
        style={{
          color: 'var(--muted)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        Enter the public ID for the assessment you want to view.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label
            htmlFor="public-id"
            className="text-sm font-semibold"
            style={{
              color: 'var(--foreground)',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            Public ID
          </Label>
          <Input
            id="public-id"
            value={publicId}
            onChange={(e) => setPublicId(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            size="lg"
            className="mt-2"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2" style={{ color: 'var(--danger)' }}>
            <Frown size={20} />
            <span style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="submit"
            variant="teal"
            isLoading={loading}
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            Open
          </Button>
          <Button
            type="button"
            variant="neutral"
            onPress={() => setPublicId('')}
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
}

SharePage.propTypes = {};
