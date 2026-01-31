import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Loader from '@/components/common/Loader';
import GlobalErrorBoundary from '@/components/common/GlobalErrorBoundary';
import ResultsErrorBoundary from '@/components/common/ResultsErrorBoundary';
import { useAuth } from '@/hooks/useAuth';

// Lazy-load page components for performance
const LandingPage = lazy(() => import('@/pages/LandingPage/LandingPage'));
const ResultsPage = lazy(() => import('@/pages/ResultsPage/ResultsPage'));
const MyAssessmentsPage = lazy(() => import('@/pages/MyAssessmentsPage/MyAssessmentsPage'));
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
  const { isAuthenticated, isLoading } = useAuth();

  // Show loader while checking authentication status
  if (isLoading) {
    return (
      <Loader heading="Authenticating..." message="Please wait while we verify your session." />
    );
  }

  // Redirect to auth page if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // User is authenticated, render the protected content
  return children;
}

/**
 * AppRoutes defines all application routes.
 * Pages are lazy-loaded and wrapped in Suspense for better performance.
 * The entire routing tree is wrapped in GlobalErrorBoundary for graceful error handling.
 * ResultsPage is additionally wrapped in ResultsErrorBoundary for chart/data-specific errors.
 *
 * Protected routes (require authentication):
 * - / (LandingPage)
 * - /results (ResultsPage)
 * - /assessments (MyAssessmentsPage)
 * - /assessments/:id (ResultsPage detail view)
 * - /compare/:id1/:id2 (AssessmentComparisonPage)
 *
 * Public routes:
 * - /auth (AuthPage)
 */
export default function AppRoutes() {
  return (
    <GlobalErrorBoundary>
      <Suspense
        fallback={
          <Loader heading="Loading..." message="Please wait while the application loads." />
        }
      >
        <Routes>
          {/* Public Route - Authentication */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected Routes - Require Authentication */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <LandingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <ResultsErrorBoundary>
                  <ResultsPage />
                </ResultsErrorBoundary>
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
            path="/assessments/:id"
            element={
              <ProtectedRoute>
                <ResultsErrorBoundary>
                  <ResultsPage isDetailView={true} />
                </ResultsErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/compare/:id1/:id2"
            element={
              <ProtectedRoute>
                <AssessmentComparisonPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </GlobalErrorBoundary>
  );
}
