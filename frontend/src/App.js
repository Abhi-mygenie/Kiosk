import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CartProvider } from '@/contexts/CartContext';
import SidebarNav from '@/components/layout/SidebarNav';
import WelcomePage from '@/pages/WelcomePage';
import MenuPage from '@/pages/MenuPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import '@/App.css';

function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster position="top-center" richColors />
          <div className="App kiosk-container">
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              
              <Route
                path="/*"
                element={
                  <div className="flex h-screen">
                    <SidebarNav />
                    <div className="flex-1 bg-[#F9F8F6]">
                      <Routes>
                        <Route path="/menu/:category" element={<MenuPage />} />
                        <Route path="/cart" element={<CartPage />} />
                      </Routes>
                    </div>
                  </div>
                }
              />
            </Routes>
          </div>
        </BrowserRouter>
      </CartProvider>
    </ThemeProvider>
  );
}

export default App;