import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Suppress known Recharts v3 harmless dimension warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('width(-1)')) return;
  originalWarn.apply(console, args);
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F6F2', padding: '20px', fontFamily: 'sans-serif' }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(31,77,58,0.1)', maxWidth: '600px', width: '100%', border: '1px solid #E7E5E4' }}>
            <div style={{ width: '64px', height: '64px', background: '#ffebee', color: '#c62828', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', fontSize: '24px', fontWeight: 'bold' }}>!</div>
            <h2 style={{ color: '#1F4D3A', fontSize: '24px', fontWeight: '900', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Application Error</h2>
            <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px', fontWeight: '500' }}>
              An unexpected error occurred while rendering the application. Please refresh the page or contact support if the issue persists.
            </p>
            <details style={{ background: '#F9FAFB', padding: '16px', borderRadius: '12px', fontSize: '12px', color: '#EF4444', overflowX: 'auto', border: '1px solid #F3F4F6' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#4B5563', marginBottom: '8px' }}>Technical Details</summary>
              <pre style={{ marginTop: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {this.state.error && this.state.error.toString()}
                <br /><br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
            <button 
              onClick={() => window.location.reload()} 
              style={{ marginTop: '24px', background: '#1F4D3A', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', width: '100%', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.target.style.background = '#2A634B'}
              onMouseOut={(e) => e.target.style.background = '#1F4D3A'}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

window.onerror = function(message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `<div style="padding:20px;color:red;background:#ffebee;"><h2>Global Error Caught:</h2><pre>${message}\n${error?.stack || ''}</pre></div>`;
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

