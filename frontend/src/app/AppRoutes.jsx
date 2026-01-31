import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Loader from '@/components/common/Loader';

// Lazy-load page components for performance
const LandingPage = lazy(() => import('@/pages/LandingPage/LandingPage'));
const ResultsPage = lazy(() => import('@/pages/ResultsPage/ResultsPage'));
const MyAssessmentsPage = lazy(() => import('@/pages/MyAssessmentsPage/MyAssessmentsPage'));
const AssessmentComparisonPage = lazy(
  () => import('@/pages/AssessmentComparisonPage/AssessmentComparisonPage'),
);
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage/NotFoundPage'));

/**
 * AppRoutes defines all application routes.
 * Pages are lazy-loaded and wrapped in Suspense for better performance.
 */
export default function AppRoutes() {
  return (
    <Suspense
      fallback={<Loader heading="Loading..." message="Please wait while the application loads." />}
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/assessments" element={<MyAssessmentsPage />} />
        <Route path="/assessments/:id" element={<ResultsPage isDetailView={true} />} />
        <Route path="/compare/:id1/:id2" element={<AssessmentComparisonPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
