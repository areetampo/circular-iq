/**
 * @module ErrorBoundary
 * @description React class error boundary that catches render errors and shows a recoverable fallback UI.
 */

import PropTypes from 'prop-types';
import { Component } from 'react';

import DetailsDisplay from '@/components/common/DetailsDisplay';

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
    logger.error('ErrorBoundary caught an error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <DetailsDisplay
          variant="error"
          title="Something went wrong"
          description="An unexpected error occurred. Please try refreshing the page."
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
