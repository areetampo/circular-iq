import { Button, Card } from '@heroui/react';
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
        <Card
          className={className}
          style={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '1rem',
            padding: '2rem',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '2rem',
                marginBottom: '0.5rem',
                color: 'var(--danger)',
              }}
            >
              ⚠️
            </div>
            <h3
              style={{
                margin: 0,
                color: 'var(--foreground)',
                fontSize: '1.125rem',
                fontWeight: 600,
              }}
            >
              Chart Error
            </h3>
            <p
              style={{
                margin: '0.5rem 0',
                color: 'var(--muted)',
                fontSize: '0.875rem',
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
                  color: 'var(--muted)',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Error Details</summary>
                <pre
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: 'var(--surface-raised)',
                    borderRadius: '0.25rem',
                    overflow: 'auto',
                    maxHeight: '100px',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
          <Button onPress={this.handleRetry} size="sm" variant="flat" color="primary">
            Retry {this.state.retryCount > 0 && `(${this.state.retryCount})`}
          </Button>
        </Card>
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
