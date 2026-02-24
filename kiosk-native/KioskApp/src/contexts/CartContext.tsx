import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CartItem {
  item_id: string;
  name: string;
  price: number;
  quantity: number;
  variations: string[];
  special_instructions?: string;
  image?: string;
}

// Helper: Treat price of 1 as 0 (complimentary item indicator)
const normalizePrice = (price: number): number => {
  return price === 1 ? 0 : price;
};

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (newItem: CartItem) => {
    // Normalize price when adding
    const normalizedItem = {
      ...newItem,
      price: normalizePrice(newItem.price),
    };
    
    setItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.item_id === normalizedItem.item_id && 
        JSON.stringify(item.variations) === JSON.stringify(normalizedItem.variations)
      );
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += normalizedItem.quantity;
        return updated;
      }
      return [...prev, normalizedItem];
    });
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.item_id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems(prev => prev.map(item => 
      item.item_id === itemId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + (normalizePrice(item.price) * item.quantity), 0);
  };

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ 
      items, 
      addItem, 
      removeItem, 
      updateQuantity, 
      clearCart, 
      getTotal,
      getItemCount 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
