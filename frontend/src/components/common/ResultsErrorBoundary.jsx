import React from 'react';

/**
 * Error Boundary for ResultsPage
 * Catches errors within chart rendering or data processing without breaking global navigation
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
        <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-bold text-red-800 mb-2">Unable to Display Results</h2>
          <p className="text-red-700 mb-4">
            There was an error displaying this assessment. Please try refreshing the page or return
            to your assessments.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white py-2 px-4 rounded-md font-semibold cursor-pointer hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </button>
            <button
              onClick={() => (window.location.href = '/assessments')}
              className="bg-slate-200 text-slate-800 py-2 px-4 rounded-md font-semibold cursor-pointer hover:bg-slate-300 transition-colors"
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
