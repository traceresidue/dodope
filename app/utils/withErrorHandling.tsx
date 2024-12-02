import React, { Component, ComponentType, ErrorInfo } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface WithErrorHandlingProps {
  fallback?: React.ReactNode;
  defaultProps?: Record<string, any>;
  defaultState?: Record<string, any>;
  requiredProps?: string[];
}

const withErrorHandling = <P extends object>(
  WrappedComponent: ComponentType<P>,
  {
    fallback,
    defaultProps = {},
    defaultState = {},
    requiredProps = [],
  }: WithErrorHandlingProps = {}
) => {
  return class extends Component<P, ErrorBoundaryState> {
    state: ErrorBoundaryState = {
      hasError: false,
      error: null,
    };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
      console.error("Error caught by ErrorBoundary:", error, errorInfo);
    }

    resetErrorBoundary = () => {
      this.setState({ hasError: false, error: null });
    };

    render() {
      if (this.state.hasError) {
        return fallback || (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {this.state.error?.message || "An unexpected error occurred."}
            </AlertDescription>
            <Button onClick={this.resetErrorBoundary} className="mt-2">
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </Alert>
        );
      }

      const propsWithDefaults = { ...defaultProps, ...this.props };

      // Check for undefined or null props
      Object.entries(propsWithDefaults).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          console.warn(`Warning: Prop '${key}' is ${value === undefined ? 'undefined' : 'null'}`);
          if (defaultProps.hasOwnProperty(key)) {
            (propsWithDefaults as any)[key] = defaultProps[key];
          }
        }
      });

      // Check for required props
      requiredProps.forEach((prop) => {
        if (!(prop in propsWithDefaults)) {
          console.error(`Error: Required prop '${prop}' is missing`);
        }
      });

      // Wrap the component with default state
      class WrappedWithDefaultState extends React.Component<P> {
        state = { ...defaultState };

        render() {
          if (Object.keys(this.state).some(key => this.state[key] === undefined)) {
            return fallback || <Skeleton className="h-32 w-full" />;
          }

          return <WrappedComponent {...this.props} {...this.state} />;
        }
      }

      return <WrappedWithDefaultState {...propsWithDefaults as P} />;
    }
  };
};

export default withErrorHandling;

