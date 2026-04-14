import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="max-w-2xl w-full mx-4">
            <div className="bg-white rounded-lg shadow-xl p-8 border-l-4 border-red-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">⚠️ Terjadi Kesalahan</h1>
                  <p className="text-gray-600">Aplikasi mengalami error tak terduga</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Error Message:</p>
                <p className="text-sm text-red-600 font-mono break-all">
                  {this.state.error?.message || 'Unknown error'}
                </p>
              </div>

              {this.state.error?.stack && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                    📋 Stack Trace (Click to expand)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  🔄 Reload Page
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  🏠 Go Home
                </button>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> Buka Developer Console (F12) untuk melihat detail error lebih lengkap.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
