import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Error Boundary using a class component to catch and display errors gracefully
 */
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by GlobalErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h1>
              <p className="text-slate-600 mb-4">
                An unexpected error occurred. Please try again or return to the home page.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left bg-slate-50 p-3 rounded border border-slate-200">
                  <summary className="cursor-pointer text-sm font-mono text-slate-600 hover:text-slate-800">
                    Error details (development only)
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-40 text-slate-700">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex gap-3 flex-col sm:flex-row">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-[#34a83a] text-white py-3 px-6 rounded-md font-semibold cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#2a8a2f] hover:shadow-[0_4px_8px_rgba(52,168,58,0.3)]"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="flex-1 bg-slate-200 text-slate-800 py-3 px-6 rounded-md font-semibold cursor-pointer transition-all duration-300 ease-in-out hover:bg-slate-300"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
