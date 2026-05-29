/**
 * Last-resort class error boundary that renders a fullscreen recovery state for render failures.
 * Its fallback avoids Router-dependent actions because it can run before routing has mounted.
 */
import { Home, RotateCw } from 'lucide-react';
import PropTypes from 'prop-types';
import { Component } from 'react';

import DetailsDisplay from '@/components/common/DetailsDisplay';

/**
 * Catches render errors below it and renders a fullscreen recovery state.
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
    logger.error('[ERROR_BOUNDARY:RENDER_ERROR]', error, info);
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
          // ErrorBoundary may fire before Router mounts, so actions use window.location directly.
          showDefaultActions={false}
          actions={[
            {
              label: 'Refresh Page',
              icon: RotateCw,
              onPress: () => window.location.reload(),
            },
            {
              label: 'Return Home',
              icon: Home,
              onPress: () => {
                window.location.href = '/';
              },
            },
          ]}
        />
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
