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
      console.error('Chart Error:', error, errorInfo);
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
          className={className}
          style={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '0.75rem',
            padding: '1.5rem',
            border: '1px solid rgba(180,160,130,0.25)',
            borderRadius: '12px',
            backgroundColor: 'rgba(245,240,232,0.5)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '2rem',
                marginBottom: '0.5rem',
                color: '#8b3a3a',
              }}
            >
              ⚠️
            </div>
            <h3
              style={{
                margin: 0,
                color: '#374151',
                fontSize: '1.125rem',
                fontWeight: 600,
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              }}
            >
              Chart Error
            </h3>
            <p
              style={{
                margin: '0.5rem 0',
                color: '#6b7280',
                fontSize: '0.875rem',
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              }}
            >
              Unable to render chart. Please try again.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details
                style={{
                  marginTop: '1rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  fontFamily:
                    'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Error Details</summary>
                <pre
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.25rem',
                    overflow: 'auto',
                    maxHeight: '100px',
                    fontFamily:
                      'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid rgba(180,160,130,0.3)',
              backgroundColor: 'transparent',
              color: '#5a4f42',
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}
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
