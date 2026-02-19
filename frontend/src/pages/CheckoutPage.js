import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { CheckCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, getTotal, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  const tableNumber = location.state?.tableNumber || '0';

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    
    try {
      const orderData = {
        table_number: tableNumber,
        items: cart.map(item => ({
          item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total: getTotal()
      };

      const response = await axios.post(`${API}/orders`, orderData);
      setOrderId(response.data.id);
      setOrderSuccess(true);
      clearCart();
      toast.success('Order placed successfully!');
      
      // Redirect to home after 5 seconds
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (error) {
      console.error('Failed to submit order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
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
            onClick={() => navigate('/')}
            data-testid="back-to-home-button"
            className="bg-accent text-accent-foreground px-12 py-4 rounded-sm text-xl font-medium hover:bg-accent/90 transition-all active:scale-98 touch-target"
          >
            Start New Order
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <div className="p-8 border-b border-border bg-white">
        <h1 className="text-4xl font-serif font-medium" data-testid="checkout-title">Confirm Your Order</h1>
        <p className="text-muted-foreground mt-2">Table Number: {tableNumber}</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollable p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card p-8 rounded-sm border border-border mb-6">
            <h2 className="text-2xl font-serif font-medium mb-6">Order Summary</h2>
            
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                  <div className="flex-1">
                    <span className="text-lg font-medium">{item.name}</span>
                    <span className="text-muted-foreground ml-2">x {item.quantity}</span>
                  </div>
                  <span className="text-lg font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t-2 border-border flex justify-between items-center">
              <span className="text-2xl font-serif font-medium">Total</span>
              <span className="text-3xl font-serif font-medium" data-testid="checkout-total">
                ${getTotal().toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/cart')}
              data-testid="back-to-cart-button"
              className="flex-1 bg-muted text-foreground py-6 rounded-sm text-xl font-medium hover:bg-muted/80 transition-all active:scale-98 touch-target"
            >
              Back to Cart
            </button>
            
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              data-testid="confirm-order-button"
              className="flex-1 bg-accent text-accent-foreground py-6 rounded-sm text-xl font-medium hover:bg-accent/90 transition-all active:scale-98 touch-target disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Placing Order...' : 'Confirm Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;