/**
 * Lazy-loaded route tree with page error boundaries and static assessment routes declared before dynamic IDs.
 * The assessment detail route requires authentication; public routes include auth, guide, results, share, compare, activity, and uptime pages.
 */

import PropTypes from 'prop-types';
import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';

import DriftingShapesBackground from '@/components/background/DriftingShapesBackground';
import { LoaderComponent } from '@/components/common';
import { GlobalErrorBoundary, PageErrorBoundary } from '@/components/error-boundaries';
import { ScrollToTop, AppContainer, Footer, Navbar } from '@/components/layout';
import { useAuth, usePageTitle } from '@/hooks';

const AuthPage = lazy(() => import('@/pages/AuthPage/AuthPage'));
const LandingPage = lazy(() => import('@/pages/LandingPage/LandingPage'));
const MyAssessmentsPage = lazy(() => import('@/pages/MyAssessmentsPage/MyAssessmentsPage'));
const SharePage = lazy(() => import('@/pages/SharePage/SharePage'));
const AssessmentViewPage = lazy(() => import('@/pages/AssessmentViewPage/AssessmentViewPage'));
const ComparePageWrapper = lazy(() => import('@/pages/ComparePage/ComparePageWrapper'));
const ResultsPage = lazy(() => import('@/pages/ResultsPage/ResultsPage'));
const GuidePage = lazy(() => import('@/pages/GuidePage/GuidePage'));
const SolutionsPage = lazy(() => import('@/pages/SolutionsPage/SolutionsPage'));
const GlobalActivityPage = lazy(() => import('@/pages/GlobalActivityPage/GlobalActivityPage'));
const UptimeMonitorPage = lazy(() => import('@/pages/UptimeMonitorPage/UptimeMonitorPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage/NotFoundPage'));

const ROUTE_TITLES = {
  '/': 'Evaluate Circular Economy',
  '/assessments': 'My Assessments',
  '/assessments/share': 'Share Gateway',
  '/assessments/compare': 'Compare Assessments',
  '/results': 'Results',
  '/guide': 'User Guide',
  '/solutions': 'Our Solutions',
  '/global-activity': 'Global Activity',
  '/uptime-monitor': 'System Status',
  // Dynamic pages own their page titles because route params or result state affect the label.
};

function TitleSetter() {
  const { pathname } = useLocation();
  const staticTitle = ROUTE_TITLES[pathname]; // undefined for dynamic routes
  usePageTitle(staticTitle); // only fires for exact matches
  return null;
}

/**
 * Renders children when authenticated; otherwise redirects to `redirectTo` after session check.
 */
function ProtectedRoute({ children, redirectTo = '/auth' }) {
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
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  redirectTo: PropTypes.string,
};

/**
 * Renders the app's route tree, shared chrome, route-level titles, and page error boundaries.
 *
 * @returns {import('react').ReactElement} Router tree wrapped in global and per-page error boundaries.
 */
export default function AppRoutes() {
  return (
    <GlobalErrorBoundary>
      <Routes>
        {/* Auth route has no navbar or app background wrapper. */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Primary app routes share navbar, background, footer, and suspense fallback. */}
        <Route
          path="/"
          element={
            <div className="flex min-h-screen flex-col">
              <DriftingShapesBackground />
              <Navbar />
              <main className="flex-1">
                <AppContainer>
                  <TitleSetter />
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
          {/* Public routes */}
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
            path="/assessments/share/:id"
            element={
              <PageErrorBoundary pageName="Shared Assessment View">
                <AssessmentViewPage />
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

          <Route
            path="/uptime-monitor"
            element={
              <PageErrorBoundary pageName="Uptime Monitor">
                <UptimeMonitorPage />
              </PageErrorBoundary>
            }
          />

          {/* Protected routes */}
          <Route
            path="/assessments/:publicId"
            element={
              <ProtectedRoute redirectTo="/assessments">
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
