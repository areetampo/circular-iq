import { MoveLeft, RotateCw } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';

import DetailsDisplay from '@/components/common/DetailsDisplay';

/**
 * Error Boundary for ResultsPage
 * Catches errors within chart rendering or data processing without breaking global navigation
 *
 * @deprecated Use PageErrorBoundary instead for better styling and flexibility
 */
class ResultsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('Error caught by ResultsErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <DetailsDisplay
          variant="error"
          title="Unable to Display Results"
          message="There was an error displaying this assessment. Please try refreshing the page or return to your assessments."
          actions={[
            {
              label: 'Refresh Page',
              icon: RotateCw,
              onClick: () => window.location.reload(),
              variant: 'teal',
            },
            {
              label: 'Back to Assessments',
              icon: MoveLeft,
              variant: 'ghost',
              as: Link,
              to: '/assessments',
            },
          ]}
          showDefaultActions={false}
        />
      );
    }

    return this.props.children;
  }
}

export default ResultsErrorBoundary;

ResultsErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
