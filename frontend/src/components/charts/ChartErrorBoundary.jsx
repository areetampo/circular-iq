import PropTypes from 'prop-types';
import { Component } from 'react';

/**
 * ChartErrorBoundary - Catches and handles errors in chart components
 * Provides graceful fallback UI with retry functionality
 */
class ChartErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      logger.error('Chart Error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      const { fallback, height = 300, className } = this.props;

      if (fallback) {
        return typeof fallback === 'function'
          ? fallback(this.state.error, this.handleRetry)
          : fallback;
      }

      return (
        <div
          className={`flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-(--color-border-ui) bg-(--color-bg-card-light) p-6 ${className || ''}`}
          style={{ height: height }}
        >
          <div className="text-center">
            <div className="mb-2 text-3xl text-(--color-error)">⚠️</div>
            <h3 className="m-0 font-mono text-lg font-semibold text-(--color-text-primary)">
              Chart Error
            </h3>
            <p className="my-2 font-mono text-sm text-(--color-text-muted)">
              Unable to render chart. Please try again.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left font-mono text-xs text-(--color-text-muted)">
                <summary className="cursor-pointer font-semibold">Error Details</summary>
                <pre className="mt-2 max-h-24 overflow-auto rounded-sm bg-(--color-bg-card-light) p-2 font-mono">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
          <button
            onClick={this.handleRetry}
            className="cursor-pointer rounded-sm border border-(--color-border-ui) bg-transparent px-3 py-1 font-sans text-xs text-(--color-text-secondary)"
          >
            Retry {this.state.retryCount > 0 && `(${this.state.retryCount})`}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ChartErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  height: PropTypes.number,
  className: PropTypes.string,
};

export default ChartErrorBoundary;
