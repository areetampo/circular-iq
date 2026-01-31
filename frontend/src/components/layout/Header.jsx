import React from 'react';
import PropTypes from 'prop-types';
import Logo from '@/components/common/Logo';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, LogIn, User } from 'lucide-react';

export default function Header({
  showLogo = true,
  title = 'Circular Economy Business Evaluator',
  subtitle = "Evaluate your business idea's circularity potential using AI-driven analysis",
  showAssessmentMethodologyButton = false,
  showEvaluationCriteriaButton = false,
  showMyAssessmentsButton = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, isAuthenticated, signOut } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="relative mb-8">
      {/* Auth Section - Positioned Absolutely on the Right */}
      <div className="absolute top-0 right-0 flex items-center gap-3">
        {isAuthenticated ? (
          <>
            {/* User Profile Display */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-green-200 dark:border-gray-600">
              <User className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {profile?.username || 'Loading...'}
              </span>
            </div>

            {/* Mobile User Badge */}
            <div className="sm:hidden">
              <Badge variant="default" className="gap-1">
                <User className="w-3 h-3" />
                {profile?.username || '...'}
              </Badge>
            </div>

            {/* Sign Out Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </>
        ) : (
          /* Sign In Button for Unauthenticated State */
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/auth')}
            className="gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">Sign In</span>
          </Button>
        )}
      </div>

      {/* Main Header Content - Centered */}
      <div className="text-center pr-32 sm:pr-40">
        {showLogo && (
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
        )}

        <h1 className="mb-2 text-2xl font-bold leading-tight text-center sm:text-3xl md:text-4xl text-slate-800 dark:text-slate-100">
          {title}
        </h1>

        <p className="mt-4 text-lg font-normal text-center text-slate-600 dark:text-slate-300">
          {subtitle}
        </p>

        {/* Navigation Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {showAssessmentMethodologyButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={null}
              className="gap-2 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              📖 <span className="hidden sm:inline">View Assessment Methodology</span>
              <span className="sm:hidden">Methodology</span>
            </Button>
          )}

          {showEvaluationCriteriaButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={null}
              className="gap-2 hover:bg-purple-50 dark:hover:bg-purple-950"
            >
              📋 <span className="hidden sm:inline">View Evaluation Criteria</span>
              <span className="sm:hidden">Criteria</span>
            </Button>
          )}

          {showMyAssessmentsButton && (
            <Button
              variant={isActive('/assessments') ? 'default' : 'secondary'}
              size="sm"
              onClick={() => navigate('/assessments')}
              className={`gap-2 transition-all ${
                isActive('/assessments')
                  ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 ring-2 ring-offset-2 ring-green-500'
                  : ''
              }`}
            >
              📈 <span className="hidden sm:inline">My Assessments</span>
              <span className="sm:hidden">History</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

Header.propTypes = {
  showLogo: PropTypes.bool,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  showAssessmentMethodologyButton: PropTypes.bool,
  showEvaluationCriteriaButton: PropTypes.bool,
  showMyAssessmentsButton: PropTypes.bool,
};
