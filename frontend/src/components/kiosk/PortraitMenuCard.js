import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Info, AlertTriangle, Flame, Scale } from 'lucide-react';
import touchSound from '@/utils/touchSound';

const PortraitMenuCard = ({ item, cart, onSelectItem }) => {
  const cartItem = cart.find(ci => ci.id === item.id);
  const inCart = !!cartItem;
  const cartQty = cartItem ? cart.filter(ci => ci.id === item.id).reduce((sum, ci) => sum + ci.quantity, 0) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-sm overflow-hidden border-2 transition-all cursor-pointer relative ${
        inCart ? 'border-blue-hero bg-blue-light/10' : 'border-border bg-white hover:border-blue-light'
      }`}
      onClick={() => { touchSound.playTap(); onSelectItem(item); }}
      data-testid={`menu-item-${item.id}`}
    >
      {inCart && (
        <div className="absolute top-1 right-1 z-10 w-5 h-5 bg-blue-hero text-white rounded-full flex items-center justify-center text-[10px] font-bold">
          {cartQty}
        </div>
      )}
      
      <div className={`aspect-square overflow-hidden ${inCart ? 'opacity-80' : ''}`}>
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>
      
      <div className="p-1.5">
        <h3 className="font-heading font-bold text-[16px] truncate uppercase text-blue-dark leading-tight">{item.name}</h3>
        
        {item.description && (
          <div className="flex items-center gap-1 mt-0.5">
            <Info size={14} className="text-blue-hero flex-shrink-0" />
            <span className="text-[13px] text-muted-foreground truncate">{item.description}</span>
          </div>
        )}
        
        <div className="flex gap-1 mt-0.5">
          <div className="flex-1 min-w-0">
            {item.allergens && item.allergens.length > 0 && (
              <div className="flex items-center gap-1">
                <AlertTriangle size={14} className="text-blue-hero flex-shrink-0" />
                <span className="text-[13px] text-muted-foreground truncate">
                  {item.allergens.slice(0, 2).join(', ')}{item.allergens.length > 2 ? '...' : ''}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-0.5">
              {item.calories > 0 && (
                <div className="flex items-center gap-0.5">
                  <Flame size={14} className="text-blue-hero" />
                  <span className="text-[13px] text-muted-foreground">{item.calories}</span>
                </div>
              )}
              {item.portion_size && (
                <div className="flex items-center gap-0.5">
                  <Scale size={14} className="text-blue-hero" />
                  <span className="text-[13px] text-muted-foreground">{item.portion_size}</span>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={(e) => { e.stopPropagation(); onSelectItem(item); }}
            className="w-9 h-9 min-w-[36px] min-h-[36px] aspect-square rounded-full flex items-center justify-center flex-shrink-0 bg-blue-light text-white self-center"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PortraitMenuCard;
