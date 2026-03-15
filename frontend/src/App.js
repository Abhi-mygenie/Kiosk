import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MenuSettingsProvider, useMenuSettings } from '@/contexts/MenuSettingsContext';
import KioskPage from '@/pages/KioskPage';
import LoginPage from '@/pages/LoginPage';
import AdminSettingsPage from '@/pages/AdminSettingsPage';
import '@/App.css';

// Auth-aware app content
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { settingsComplete } = useMenuSettings();

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

  // Show admin settings if not yet completed/skipped
  if (!settingsComplete) {
    return <AdminSettingsPage />;
  }

  // Show kiosk page if authenticated and settings done
  return <KioskPage />;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MenuSettingsProvider>
          <CartProvider>
            <BrowserRouter>
              <Toaster position="top-center" richColors />
              <AppContent />
            </BrowserRouter>
          </CartProvider>
        </MenuSettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
