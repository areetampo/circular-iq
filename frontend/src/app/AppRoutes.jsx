import PropTypes from 'prop-types';
import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';

import LoaderComponent from '@/components/common/LoaderComponent';
import ScrollToTop from '@/components/common/ScrollToTop';
import { GlobalErrorBoundary, PageErrorBoundary } from '@/components/error-boundaries';
import AppContainer from '@/components/layout/AppContainer';
import { useAuth } from '@/hooks/useAuth';

function ResultsToAssessmentsMarketAnalysisRedirect() {
  const { id } = useParams();
  return <Navigate to={`/assessments/${id}/market-analysis`} replace />;
}

const LandingPage = lazy(() => import('@/pages/LandingPage/LandingPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage/DashboardPage'));
const GuidePage = lazy(() => import('@/pages/GuidePage/GuidePage'));
const ResultsPage = lazy(() => import('@/pages/ResultsPage/ResultsPage'));
const MarketAnalysisPage = lazy(() => import('@/pages/MarketAnalysisPage/MarketAnalysisPage'));
const MyAssessmentsPage = lazy(() => import('@/pages/MyAssessmentsPage/MyAssessmentsPage'));
const SharePage = lazy(() => import('@/pages/SharePage/SharePage'));
const AssessmentViewPage = lazy(() => import('@/pages/AssessmentViewPage/AssessmentViewPage'));
const AssessmentComparisonPage = lazy(
  () => import('@/pages/AssessmentComparisonPage/AssessmentComparisonPage'),
);
const ComparePage = lazy(() => import('@/pages/ComparePage/ComparePage'));
const AuthPage = lazy(() => import('@/pages/AuthPage/AuthPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage/NotFoundPage'));

/**
 * ProtectedRoute — requires Supabase session (see useAuth).
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return (
      <LoaderComponent
        heading="Authenticating..."
        message="Please wait while we verify your session."
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

function ShareRedirect() {
  const { publicId } = useParams();
  return <Navigate to={`/assessments/share/${publicId}`} replace />;
}

/**
 * Application routes.
 *
 * Order matters (React Router v6: first match wins):
 * - Static path segments before dynamic (`/assessments/compare` before `/assessments/:publicId`).
 * - Deeper share routes before shallower ones where relevant.
 *
 * Public (no login): `/`, `/auth`, `/guide`, `/results`, `/results/market-analysis`,
 * `/results/:id/market-analysis` (redirect), `/share/:publicId`, `/assessments/share/*`.
 *
 * Protected: `/dashboard`, `/assessments`, `/assessments/compare`, `/assessments/compare/:a/:b`,
 * `/assessments/:publicId`, `/assessments/:publicId/market-analysis`.
 */
export default function AppRoutes() {
  return (
    <GlobalErrorBoundary>
      <Suspense
        fallback={
          <LoaderComponent
            heading="Loading..."
            message="Please wait while the application loads."
          />
        }
      >
        <AppContainer>
          <ScrollToTop />
          <Routes>
            {/* ─── Public: auth & landing ─── */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<LandingPage />} />

            {/* ─── Public: legacy share URL → canonical path ─── */}
            <Route
              path="/share/:publicId"
              element={
                <PageErrorBoundary pageName="Share Redirect">
                  <ShareRedirect />
                </PageErrorBoundary>
              }
            />

            {/* ─── Public: share gateway & shared assessment view ─── */}
            <Route
              path="/assessments/share"
              element={
                <PageErrorBoundary pageName="Share Gateway">
                  <SharePage />
                </PageErrorBoundary>
              }
            />
            <Route
              path="/assessments/share/:publicId"
              element={
                <PageErrorBoundary pageName="Shared Assessment View">
                  <AssessmentViewPage />
                </PageErrorBoundary>
              }
            />
            <Route
              path="/assessments/share/:publicId/market-analysis"
              element={
                <PageErrorBoundary pageName="Shared Market Analysis">
                  <MarketAnalysisPage isPublicShare={true} isViewFromMyAssessments={true} />
                </PageErrorBoundary>
              }
            />

            <Route
              path="/guide"
              element={
                <PageErrorBoundary pageName="Guide">
                  <GuidePage />
                </PageErrorBoundary>
              }
            />

            {/* ─── Public: session results (unsaved) & legacy redirects ─── */}
            <Route
              path="/results"
              element={
                <PageErrorBoundary pageName="Results">
                  <ResultsPage />
                </PageErrorBoundary>
              }
            />
            <Route
              path="/results/market-analysis"
              element={
                <PageErrorBoundary pageName="Session Market Analysis">
                  <MarketAnalysisPage />
                </PageErrorBoundary>
              }
            />
            <Route
              path="/results/:id/market-analysis"
              element={<ResultsToAssessmentsMarketAnalysisRedirect />}
            />

            {/* ─── Protected ─── */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessments"
              element={
                <ProtectedRoute>
                  <MyAssessmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessments/compare"
              element={
                <ProtectedRoute>
                  <PageErrorBoundary pageName="Compare Assessments">
                    <ComparePage />
                  </PageErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessments/compare/:publicId1/:publicId2"
              element={
                <ProtectedRoute>
                  <PageErrorBoundary pageName="Assessment Comparison">
                    <AssessmentComparisonPage />
                  </PageErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessments/:publicId"
              element={
                <ProtectedRoute>
                  <PageErrorBoundary pageName="Assessment Results">
                    <ResultsPage isViewFromMyAssessments={true} />
                  </PageErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessments/:publicId/market-analysis"
              element={
                <ProtectedRoute>
                  <PageErrorBoundary pageName="Market Analysis">
                    <MarketAnalysisPage isViewFromMyAssessments={true} />
                  </PageErrorBoundary>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppContainer>
      </Suspense>
    </GlobalErrorBoundary>
  );
}
