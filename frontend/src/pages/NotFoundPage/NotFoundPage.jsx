import { BarChart3, Book, Compass, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/common';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl text-center">
        {/* 404 numeral — large editorial */}
        <p className="font-display text-[7.5rem] leading-none font-bold tracking-tight text-(--color-accent) select-none">
          404
        </p>

        {/* Heading + description */}
        <h1 className="mt-6 font-display text-[1.625rem] font-semibold text-(--color-text-primary)">
          Page Not Found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-(--color-text-muted)">
          The page you&apos;re looking for doesn&apos;t exist. It may have been moved, renamed, or
          deleted.
        </p>

        {/* Thin divider */}
        <div className="mx-auto my-8 h-[1.5px] w-12 bg-(--color-accent)" />

        {/* Navigation options */}
        <div className="mb-8 grid gap-4 text-left sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl border-2 border-border bg-transparent p-4">
            <div className="mt-0.5 shrink-0 rounded-md text-(--color-accent)">
              <Compass size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-(--color-text-primary)">Need guidance?</p>
              <p className="mt-0.5 text-xs text-(--color-text-muted)">
                Visit the home page to start a new assessment.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border-2 border-border bg-transparent p-4">
            <div className="mt-0.5 shrink-0 rounded-md text-(--color-accent)">
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-(--color-text-primary)">Review past work</p>
              <p className="mt-0.5 text-xs text-(--color-text-muted)">
                Jump to your saved assessments and comparisons.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="ghost" as={Link} to="/">
            <Home size={15} />
            Return Home
          </Button>
          <Button variant="ghost" as={Link} to="/assessments">
            <Book size={15} />
            My Assessments
          </Button>
        </div>
      </div>
    </div>
  );
}

NotFoundPage.propTypes = {};
