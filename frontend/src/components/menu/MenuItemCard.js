import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

const MenuItemCard = ({ item }) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(item);
    toast.success(`${item.name} added to cart`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-sm overflow-hidden shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-border hover:shadow-[0_8px_30px_-2px_rgba(0,0,0,0.1)] transition-all"
      data-testid={`menu-item-${item.id}`}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="p-4">
        <h3 className="text-xl font-serif font-medium mb-1">{item.name}</h3>
        <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-medium">${item.price.toFixed(2)}</span>
          <button
            onClick={handleAddToCart}
            data-testid={`add-to-cart-${item.id}`}
            className="bg-accent text-accent-foreground touch-target w-12 h-12 rounded-full flex items-center justify-center hover:bg-accent/90 transition-all active:scale-95"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MenuItemCard;