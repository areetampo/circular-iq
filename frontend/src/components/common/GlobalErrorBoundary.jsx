import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, RefreshCcw } from 'lucide-react';

/**
 * Error Boundary using a class component to catch and display errors gracefully
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
        <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-slate-50 to-slate-100">
          <Card className="w-full max-w-md">
            <CardHeader className="pb-4 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertCircle className="w-12 h-12 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription className="text-base">
                An unexpected error occurred. Please try refreshing the page or return to the home
                page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {import.meta.env.DEV && this.state.error && (
                <Alert variant="destructive">
                  <div className="flex items-center justify-start gap-3 pl-1">
                    <AlertCircle className="w-4 h-4" />
                    <AlertTitle className="mt-1">Error Details (Development Only)</AlertTitle>
                  </div>
                  <AlertDescription>
                    <pre className="p-2 mt-2 text-xs break-words whitespace-pre-wrap rounded bg-background/50">
                      {this.state.error.toString()}
                    </pre>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="flex-1 gap-2"
                  size="lg"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button
                  onClick={() => (window.location.href = '/')}
                  variant="outline"
                  className="flex-1 gap-2"
                  size="lg"
                >
                  <Home className="w-4 h-4" />
                  Return Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;

GlobalErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
