import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log error details for debugging purposes
    if (!import.meta.env.PROD) {
      console.error('ErrorBoundary caught:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-container text-center p-8">
          <h1>Something went wrong</h1>
          <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/';
            }}
            className="primary-button"
          >
            Return Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
