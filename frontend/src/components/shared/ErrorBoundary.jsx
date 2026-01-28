import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Error boundary caught an error - handled gracefully
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center app-container">
          <h1>Something went wrong</h1>
          <p className="mb-4 text-gray-600">{this.state.error?.message}</p>
          <button
            className="back-button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/';
            }}
          >
            Return Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
