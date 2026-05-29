/**
 * Route-scoped class error boundary for individual pages such as results, comparison, and charts.
 * Its inline DetailsDisplay fallback keeps router-backed default actions available.
 *
 * @prop {string} [pageName] - Display name used in the fallback message (e.g. "Results").
 */

import PropTypes from 'prop-types';
import React from 'react';

import DetailsDisplay from '@/components/common/DetailsDisplay';

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('[PAGE_ERROR_BOUNDARY:RENDER_ERROR]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { pageName = 'page' } = this.props;

      return (
        <DetailsDisplay
          variant="error"
          title={`Unable to Display ${pageName}`}
          description={`An unexpected error occurred while rendering this ${pageName.toLowerCase()}. This could be due to data processing or visualization issues.`}
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
  pageName: PropTypes.string,
};
