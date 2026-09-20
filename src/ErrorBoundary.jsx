import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen bg-slate-900 flex items-center justify-center flex-col gap-4">
          <div className="text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
            <p className="text-slate-300 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded font-mono"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
