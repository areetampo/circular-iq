import PropTypes from 'prop-types';
import ErrorDisplay from '@/components/common/ErrorDisplay';

/**
 * Error Boundary for individual pages (Results, Comparison, etc.)
 * Catches errors within page rendering, charts, or data processing
 * without breaking global navigation.
 *
 * Provides a graceful inline error UI with recovery options.
 */
class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by PageErrorBoundary:', error, errorInfo);
    // You could send to error tracking service here (e.g., Sentry)
  }

  render() {
    if (this.state.hasError) {
      const { pageName = 'page' } = this.props;

      return (
        <ErrorDisplay
          variant="error"
          title={`Unable to Display ${pageName}`}
          message={`An unexpected error occurred while rendering this ${pageName.toLowerCase()}. This could be due to data processing or visualization issues.`}
          errorDetails={this.state.error}
          fullScreen={false}
        />
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundary;

PageErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  pageName: PropTypes.string, // Display name for error message (e.g., "Comparison", "Results")
};
