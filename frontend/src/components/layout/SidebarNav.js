import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';

const SidebarNav = ({ categories, activeCategory }) => {
  const navigate = useNavigate();
  const { getItemCount } = useCart();
  const itemCount = getItemCount();

  return (
    <div className="w-80 bg-card h-screen flex flex-col border-r border-border">
      <div className="p-6 border-b border-border">
        <img 
          src="https://customer-assets.emergentagent.com/job_660831f3-d103-4fb3-ae20-d0fe3dd0af53/artifacts/4li3nr0o_hya.png" 
          alt="Hyatt Centric Candolim Goa" 
          className="w-full h-auto max-h-24 object-contain"
        />
        <p className="text-sm text-muted-foreground mt-3 uppercase tracking-widest text-center">Breakfast Buffet</p>
      </div>

      <nav className="flex-1 p-6 space-y-2">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => navigate(`/?category=${category.id}`)}
              data-testid={`nav-category-${category.id}`}
              className="w-full relative"
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
                <span className="text-lg font-medium uppercase tracking-wide">{category.name}</span>
              </div>
            </button>
          );
        })}
      </nav>

      <button
        onClick={() => navigate('/cart')}
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
      </button>
    </div>
  );
};

export default SidebarNav;