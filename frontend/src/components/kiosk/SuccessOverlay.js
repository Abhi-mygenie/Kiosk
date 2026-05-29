import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import touchSound from '@/utils/touchSound';

const SuccessOverlay = ({ orderId, tableNumber, onNewOrder, prepTime }) => {
  const [countdown, setCountdown] = useState(15);
  const tokenNumber = orderId ? String(orderId).slice(-3) : '---';

  useEffect(() => {
    touchSound.playSuccess();
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onNewOrder();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onNewOrder]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center p-8 portrait:p-6 landscape:p-16"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <CheckCircle size={100} className="portrait:w-20 portrait:h-20 landscape:w-[120px] landscape:h-[120px] text-blue-medium mx-auto mb-6" />
        </motion.div>
        
        <h1 className="text-3xl portrait:text-3xl landscape:text-5xl font-heading font-bold mb-8 text-blue-dark uppercase tracking-wide">Order Confirmed!</h1>
        
        <div className="bg-blue-light/20 p-4 portrait:p-4 landscape:p-6 rounded-sm mb-8 max-w-md mx-auto border border-blue-hero/30">
          <p className="text-sm portrait:text-sm landscape:text-base font-medium">We are <span className="text-blue-hero font-bold">Preparing</span> your order</p>
          {prepTime && (
            <p className="mt-2 text-sm portrait:text-sm landscape:text-base font-medium">
              Estimated prep time: <span className="text-blue-hero font-heading font-bold uppercase">~{prepTime} minutes</span>
            </p>
          )}
          {tableNumber ? (
            <p className="mt-2 text-sm portrait:text-sm landscape:text-base font-medium">Please proceed to <span className="text-blue-hero font-heading font-bold uppercase">Table {tableNumber}</span></p>
          ) : (
            <p className="mt-2 text-sm portrait:text-sm landscape:text-base font-medium" data-testid="token-number">Your token number: <span className="text-blue-hero font-heading font-bold uppercase text-2xl">{tokenNumber}</span></p>
          )}
        </div>
        
        <div className="mb-8">
          <p className="text-lg portrait:text-lg landscape:text-xl text-muted-foreground">
            Redirecting in{' '}
            <span className="font-bold text-2xl portrait:text-2xl landscape:text-3xl text-blue-hero">{countdown}</span>
          </p>
        </div>
        
        <button
          onClick={onNewOrder}
          className="bg-blue-hero text-white px-8 portrait:px-8 landscape:px-12 py-4 rounded-sm text-lg portrait:text-lg landscape:text-xl font-semibold hover:bg-blue-medium transition-all"
        >
          Start New Order
        </button>
      </motion.div>
    </motion.div>
  );
};

export default SuccessOverlay;
