import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CartProvider } from '@/contexts/CartContext';
import KioskPage from '@/pages/KioskPage';
import '@/App.css';

function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster position="top-center" richColors />
          <KioskPage />
        </BrowserRouter>
      </CartProvider>
    </ThemeProvider>
  );
}

export default App;