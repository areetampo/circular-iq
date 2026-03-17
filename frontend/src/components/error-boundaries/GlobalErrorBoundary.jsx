import PropTypes from 'prop-types';
import React from 'react';

import ErrorDisplay from '@/components/common/ErrorDisplay';

/**
 * Global Error Boundary for routing level - catches page-level errors
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
        <ErrorDisplay
          variant="error"
          title="Something went wrong"
          message="An unexpected error occurred. Please try refreshing the page or return to the home page."
          errorDetails={this.state.error}
          fullScreen={true}
        />
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;

GlobalErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
