import { Input, Label } from '@heroui/react';
import { AlertCircle, Frown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/common';

const STORAGE_KEY = 'comparePageInputs';

export default function ComparePage() {
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
    <div className="max-w-4xl mx-auto py-16">
      <div className="mb-8">
        <h1
          className="text-3xl font-bold mb-2"
          style={{
            color: 'var(--foreground)',
            fontFamily: 'Lora, Georgia, serif',
          }}
        >
          Compare Assessments
        </h1>
        <p
          className="text-sm"
          style={{
            color: 'var(--muted)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          Enter the public IDs of two assessments you want to compare side by side.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assessment ID 1 */}
          <div>
            <Label
              htmlFor="public-id-1"
              className="text-sm font-semibold mb-2 block"
              style={{
                color: 'var(--foreground)',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              First Assessment ID
            </Label>
            <Input
              id="public-id-1"
              value={publicId1}
              onChange={(e) => setPublicId1(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              size="lg"
              className="mt-2"
              style={{
                backgroundColor: 'var(--field-bg)',
                borderColor: 'var(--field-border)',
                color: 'var(--foreground)',
              }}
            />
          </div>

          {/* Assessment ID 2 */}
          <div>
            <Label
              htmlFor="public-id-2"
              className="text-sm font-semibold mb-2 block"
              style={{
                color: 'var(--foreground)',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              Second Assessment ID
            </Label>
            <Input
              id="public-id-2"
              value={publicId2}
              onChange={(e) => setPublicId2(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              size="lg"
              className="mt-2"
              style={{
                backgroundColor: 'var(--field-bg)',
                borderColor: 'var(--field-border)',
                color: 'var(--foreground)',
              }}
            />
          </div>
        </div>

        {error && (
          <div
            className="flex items-start gap-3 p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--danger-soft)',
              borderColor: 'var(--danger)',
              borderWidth: '1px',
            }}
          >
            <Frown size={20} className="mt-0.5 shrink-0" style={{ color: 'var(--danger)' }} />
            <span
              className="text-sm"
              style={{
                color: 'var(--danger)',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {error}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" variant="teal" isLoading={loading}>
            Compare
          </Button>
          <Button type="button" variant="neutral" onPress={handleClear}>
            Clear
          </Button>
          <Button type="button" variant="neutral" onPress={() => navigate('/assessments')}>
            Back to Assessments
          </Button>
        </div>
      </form>

      {/* Info Box */}
      <div
        className="mt-12 p-6 rounded-lg"
        style={{
          backgroundColor: 'var(--info-soft)',
          borderColor: 'var(--info)',
          borderWidth: '1px',
        }}
      >
        <div className="flex gap-3">
          <AlertCircle size={20} className="mt-0.5 shrink-0" style={{ color: 'var(--info)' }} />
          <div
            className="text-sm"
            style={{
              color: 'var(--info)',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <p className="font-semibold mb-2">About Comparison</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>You can compare any of your own assessments</li>
              <li>You can compare public assessments from other users</li>
              <li>Use the Assessment IDs from your assessments list or shared links</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

ComparePage.propTypes = {};
