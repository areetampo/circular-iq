import { useSearchParams } from 'react-router-dom';

import AssessmentComparisonPage from '@/pages/AssessmentComparisonPage/AssessmentComparisonPage';

import { CompareForm } from './components';

export default function ComparePageWrapper() {
  const [searchParams] = useSearchParams();
  const id1 = searchParams.get('id1');
  const id2 = searchParams.get('id2');

  // If query parameters are present, show the comparison page
  // Otherwise, show the form to select assessments to compare
  if (id1 && id2) {
    return <AssessmentComparisonPage />;
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-6 py-12">
      <CompareForm />
    </div>
  );
}
