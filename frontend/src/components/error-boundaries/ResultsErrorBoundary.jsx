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
    logger.error('Error caught by ResultsErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex items-center justify-center p-8 border rounded-lg w-max h-max"
          style={{
            borderColor: 'var(--danger)',
            backgroundColor: 'var(--danger-soft)',
          }}
        >
          <h2
            className="mb-2 text-xl font-bold"
            style={{
              color: 'var(--danger)',
            }}
          >
            Unable to Display Results
          </h2>
          <p
            className="mb-4"
            style={{
              color: 'var(--danger)',
            }}
          >
            There was an error displaying this assessment. Please try refreshing the page or return
            to your assessments.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 font-semibold rounded-md cursor-pointer transition-colors bg-[var(--danger)] text-[var(--surface)] hover:bg-[var(--foreground)]"
            >
              Refresh Page
            </button>
            <button
              onClick={() => (window.location.href = '/assessments')}
              className="px-4 py-2 font-semibold rounded-md cursor-pointer transition-colors bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--accent-soft)]"
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
