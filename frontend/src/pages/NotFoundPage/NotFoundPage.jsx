import { ArrowLeft, BarChart3, Compass, Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/common';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-6 py-12">
      <div
        className="w-full border-2 rounded-xl"
        style={{
          borderColor: 'var(--success)',
          background: 'linear-gradient(to bottom right, var(--surface), var(--success-soft))',
        }}
      >
        <div className="px-6 py-8 border-b text-center" style={{ borderColor: 'var(--border)' }}>
          <div
            className="flex items-center justify-center gap-3"
            style={{ color: 'var(--success)' }}
          >
            <span
              className="text-sm font-semibold uppercase tracking-[0.35em]"
              style={{ color: 'var(--foreground)' }}
            >
              Circular Economy Auditor
            </span>
            <Leaf size={32} />
          </div>
          <h1
            className="mt-6 text-5xl font-bold"
            style={{
              color: 'var(--foreground)',
            }}
          >
            404
          </h1>
          <p
            className="text-lg mt-2"
            style={{
              color: 'var(--muted)',
            }}
          >
            Page Not Found
          </p>
        </div>
        <div className="px-6 py-8 space-y-6 text-center">
          <p
            className="mx-auto text-base"
            style={{
              color: 'var(--muted)',
            }}
          >
            The page you&apos;re looking for doesn&apos;t exist. It may have been moved, renamed, or
            deleted. Let&apos;s get you back on track.
          </p>

          <div
            className="grid gap-4 p-4 text-left border rounded-xl sm:grid-cols-2"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="p-2 mt-1 rounded-full"
                style={{
                  backgroundColor: 'var(--success-soft)',
                  color: 'var(--success)',
                }}
              >
                <Compass size={16} />
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: 'var(--foreground)',
                  }}
                >
                  Need guidance?
                </p>
                <p
                  className="text-xs"
                  style={{
                    color: 'var(--muted)',
                  }}
                >
                  Visit the dashboard to evaluate a new business idea.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div
                className="p-2 mt-1 rounded-full"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent)',
                }}
              >
                <BarChart3 size={16} />
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: 'var(--foreground)',
                  }}
                >
                  Review past work
                </p>
                <p
                  className="text-xs"
                  style={{
                    color: 'var(--muted)',
                  }}
                >
                  Jump to your saved assessments and comparisons.
                </p>
              </div>
            </div>
          </div>

          <div className="w-full h-px my-4" style={{ backgroundColor: 'var(--border)' }} />

          <div className="flex flex-wrap justify-center gap-3">
            <Button onPress={() => navigate('/')} variant="tertiary">
              <ArrowLeft size={16} />
              Return Home
            </Button>
            <Button variant="tertiary" onPress={() => navigate('/assessments')}>
              <BarChart3 size={16} />
              My Assessments
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

NotFoundPage.propTypes = {};
