import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log error to service
    console.error('ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-red-600 dark:text-red-400">
          <h2 className="text-xl font-bold mb-2">Någonting gick fel</h2>
          <p>{this.state.error?.message}</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => window.location.reload()}>Ladda om sidan</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
