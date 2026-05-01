import PropTypes from 'prop-types';
import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';

import DriftingShapesBackground from '@/components/background/DriftingShapesBackground';
import LoaderComponent from '@/components/common/LoaderComponent';
import ScrollToTop from '@/components/common/ScrollToTop';
import { GlobalErrorBoundary, PageErrorBoundary } from '@/components/error-boundaries';
import AppContainer from '@/components/layout/AppContainer';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';

const AuthPage = lazy(() => import('@/pages/AuthPage/AuthPage'));
const LandingPage = lazy(() => import('@/pages/LandingPage/LandingPage'));
const MyAssessmentsPage = lazy(() => import('@/pages/MyAssessmentsPage/MyAssessmentsPage'));
const SharePage = lazy(() => import('@/pages/SharePage/SharePage'));
const ComparePageWrapper = lazy(() => import('@/pages/ComparePage/ComparePageWrapper'));
const ResultsPage = lazy(() => import('@/pages/ResultsPage/ResultsPage'));
const GuidePage = lazy(() => import('@/pages/GuidePage/GuidePage'));
const SolutionsPage = lazy(() => import('@/pages/SolutionsPage/SolutionsPage'));
const GlobalActivityPage = lazy(() => import('@/pages/GlobalActivityPage/GlobalActivityPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage/NotFoundPage'));

/**
 * ProtectedRoute — requires Supabase session (see useAuth).
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useAuth();
  const location = useLocation();

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
    // Pass the current location as state so auth forms can redirect back after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Application routes.
 *
 * Order matters (React Router v6: first match wins):
 * - Static path segments before dynamic (`/assessments/compare` before `/assessments/:publicId`).
 * - Deeper share routes before shallower ones where relevant.
 *
 * Public (no login): `/`, `/auth`, `/guide`, `/results`, `/solutions`, `/global-activity`, `/assessments/share?id=`, `/assessments`, `/assessments/compare`.
 * Protected: `/assessments/:publicId`.
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
          {/* ─── Public Routes ─── */}
          <Route index element={<LandingPage />} />

          <Route
            path="/assessments"
            element={
              <PageErrorBoundary pageName="My Assessments">
                <MyAssessmentsPage />
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
            path="/assessments/compare"
            element={
              <PageErrorBoundary pageName="Compare Assessments">
                <ComparePageWrapper />
              </PageErrorBoundary>
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
            path="/guide"
            element={
              <PageErrorBoundary pageName="Guide">
                <GuidePage />
              </PageErrorBoundary>
            }
          />

          <Route
            path="/solutions"
            element={
              <PageErrorBoundary pageName="Solutions">
                <SolutionsPage />
              </PageErrorBoundary>
            }
          />

          <Route
            path="/global-activity"
            element={
              <PageErrorBoundary pageName="Global Activity">
                <GlobalActivityPage />
              </PageErrorBoundary>
            }
          />

          {/* ─── Protected Routes ─── */}
          <Route
            path="/assessments/:publicId"
            element={
              <ProtectedRoute>
                <PageErrorBoundary pageName="Results page (from assessments/:publicId)">
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
