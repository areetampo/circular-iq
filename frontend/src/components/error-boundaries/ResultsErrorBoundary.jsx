import PropTypes from 'prop-types';
import React from 'react';

/**
 * Error Boundary for ResultsPage
 * Catches errors within chart rendering or data processing without breaking global navigation
 *
 * @deprecated Use PageErrorBoundary instead for better styling and flexibility
 */
class ResultsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ResultsErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8 border border-red-200 rounded-lg bg-red-50 w-max h-max">
          <h2 className="mb-2 text-xl font-bold text-red-800">Unable to Display Results</h2>
          <p className="mb-4 text-red-700">
            There was an error displaying this assessment. Please try refreshing the page or return
            to your assessments.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 font-semibold text-white transition-colors bg-red-600 rounded-md cursor-pointer hover:bg-red-700"
            >
              Refresh Page
            </button>
            <button
              onClick={() => (window.location.href = '/assessments')}
              className="px-4 py-2 font-semibold transition-colors rounded-md cursor-pointer bg-slate-200 text-slate-800 hover:bg-slate-300"
            >
              Back to Assessments
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ResultsErrorBoundary;

ResultsErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
