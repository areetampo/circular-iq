import PropTypes from 'prop-types';
import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';

import DriftingShapesBackground from '@/components/background/DriftingShapesBackground';
import LoaderComponent from '@/components/common/LoaderComponent';
import ScrollToTop from '@/components/common/ScrollToTop';
import { GlobalErrorBoundary, PageErrorBoundary } from '@/components/error-boundaries';
import AppContainer from '@/components/layout/AppContainer';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';

const LandingPage = lazy(() => import('@/pages/LandingPage/LandingPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage/DashboardPage'));
const GuidePage = lazy(() => import('@/pages/GuidePage/GuidePage'));
const ResultsPage = lazy(() => import('@/pages/ResultsPage/ResultsPage'));
const MyAssessmentsPage = lazy(() => import('@/pages/MyAssessmentsPage/MyAssessmentsPage'));
const SharePage = lazy(() => import('@/pages/SharePage/SharePage'));
const AssessmentViewPage = lazy(() => import('@/pages/AssessmentViewPage/AssessmentViewPage'));
const AssessmentComparisonPage = lazy(
  () => import('@/pages/AssessmentComparisonPage/AssessmentComparisonPage'),
);
const ComparePageWrapper = lazy(() => import('@/pages/ComparePage/ComparePageWrapper'));
const AuthPage = lazy(() => import('@/pages/AuthPage/AuthPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage/NotFoundPage'));

import Footer from '../components/layout/Footer';

/**
 * ProtectedRoute — requires Supabase session (see useAuth).
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return (
      <LoaderComponent
        overlay
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
 * Public (no login): `/`, `/auth`, `/guide`, `/results`, `/share/:publicId`, `/assessments/share/*`.
 *
 * Protected: `/dashboard`, `/assessments`, `/assessments/compare?id1=&id2=`, `/assessments/:publicId`.
 */
export default function AppRoutes() {
  return (
    <GlobalErrorBoundary>
      <Routes>
        {/* Auth route — no navbar, no app-bg wrapper */}
        <Route path="/auth" element={<AuthPage />} />

        {/* All other routes — with navbar and app-bg */}
        <Route
          path="/"
          element={
            <div className="app__bg flex min-h-screen flex-col">
              <DriftingShapesBackground />
              <Navbar />
              <main className="flex-1">
                <AppContainer>
                  <ScrollToTop />
                  <Suspense
                    fallback={
                      <LoaderComponent
                        heading="Loading Page..."
                        message="Please wait while the page loads."
                      />
                    }
                  >
                    <Outlet />
                  </Suspense>
                </AppContainer>
              </main>
              <Footer />
            </div>
          }
        >
          <Route index element={<LandingPage />} />

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
                  <ComparePageWrapper />
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

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </GlobalErrorBoundary>
  );
}
