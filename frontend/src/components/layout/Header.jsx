import React from 'react';
import PropTypes from 'prop-types';
import Logo from '@/components/common/Logo';
import { useNavigate, useLocation } from 'react-router-dom';

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

  const isActive = (path) => location.pathname === path;

  return (
    <div className="mb-8 text-center">
      {showLogo && (
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
      )}

      <h1 className="mb-2 text-2xl font-bold leading-tight text-center sm:text-3xl md:text-4xl text-slate-800">
        {title}
      </h1>

      <p className="mt-4 text-lg font-normal text-center text-slate-600">{subtitle}</p>

      {/* Info Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mt-6">
        {showAssessmentMethodologyButton && (
          <button className="criteria-button" onClick={null} type="button">
            📖 View Assessment Methodology
          </button>
        )}

        {showEvaluationCriteriaButton && (
          <button className="criteria-button" onClick={null} type="button">
            📋 View Evaluation Criteria
          </button>
        )}

        {showMyAssessmentsButton && (
          <button
            className={`secondary-button text-sm px-5 py-2.5 hover:scale-105 transition-transform ${
              isActive('/assessments') ? 'ring-2 ring-offset-2 ring-[#34a83a] bg-emerald-50' : ''
            }`}
            onClick={() => navigate('/assessments')}
            type="button"
          >
            📈 My Assessments
          </button>
        )}
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
