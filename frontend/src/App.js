import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import axios from 'axios';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CartProvider } from '@/contexts/CartContext';
import SidebarNav from '@/components/layout/SidebarNav';
import HomePage from '@/pages/HomePage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AppContent() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('dosa');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API}/menu/categories`);
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();

    // Track active category from URL
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('category');
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
  }, []);

  useEffect(() => {
    const handleLocationChange = () => {
      const params = new URLSearchParams(window.location.search);
      const categoryParam = params.get('category') || 'dosa';
      setActiveCategory(categoryParam);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  return (
    <div className="App kiosk-container">
      <Routes>
        <Route path="/checkout" element={<CheckoutPage />} />
        
        <Route
          path="/*"
          element={
            <div className="flex h-screen">
              <SidebarNav categories={categories} activeCategory={activeCategory} />
              <div className="flex-1 bg-[#F9F8F6]">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/cart" element={<CartPage />} />
                </Routes>
              </div>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster position="top-center" richColors />
          <AppContent />
        </BrowserRouter>
      </CartProvider>
    </ThemeProvider>
  );
}

export default App;