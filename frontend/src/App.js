import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MenuSettingsProvider, useMenuSettings } from '@/contexts/MenuSettingsContext';
import { TimingSettingsProvider } from '@/contexts/TimingSettingsContext';
import KioskPage from '@/pages/KioskPage';
import LoginPage from '@/pages/LoginPage';
import AdminSettingsPage from '@/pages/AdminSettingsPage';
import TimingSettingsPage from '@/pages/TimingSettingsPage';
import '@/App.css';

// Auth-aware app content
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { settingsComplete } = useMenuSettings();
  const [activeView, setActiveView] = useState(null);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F9F8F6]">
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
    <AuthProvider>
      <ThemeProvider>
        <MenuSettingsProvider>
          <TimingSettingsProvider>
            <CartProvider>
              <BrowserRouter>
                <Toaster position="top-center" richColors />
                <AppContent />
              </BrowserRouter>
            </CartProvider>
          </TimingSettingsProvider>
        </MenuSettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
