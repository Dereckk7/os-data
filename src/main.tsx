import './index.css';

import { Component, type ErrorInfo, type ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

/** Rend les erreurs visibles plutôt que silencieuses (écran blanc). */
class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('DATA OS — erreur fatale :', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#0b0c0f',
            color: '#f5f5f2',
            padding: 32,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#c9b27c',
            }}
          >
            DATA OS — Incident
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginTop: 12 }}>
            L'interface a rencontré une erreur.
          </h1>
          <pre
            style={{
              marginTop: 16,
              padding: 16,
              background: '#111316',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              fontSize: 12,
              lineHeight: 1.7,
              overflow: 'auto',
              color: '#e28d85',
            }}
          >
            {String(this.state.error?.message)}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              padding: '10px 18px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: '#f5f5f2',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Recharger l'application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>
);
