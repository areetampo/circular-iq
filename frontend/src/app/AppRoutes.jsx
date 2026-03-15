import LoaderComponent from '@/components/common/LoaderComponent';
import { GlobalErrorBoundary, PageErrorBoundary } from '@/components/error-boundaries';
import AppContainer from '@/components/layout/AppContainer';
import { useAuth } from '@/hooks/useAuth';
import PropTypes from 'prop-types';
import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';

function ResultsToAssessmentsMarketAnalysisRedirect() {
  const { id } = useParams();
  return <Navigate to={`/assessments/${id}/market-analysis`} replace />;
}

// Lazy-load page components for performance
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
const AuthPage = lazy(() => import('@/pages/AuthPage/AuthPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage/NotFoundPage'));

/**
 * ProtectedRoute - Wrapper component for routes that require authentication
 *
 * Checks if user is authenticated using the useAuth hook.
 * If not authenticated, redirects to /auth.
 * If authenticated, renders the children components.
 *
 * @param {React.ReactNode} children - The protected content to render
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useAuth();

  // Show loader while checking authentication status
  if (authLoading) {
    return (
      <LoaderComponent
        heading="Authenticating..."
        message="Please wait while we verify your session."
      />
    );
  }

  // Redirect to auth page if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // User is authenticated, render the protected content
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
 * AppRoutes defines all application routes.
 * Pages are lazy-loaded and wrapped in Suspense for better performance.
 * The entire routing tree is wrapped in GlobalErrorBoundary for graceful error handling.
 * Complex pages (ResultsPage, AssessmentComparisonPage) are wrapped in PageErrorBoundary
 * to catch rendering, chart, or data processing errors without breaking navigation.
 *
 * Protected routes (require authentication):
 * - / (LandingPage)
 * - /results (ResultsPage)
 * - /assessments (MyAssessmentsPage)
 * - /assessments/:id (ResultsPage detail view)
 * - /assessments/compare (AssessmentComparisonPage)
 *
 * Public routes:
 * - /auth (AuthPage)
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
          <Routes>
            {/* Public Route - Authentication */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Public Route - Shared Assessment (DEPRECATED: redirecting to new share path) */}
            <Route
              path="/share/:publicId"
              element={
                <PageErrorBoundary pageName="Share Redirect">
                  <ShareRedirect />
                </PageErrorBoundary>
              }
            />
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

            {/* Protected Routes - Require Authentication */}
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/results"
              element={
                <PageErrorBoundary pageName="Results">
                  <ResultsPage />
                </PageErrorBoundary>
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
              path="/assessments/:id"
              element={
                <ProtectedRoute>
                  <PageErrorBoundary pageName="Assessment Results">
                    <ResultsPage isViewFromMyAssessments={true} />
                  </PageErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessments/compare"
              element={
                <ProtectedRoute>
                  <PageErrorBoundary pageName="Assessment Comparison">
                    <AssessmentComparisonPage />
                  </PageErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessments/:id/market-analysis"
              element={
                <ProtectedRoute>
                  <PageErrorBoundary pageName="Market Analysis">
                    <MarketAnalysisPage isViewFromMyAssessments={true} />
                  </PageErrorBoundary>
                </ProtectedRoute>
              }
            />

            {/* Session-based market analysis for unsaved results (public) */}
            <Route
              path="/results/market-analysis"
              element={
                <PageErrorBoundary pageName="Session Market Analysis">
                  <MarketAnalysisPage />
                </PageErrorBoundary>
              }
            />

            {/* optional backward-compat redirect from old results/:id path to new assessments path */}
            <Route
              path="/results/:id/market-analysis"
              element={<ResultsToAssessmentsMarketAnalysisRedirect />}
            />

            {/* 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppContainer>
      </Suspense>
    </GlobalErrorBoundary>
  );
}
