import { BarChart3, Book, Compass, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/common';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-6 py-16">
      <div className="w-full max-w-2xl text-center">
        {/* 404 numeral — large editorial */}
        <p
          className="text-[7.5rem] font-bold leading-none select-none"
          style={{
            color: 'var(--color-border-strong)',
            fontFamily: 'Lora, serif',
            letterSpacing: '-0.04em',
          }}
        >
          404
        </p>

        {/* Heading + description */}
        <h1
          className="heading-display text-[1.625rem] mt-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Page Not Found
        </h1>
        <p
          className="mt-3 text-[0.9375rem] max-w-md mx-auto leading-relaxed"
          style={{ color: 'var(--color-text-muted)' }}
        >
          The page you&apos;re looking for doesn&apos;t exist. It may have been moved, renamed, or
          deleted.
        </p>

        {/* Thin divider */}
        <div
          className="w-12 h-[1.5px] mx-auto my-8"
          style={{ backgroundColor: 'var(--color-accent)' }}
        />

        {/* Navigation options */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8 text-left">
          <div className="flex items-start gap-3 p-4 rounded-xl border-2 border-(--color-border) bg-transparent">
            <div
              className="p-2 rounded-md mt-0.5 shrink-0"
              style={{ backgroundColor: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
            >
              <Compass size={15} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Need guidance?
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Visit the home page to start a new assessment.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border-2 border-(--color-border) bg-transparent">
            <div
              className="p-2 rounded-md mt-0.5 shrink-0"
              style={{ backgroundColor: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
            >
              <BarChart3 size={15} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Review past work
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Jump to your saved assessments and comparisons.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="ghost" onPress={() => navigate('/')}>
            <Home size={15} />
            Return Home
          </Button>
          <Button variant="ghost" onPress={() => navigate('/assessments')}>
            <Book size={15} />
            My Assessments
          </Button>
        </div>
      </div>
    </div>
  );
}

NotFoundPage.propTypes = {};
