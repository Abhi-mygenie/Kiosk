import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const NumberPad = ({ value, onChange, onClose, maxDigits = 3 }) => {
  const handleNumberClick = (num) => {
    const newValue = value + num;
    if (newValue.length <= maxDigits) {
      onChange(newValue);
    }
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-sm p-8 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-serif font-medium">Enter Number</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-sm transition-colors"
            data-testid="numberpad-close-button"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-8">
          <div className="bg-muted p-6 rounded-sm text-center">
            <span className="text-4xl font-serif">{value || '0'}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {numbers.map((num) => (
            <button
              key={num}
              data-testid={`numberpad-button-${num}`}
              onClick={() => {
                if (num === 'C') handleClear();
                else if (num === '⌫') handleBackspace();
                else handleNumberClick(num);
              }}
              className="touch-target bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm text-2xl font-medium transition-all active:scale-95"
            >
              {num}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NumberPad;