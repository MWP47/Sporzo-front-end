import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-red-500/10 border border-red-500/30 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-red-400 mb-4">⚠️ Something went wrong</h2>
            
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-red-300 mb-2">Error Details:</h3>
              <p className="text-red-200 text-sm font-mono">
                {this.state.error && this.state.error.toString()}
              </p>
            </div>

            {this.state.errorInfo && (
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-red-300 mb-2">Component Stack:</h3>
                <pre className="text-red-200 text-xs overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                🔄 Reload Page
              </button>
              
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                🔙 Try Again
              </button>
            </div>

            <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h4 className="font-semibold text-blue-400 mb-2">Troubleshooting Tips:</h4>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>• Try refreshing the page</li>
                <li>• Clear browser cache and cookies</li>
                <li>• Check browser console for more details</li>
                <li>• Try in incognito/private mode</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
