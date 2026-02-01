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
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-destructive/10 rounded-full">
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
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Details (Development Only)</AlertTitle>
                  <AlertDescription>
                    <pre className="mt-2 text-xs overflow-auto max-h-32 bg-background/50 p-2 rounded">
                      {this.state.error.toString()}
                    </pre>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 flex-col sm:flex-row">
                <Button onClick={() => window.location.reload()} className="flex-1 gap-2" size="lg">
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
