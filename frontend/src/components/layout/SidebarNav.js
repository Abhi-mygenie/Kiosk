import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Coffee, Croissant, Apple, Wine, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';

const SidebarNav = () => {
  const location = useLocation();
  const { getItemCount } = useCart();
  const itemCount = getItemCount();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Coffee, label: 'Hot Breakfast', path: '/menu/hot-breakfast' },
    { icon: Croissant, label: 'Bakery', path: '/menu/bakery' },
    { icon: Apple, label: 'Healthy', path: '/menu/healthy' },
    { icon: Wine, label: 'Beverages', path: '/menu/beverages' },
  ];

  return (
    <div className="w-80 bg-card h-screen flex flex-col border-r border-border">
      <div className="p-8 border-b border-border">
        <h1 className="text-3xl font-serif font-medium text-foreground">Hotel Lumiere</h1>
        <p className="text-sm text-muted-foreground mt-1 uppercase tracking-widest">Breakfast Buffet</p>
      </div>

      <nav className="flex-1 p-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`nav-link-${item.label.toLowerCase().replace(' ', '-')}`}
              className="relative"
            >
              <div
                className={`flex items-center space-x-4 p-4 rounded-sm transition-all touch-target ${
                  isActive
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-r"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon size={24} />
                <span className="text-lg font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <Link
        to="/cart"
        data-testid="nav-link-cart"
        className="m-6 mt-auto"
      >
        <div className="bg-accent text-accent-foreground p-6 rounded-sm flex items-center justify-between touch-target hover:bg-accent/90 transition-all active:scale-98">
          <div className="flex items-center space-x-4">
            <ShoppingCart size={24} />
            <span className="text-lg font-medium">View Cart</span>
          </div>
          {itemCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-white text-accent-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold"
              data-testid="cart-item-count"
            >
              {itemCount}
            </motion.div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default SidebarNav;