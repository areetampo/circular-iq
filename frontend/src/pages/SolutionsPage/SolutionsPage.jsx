import { Search } from 'lucide-react';

import { PageHeader, SolutionsSearch } from './components';

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
