import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus } from 'lucide-react';

const CustomizationModal = ({ item, onClose, onAddToCart }) => {
  const [selectedVariations, setSelectedVariations] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const toggleVariation = (variationId) => {
    setSelectedVariations(prev => {
      if (prev.includes(variationId)) {
        return prev.filter(id => id !== variationId);
      }
      return [...prev, variationId];
    });
  };

  const calculateTotal = () => {
    let total = item.price;
    selectedVariations.forEach(varId => {
      const variation = item.variations.find(v => v.id === varId);
      if (variation) {
        total += variation.price;
      }
    });
    return total * quantity;
  };

  const handleAddToCart = () => {
    const variationNames = selectedVariations.map(varId => {
      const variation = item.variations.find(v => v.id === varId);
      return variation?.name || '';
    }).filter(Boolean);

    onAddToCart({
      ...item,
      variations: variationNames,
      quantity,
      specialInstructions,
      totalPrice: calculateTotal()
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-sm w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-3xl font-serif font-medium uppercase tracking-wide" data-testid="customization-modal-title">
            {item.category}
          </h2>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-sm transition-colors touch-target"
            data-testid="close-customization-modal"
          >
            <X size={28} className="text-destructive" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollable p-6">
          {/* Item Info */}
          <div className="mb-6">
            <h3 className="text-2xl font-serif font-medium mb-2">{item.name}</h3>
            <p className="text-muted-foreground mb-2">{item.description}</p>
            <p className="text-xl font-medium">Base Price: ₹{item.price.toFixed(2)}</p>
          </div>

          {/* Variations */}
          {item.variations && item.variations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-medium mb-4">
                CHOICE <span className="text-accent text-sm">(Optional)</span>
              </h3>
              <div className="space-y-3">
                {item.variations.map((variation) => (
                  <button
                    key={variation.id}
                    onClick={() => toggleVariation(variation.id)}
                    data-testid={`variation-${variation.id}`}
                    className="w-full flex items-center space-x-4 p-4 border-2 border-border rounded-sm hover:border-accent transition-all touch-target"
                  >
                    <div
                      className={`w-7 h-7 border-2 border-foreground rounded flex items-center justify-center transition-all ${
                        selectedVariations.includes(variation.id)
                          ? 'bg-accent border-accent'
                          : 'bg-white'
                      }`}
                    >
                      {selectedVariations.includes(variation.id) && (
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                    <span className="text-lg font-medium uppercase tracking-wide flex-1 text-left">
                      {variation.name}
                    </span>
                    {variation.price > 0 && (
                      <span className="text-lg font-medium text-accent">
                        +₹{variation.price.toFixed(2)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <h3 className="text-xl font-medium mb-4">
              SPECIAL INSTRUCTIONS <span className="text-muted-foreground text-sm">(Optional)</span>
            </h3>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              data-testid="special-instructions-input"
              placeholder="Add any special requests or dietary requirements..."
              className="w-full p-4 border-2 border-border rounded-sm focus:border-accent focus:outline-none transition-all min-h-[100px] text-lg resize-none"
              maxLength={200}
            />
            <p className="text-sm text-muted-foreground mt-2">
              {specialInstructions.length}/200 characters
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-6 bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xl font-medium">Quantity</span>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                data-testid="decrease-quantity-modal"
                className="touch-target w-14 h-14 bg-white border-2 border-border hover:border-accent rounded-sm flex items-center justify-center transition-all active:scale-95"
              >
                <Minus size={24} />
              </button>
              <span className="text-3xl font-medium w-16 text-center" data-testid="quantity-display">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                data-testid="increase-quantity-modal"
                className="touch-target w-14 h-14 bg-white border-2 border-border hover:border-accent rounded-sm flex items-center justify-center transition-all active:scale-95"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-serif font-medium">Total</span>
            <span className="text-3xl font-serif font-medium" data-testid="total-price-modal">
              ₹{calculateTotal().toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            data-testid="add-to-cart-final"
            className="w-full bg-accent text-accent-foreground py-6 rounded-sm text-xl font-medium hover:bg-accent/90 transition-all active:scale-98 touch-target"
          >
            Add to Cart
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CustomizationModal;