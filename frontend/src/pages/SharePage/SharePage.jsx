import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Label } from '@heroui/react';
import { Button } from '@/components/common';
import { Frown } from 'lucide-react';

export default function SharePage() {
  const [publicId, setPublicId] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

      // Valid - redirect to public view
      navigate(`/assessments/share/${id}`);
    } catch (err) {
      console.error(err);
      setError('Invalid Public ID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-16">
      <h1 className="text-2xl font-bold mb-4">Open a Shared Assessment</h1>
      <p className="text-sm text-slate-600 mb-6">
        Enter the public ID for the assessment you want to view.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="public-id" className="text-sm font-semibold">
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
          <div className="flex items-center gap-2 text-red-600">
            <Frown className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button type="submit" variant="teal" isLoading={loading}>
            Open
          </Button>
          <Button type="button" variant="neutral" onPress={() => setPublicId('')}>
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
}
