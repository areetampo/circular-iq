/**
 * Route wrapper for either the manual comparison form or populated comparison results.
 */

import { useSearchParams } from 'react-router-dom';

import { usePageTitle } from '@/hooks';
import AssessmentComparisonPage from '@/pages/AssessmentComparisonPage/AssessmentComparisonPage';

import { CompareForm } from './components';

/**
 * Renders comparison results only when both `id1` and `id2` query params are present.
 *
 * @returns {import('react').ReactElement} Comparison results for a complete query, otherwise the centered ID-entry form.
 */
export default function ComparePageWrapper() {
  const [searchParams] = useSearchParams();
  const id1 = searchParams.get('id1');
  const id2 = searchParams.get('id2');

  usePageTitle(id1 && id2 ? 'Comparing Assessments' : 'Compare Assessments');

  if (id1 && id2) {
    return <AssessmentComparisonPage />;
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center p-6">
      <CompareForm />
    </div>
  );
}
