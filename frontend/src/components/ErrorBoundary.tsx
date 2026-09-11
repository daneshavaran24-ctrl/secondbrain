import React from 'react';

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff', fontFamily: 'sans-serif', padding: '2rem', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>خطا در بارگذاری</h2>
          <p style={{ color: '#aaa', textAlign: 'center' }}>مشکلی در اجرای برنامه پیش آمد.</p>
          <pre style={{ background: '#111', padding: '1rem', borderRadius: '8px', fontSize: '0.75rem', color: '#f87171', maxWidth: '600px', overflow: 'auto', whiteSpace: 'pre-wrap', direction: 'ltr' }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/auth'; }}
            style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}
          >
            پاک‌سازی و ورود مجدد
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
