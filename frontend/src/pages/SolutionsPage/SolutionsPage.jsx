/**
 * @module SolutionsPage
 * @description CE case catalog search page (vector + keyword search over ingested cases).
 */

import { Search } from 'lucide-react';

import { PageHeader, SolutionsSearch } from './components';

/**
 * Page shell with header and `SolutionsSearch` for exploring case studies.
 * @returns {import('react').ReactElement}
 */
export default function SolutionsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
      <PageHeader
        title="Search Solutions"
        description="Discover circular economy solutions from 6,000+ real-world cases"
        icon={Search}
      />

      <SolutionsSearch />
    </div>
  );
}
