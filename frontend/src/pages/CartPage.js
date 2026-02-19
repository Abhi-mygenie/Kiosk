import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import NumberPad from '@/components/ui/NumberPad';

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, getTotal, getItemCount } = useCart();
  const [showNumberPad, setShowNumberPad] = useState(false);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowNumberPad(true);
  };

  const handleTableNumberSubmit = (tableNumber) => {
    if (tableNumber) {
      navigate('/checkout', { state: { tableNumber } });
    }
    setShowNumberPad(false);
  };

  const [tableNumber, setTableNumber] = useState('');

  if (cart.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-3xl font-serif font-medium mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add some delicious items to get started</p>
          <button
            onClick={() => navigate('/')}
            data-testid="back-to-menu-button"
            className="bg-accent text-accent-foreground px-8 py-4 rounded-sm touch-target text-lg font-medium hover:bg-accent/90 transition-all active:scale-98"
          >
            Browse Menu
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <div className="p-8 border-b border-border bg-white">
        <h1 className="text-4xl font-serif font-medium" data-testid="cart-title">Your Order</h1>
        <p className="text-muted-foreground mt-2">{getItemCount()} items in cart</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollable p-8">
        <div className="max-w-4xl space-y-4">
          {cart.map((item) => (
            <motion.div
              key={item.cartId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-card p-6 rounded-sm border border-border flex items-center space-x-6"
              data-testid={`cart-item-₹{item.cartId}`}
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-24 h-24 object-cover rounded-sm"
              />
              
              <div className="flex-1">
                <h3 className="text-xl font-serif font-medium">{item.name}</h3>
                {item.variations && item.variations.length > 0 && (
                  <p className="text-sm text-accent mb-1">
                    + {item.variations.join(', ')}
                  </p>
                )}
                <p className="text-muted-foreground">
                  ₹{(item.totalPrice || item.price).toFixed(2)} each
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                  data-testid={`decrease-quantity-₹{item.cartId}`}
                  className="touch-target w-12 h-12 bg-muted hover:bg-muted/80 rounded-sm flex items-center justify-center transition-all active:scale-95"
                >
                  <Minus size={20} />
                </button>
                
                <span className="text-2xl font-medium w-12 text-center" data-testid={`quantity-₹{item.cartId}`}>
                  {item.quantity}
                </span>
                
                <button
                  onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                  data-testid={`increase-quantity-₹{item.cartId}`}
                  className="touch-target w-12 h-12 bg-muted hover:bg-muted/80 rounded-sm flex items-center justify-center transition-all active:scale-95"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="text-2xl font-medium w-32 text-right">
                ₹{((item.totalPrice || item.price) * item.quantity).toFixed(2)}
              </div>

              <button
                onClick={() => removeFromCart(item.cartId)}
                data-testid={`remove-item-₹{item.cartId}`}
                className="touch-target w-12 h-12 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-sm flex items-center justify-center transition-all active:scale-95"
              >
                <Trash2 size={20} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-white border-t border-border p-8">
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-2xl font-serif font-medium">Total</span>
            <span className="text-4xl font-serif font-medium" data-testid="cart-total">
              ₹{getTotal().toFixed(2)}
            </span>
          </div>
          
          <button
            onClick={handleCheckout}
            data-testid="proceed-to-checkout-button"
            className="w-full bg-accent text-accent-foreground py-6 rounded-sm text-xl font-medium hover:bg-accent/90 transition-all active:scale-98 touch-target"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showNumberPad && (
          <NumberPad
            value={tableNumber}
            onChange={setTableNumber}
            onClose={() => {
              handleTableNumberSubmit(tableNumber);
            }}
            maxDigits={3}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CartPage;