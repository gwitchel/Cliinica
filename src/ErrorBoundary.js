import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state to show fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can log the error to an error reporting service here
        console.error("Error Boundary Caught an Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // Render a fallback UI
            return (
                <div>
                    <h2>Something went wrong.</h2>
                    <p>{this.state.error?.toString()}</p>
                    <button onClick={() => this.setState({ hasError: false })}>Try Again</button>
                </div>
            );
        }

        // Render children if no error
        return this.props.children;
    }
}

export default ErrorBoundary;
