import React from 'react';
import ResultsPage from '@/pages/ResultsPage/ResultsPage';

export default function AssessmentViewPage() {
  // ResultsPage reads `publicId` from the route params, so just render with share props
  return <ResultsPage isViewFromMyAssessments={true} isPublicShare={true} />;
}
