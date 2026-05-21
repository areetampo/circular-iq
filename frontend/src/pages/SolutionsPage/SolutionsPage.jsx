/**
 * @module SolutionsPage
 * @description CE case catalog search page (vector + keyword search over ingested cases).
 */

import { Search } from 'lucide-react';

import { SolutionsSearch } from './components';

/**
 * Page shell with header and `SolutionsSearch` for exploring case studies.
 * @returns {import('react').ReactElement}
 */
export default function SolutionsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
      <div className="flex items-end justify-between gap-4 pt-6">
        <div>
          <h1 className="flex items-center gap-3 font-sans text-[2rem] font-medium tracking-[-0.02em] text-(--color-text-primary)">
            <Search size={28} className="text-(--color-success)" strokeWidth={2.5} />
            <span>Search Solutions</span>
          </h1>
          <p className="pl-1 text-sm/relaxed text-(--color-text-secondary)">
            Discover circular economy solutions from 6,000+ real-world cases
          </p>
        </div>
      </div>

      <SolutionsSearch />
    </div>
  );
}
