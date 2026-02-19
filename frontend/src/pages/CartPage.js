import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, X, CheckCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import NumberPad from '@/components/ui/NumberPad';
import axios from 'axios';
import { toast } from 'sonner';

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, getTotal, getItemCount, clearCart } = useCart();
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [countdown, setCountdown] = useState(15);
  const countdownRef = React.useRef(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  const handleTableNumberChange = (value) => {
    setTableNumber(value);
    setShowNumberPad(false);
  };

  const handlePlaceOrder = async () => {
    if (!tableNumber || cart.length === 0) return;
    
    setIsPlacingOrder(true);
    
    try {
      const orderData = {
        table_number: tableNumber,
        items: cart.map(item => ({
          item_id: item.id,
          name: item.name,
          price: item.totalPrice || item.price,
          quantity: item.quantity,
          variations: item.variations || [],
          special_instructions: item.specialInstructions || ''
        })),
        total: getTotal()
      };

      const response = await axios.post(`${API}/orders`, orderData);
      setOrderId(response.data.id);
      setOrderSuccess(true);
      clearCart();
      
      // Redirect to home after 5 seconds
      setTimeout(() => {
        setOrderSuccess(false);
        setTableNumber('');
        navigate('/');
      }, 5000);
    } catch (error) {
      console.error('Failed to place order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#F9F8F6]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-center bg-white p-16 rounded-sm shadow-[0_8px_30px_-2px_rgba(0,0,0,0.1)]"
          data-testid="order-success-message"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <CheckCircle size={120} className="text-[#2D6A4F] mx-auto mb-6" />
          </motion.div>
          
          <h1 className="text-5xl font-serif font-medium mb-4">Order Confirmed!</h1>
          <p className="text-xl text-muted-foreground mb-2">Table Number: {tableNumber}</p>
          <p className="text-lg text-muted-foreground mb-8">Order ID: {orderId.slice(0, 8).toUpperCase()}</p>
          
          <div className="bg-muted p-6 rounded-sm mb-8">
            <p className="text-lg">Your order has been sent to the kitchen</p>
            <p className="text-muted-foreground mt-2">Please proceed to Table {tableNumber}</p>
          </div>
          
          <button
            onClick={() => {
              setOrderSuccess(false);
              setTableNumber('');
              navigate('/');
            }}
            data-testid="back-to-home-button"
            className="bg-accent text-accent-foreground px-12 py-4 rounded-sm text-xl font-medium hover:bg-accent/90 transition-all active:scale-98 touch-target"
          >
            Start New Order
          </button>
        </motion.div>
      </div>
    );
  }

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
                {item.specialInstructions && (
                  <p className="text-sm text-muted-foreground italic mb-1">
                    Note: {item.specialInstructions}
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
          {/* Table Number Selection */}
          <div className="mb-6 pb-6 border-b border-border">
            <label className="block text-xl font-medium mb-3">Table Number</label>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowNumberPad(true)}
                data-testid="select-table-button"
                className="flex-1 bg-muted hover:bg-muted/80 border-2 border-border p-6 rounded-sm text-center transition-all touch-target"
              >
                {tableNumber ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Selected Table</p>
                    <p className="text-4xl font-serif font-medium">{tableNumber}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg text-muted-foreground">Tap to select table number</p>
                  </div>
                )}
              </button>
              {tableNumber && (
                <button
                  onClick={() => setTableNumber('')}
                  className="p-4 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-sm transition-all"
                  data-testid="clear-table-button"
                >
                  <X size={24} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <span className="text-2xl font-serif font-medium">Total</span>
            <span className="text-4xl font-serif font-medium" data-testid="cart-total">
              ₹{getTotal().toFixed(2)}
            </span>
          </div>
          
          <button
            onClick={handlePlaceOrder}
            disabled={!tableNumber || isPlacingOrder}
            data-testid="place-order-button"
            className={`w-full py-6 rounded-sm text-xl font-medium transition-all touch-target ${
              tableNumber && !isPlacingOrder
                ? 'bg-accent text-accent-foreground hover:bg-accent/90 active:scale-98'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {isPlacingOrder ? 'Placing Order...' : tableNumber ? 'Place Order' : 'Select Table Number to Continue'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showNumberPad && (
          <NumberPad
            value={tableNumber}
            onChange={setTableNumber}
            onClose={() => {
              handleTableNumberChange(tableNumber);
            }}
            maxDigits={3}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CartPage;