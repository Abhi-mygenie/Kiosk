import React from 'react';
import { Plus, Minus, MessageSquare } from 'lucide-react';
import touchSound from '@/utils/touchSound';

const InlineCartItem = ({ item, removeFromCart, updateQuantity, setEditingInstructions }) => {
  return (
    <div className="bg-white border border-border rounded-sm px-3 py-2.5 mb-1.5" data-testid={`cart-item-${item.cartId}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <h4 className="font-heading font-bold text-sm uppercase text-blue-dark truncate">{item.name}</h4>
          <button
            onClick={() => { touchSound.playTap(); setEditingInstructions(item); }}
            data-testid={`edit-instructions-${item.cartId}`}
            className={`p-0.5 rounded transition-all flex-shrink-0 ${
              item.specialInstructions 
                ? 'text-blue-hero bg-blue-hero/10' 
                : 'text-muted-foreground hover:text-blue-hero'
            }`}
          >
            <MessageSquare size={14} />
          </button>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => {
              touchSound.playClick();
              if (item.quantity <= 1) {
                removeFromCart(item.cartId);
              } else {
                updateQuantity(item.cartId, item.quantity - 1);
              }
            }}
            className="w-8 h-8 bg-muted rounded flex items-center justify-center hover:bg-red-50 transition-all"
          >
            <Minus size={16} />
          </button>
          <span className="text-base font-bold w-5 text-center">{item.quantity}</span>
          <button
            onClick={() => { touchSound.playClick(); updateQuantity(item.cartId, item.quantity + 1); }}
            className="w-8 h-8 bg-muted rounded flex items-center justify-center hover:bg-blue-light/30 transition-all"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      
      {item.variations?.length > 0 && (
        <p className="text-xs text-blue-hero mt-1 truncate">{item.variations.join(', ')}</p>
      )}
      
      {item.specialInstructions && (
        <p className="text-[11px] text-muted-foreground mt-0.5 italic truncate">"{item.specialInstructions}"</p>
      )}
    </div>
  );
};

export default InlineCartItem;
