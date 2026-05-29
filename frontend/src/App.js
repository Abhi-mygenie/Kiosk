import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MenuSettingsProvider, useMenuSettings } from '@/contexts/MenuSettingsContext';
import { TimingSettingsProvider } from '@/contexts/TimingSettingsContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import KioskPage from '@/pages/KioskPage';
import LoginPage from '@/pages/LoginPage';
import AdminSettingsPage from '@/pages/AdminSettingsPage';
import TimingSettingsPage from '@/pages/TimingSettingsPage';
import '@/App.css';

// Dev-only trigger to verify ErrorBoundary (Phase 1 test P1.T4).
// Visit any URL with ?force-crash=1 in non-production builds and the app throws.
const ForceCrashProbe = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('force-crash') === '1') {
      throw new Error('ForceCrashProbe: triggered via ?force-crash=1 (dev only)');
    }
  }, []);
  return null;
};

// Auth-aware app content
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { settingsComplete } = useMenuSettings();
  const [activeView, setActiveView] = useState(null);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-serif text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Manual navigation from sidebar
  if (activeView === 'menuSettings') {
    return <AdminSettingsPage onBack={() => setActiveView(null)} />;
  }
  if (activeView === 'timingSettings') {
    return <TimingSettingsPage onBack={() => setActiveView(null)} />;
  }

  // Show admin settings if not yet completed/skipped (post-login flow)
  if (!settingsComplete) {
    return <AdminSettingsPage />;
  }

  // Show kiosk page if authenticated and settings done
  return <KioskPage onNavigate={setActiveView} />;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <MenuSettingsProvider>
            <TimingSettingsProvider>
              <CartProvider>
                <BrowserRouter>
                  <ForceCrashProbe />
                  <Toaster position="top-center" toastOptions={{
                    style: {
                      background: '#EBF6FD',
                      border: '1px solid #62B5E5',
                      color: '#06293F',
                    },
                    classNames: {
                      success: 'sonner-brand',
                    },
                  }} />
                  <AppContent />
                </BrowserRouter>
              </CartProvider>
            </TimingSettingsProvider>
          </MenuSettingsProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
