/**
 * App-wide class error boundary around routed content.
 * Its fallback keeps DetailsDisplay defaults, so the home action expects Router context.
 */
import PropTypes from 'prop-types';
import React from 'react';

import DetailsDisplay from '@/components/common/DetailsDisplay';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('[GLOBAL_ERROR_BOUNDARY:RENDER_ERROR]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <DetailsDisplay
          variant="error"
          title="Something went wrong"
          description="An unexpected error occurred. Please try refreshing the page or return to the home page."
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
