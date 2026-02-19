import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, Croissant, Apple, Wine } from 'lucide-react';

const WelcomePage = () => {
  const navigate = useNavigate();

  const categories = [
    { icon: Coffee, label: 'Hot Breakfast', path: '/menu/hot-breakfast', color: 'bg-amber-100' },
    { icon: Croissant, label: 'Bakery & Pastry', path: '/menu/bakery', color: 'bg-orange-100' },
    { icon: Apple, label: 'Fruits & Healthy', path: '/menu/healthy', color: 'bg-green-100' },
    { icon: Wine, label: 'Beverages', path: '/menu/beverages', color: 'bg-blue-100' },
  ];

  return (
    <div className="h-screen overflow-hidden bg-[#F9F8F6] flex flex-col">
      <div
        className="flex-1 bg-cover bg-center relative"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/12255469/pexels-photo-12255469.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940)',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex flex-col items-center justify-center text-white px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-8xl font-serif font-medium tracking-tight leading-none mb-4">
              Good Morning
            </h1>
            <p className="text-2xl tracking-widest uppercase opacity-90">
              Welcome to Hotel Lumiere Breakfast Buffet
            </p>
          </motion.div>
        </div>
      </div>

      <div className="bg-white p-12">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-serif font-medium text-center mb-8"
        >
          Select a Category to Start Ordering
        </motion.h2>
        
        <div className="grid grid-cols-4 gap-6 max-w-6xl mx-auto">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.button
                key={category.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                onClick={() => navigate(category.path)}
                data-testid={`category-${category.label.toLowerCase().replace(/\s+/g, '-')}`}
                className="bg-card border border-border rounded-sm p-8 hover:shadow-[0_8px_30px_-2px_rgba(0,0,0,0.1)] transition-all touch-target flex flex-col items-center space-y-4 active:scale-98"
              >
                <div className={`${category.color} w-20 h-20 rounded-full flex items-center justify-center`}>
                  <Icon size={40} className="text-foreground" />
                </div>
                <span className="text-xl font-medium text-center">{category.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;