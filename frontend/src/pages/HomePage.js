import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import MenuItemCard from '@/components/menu/MenuItemCard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || 'dosa';
  const [menuItems, setMenuItems] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API}/menu/items`, {
          params: { category }
        });
        setMenuItems(response.data);
        
        // Get category name
        const categoriesResponse = await axios.get(`${API}/menu/categories`);
        const currentCategory = categoriesResponse.data.find(c => c.id === category);
        setCategoryName(currentCategory?.name || 'MENU');
      } catch (error) {
        console.error('Failed to fetch menu items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [category]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-2xl font-serif">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <div className="p-8 border-b border-border bg-white">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-serif font-medium uppercase tracking-wide"
          data-testid="menu-category-title"
        >
          {categoryName}
        </motion.h1>
        <p className="text-muted-foreground mt-2">Select items to add to your order</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollable p-8">
        <div className="grid grid-cols-3 gap-6 max-w-7xl">
          {menuItems.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;