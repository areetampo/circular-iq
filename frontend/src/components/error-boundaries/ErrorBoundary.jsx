import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ErrorDisplay from '@/components/common/ErrorDisplay';

/**
 * App-level Error Boundary - Last resort catch-all for catastrophic errors
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay
          variant="error"
          title="Something went wrong"
          message="An unexpected error occurred. Please try refreshing the page."
          errorDetails={this.state.error}
          fullScreen={true}
        />
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
