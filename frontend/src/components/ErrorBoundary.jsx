import React from 'react';
import { RefreshCw, AlertTriangle, LogOut } from 'lucide-react';
import { clearKioskStorage } from '@/utils/safeRead';

/**
 * Root-level error boundary for the kiosk.
 *
 * Catches any uncaught error from the React render tree and shows a
 * customer-readable fallback with a single big "Reset Kiosk" button
 * that wipes all `kiosk_*` storage and reloads — recovering even from
 * a poisoned-localStorage state without needing DevTools or admin unlock.
 *
 * Closes audit findings: FE-1 (no ErrorBoundary), FE-U-1 (Logout trapped
 * behind admin mode — recovery now reachable from fallback).
 * See: /app/memory/CRASH_AUDIT.md
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Surface to console; future: route to Sentry / equivalent
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught render error:', error, info?.componentStack);
  }

  handleReset = () => {
    clearKioskStorage();
    // Hard reload to ensure no in-memory state survives.
    window.location.href = '/';
  };

  handleLogoutOnly = () => {
    // Wipe ONLY auth + menu cache, leave settings/timing intact.
    try {
      ['kiosk_user', 'kiosk_menu_data', 'kiosk_branding'].forEach((k) =>
        localStorage.removeItem(k)
      );
    } catch {
      /* ignore */
    }
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const errMessage = this.state.error?.message || 'An unexpected error occurred.';

    return (
      <div
        data-testid="error-boundary-fallback"
        className="h-screen w-screen flex items-center justify-center bg-background px-6"
      >
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-500" />
          </div>

          <h1 className="text-2xl font-heading font-bold uppercase text-blue-dark tracking-wide mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground mb-1">
            The kiosk hit an unexpected error and stopped.
          </p>
          <p className="text-xs text-muted-foreground/70 mb-8 font-mono break-words">
            {errMessage}
          </p>

          <button
            onClick={this.handleReset}
            data-testid="error-boundary-reset-btn"
            className="w-full flex items-center justify-center gap-2 bg-blue-hero text-white py-4 rounded-sm text-lg font-semibold hover:bg-blue-medium transition-all mb-3"
          >
            <RefreshCw size={20} />
            Reset Kiosk
          </button>

          <button
            onClick={this.handleLogoutOnly}
            data-testid="error-boundary-logout-btn"
            className="w-full flex items-center justify-center gap-2 border border-border bg-white text-muted-foreground py-3 rounded-sm text-sm font-medium hover:bg-muted transition-all"
          >
            <LogOut size={16} />
            Log out and reload
          </button>

          <p className="text-[11px] text-muted-foreground/60 mt-6">
            "Reset Kiosk" clears saved settings and signs you out. Use "Log out and reload" to keep
            menu settings.
          </p>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
