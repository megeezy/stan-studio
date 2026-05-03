import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    color: '#ef4444',
                    background: '#1a1a1a',
                    height: '100vh',
                    overflow: 'auto',
                    fontFamily: 'monospace'
                }}>
                    <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Something went wrong.</h1>
                    <div style={{ background: '#222', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
                        <h3 style={{ marginTop: 0, color: '#f87171' }}>{this.state.error && this.state.error.toString()}</h3>
                        <details style={{ whiteSpace: 'pre-wrap', color: '#999', marginTop: '10px' }}>
                            <summary style={{ cursor: 'pointer', outline: 'none', marginBottom: '10px' }}>Component Stack</summary>
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </details>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '20px',
                            padding: '10px 24px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}>
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
