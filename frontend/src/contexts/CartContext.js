import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    setCart(prevCart => {
      // Create a unique key based on item id and variations
      const itemKey = `${item.id}_${item.variations?.sort().join('_') || 'plain'}`;
      const existingItemIndex = prevCart.findIndex(
        cartItem => `${cartItem.id}_${cartItem.variations?.sort().join('_') || 'plain'}` === itemKey
      );
      
      if (existingItemIndex !== -1) {
        // Item with same variations exists, update quantity
        const newCart = [...prevCart];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newCart[existingItemIndex].quantity + (item.quantity || 1)
        };
        return newCart;
      }
      
      // New item with unique variations
      return [...prevCart, { 
        ...item, 
        cartId: itemKey,
        quantity: item.quantity || 1,
        variations: item.variations || []
      }];
    });
  };

  const removeFromCart = (cartId) => {
    setCart(prevCart => prevCart.filter(item => item.cartId !== cartId));
  };

  const updateQuantity = (cartId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.cartId === cartId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotal = () => {
    return cart.reduce((total, item) => {
      const itemPrice = item.totalPrice || item.price;
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  const getItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
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
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};