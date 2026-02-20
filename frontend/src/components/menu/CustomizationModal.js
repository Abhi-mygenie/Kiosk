import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Minus } from 'lucide-react';

const CustomizationModal = ({ item, onClose, onAddToCart }) => {
  // State for grouped variations - { groupName: [selectedOptionIds] }
  const [selectedByGroup, setSelectedByGroup] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Get variation groups from item
  const variationGroups = item.variation_groups || [];
  
  // Check if all required groups have selections
  const allRequiredSelected = () => {
    for (const group of variationGroups) {
      if (group.required) {
        const selections = selectedByGroup[group.group_name] || [];
        if (selections.length === 0) {
          return false;
        }
      }
    }
    return true;
  };

  // Handle option selection
  const handleOptionSelect = (groupName, optionId, groupType) => {
    setSelectedByGroup(prev => {
      const currentSelections = prev[groupName] || [];
      
      if (groupType === 'single') {
        // Single selection - replace
        if (currentSelections.includes(optionId)) {
          return { ...prev, [groupName]: [] };
        }
        return { ...prev, [groupName]: [optionId] };
      } else {
        // Multiple selection - toggle
        if (currentSelections.includes(optionId)) {
          return { ...prev, [groupName]: currentSelections.filter(id => id !== optionId) };
        }
        return { ...prev, [groupName]: [...currentSelections, optionId] };
      }
    });
  };

  // Calculate total price
  const calculateTotal = () => {
    let total = item.price || 0;
    
    // Add variation prices
    for (const group of variationGroups) {
      const selections = selectedByGroup[group.group_name] || [];
      for (const optionId of selections) {
        const option = group.options.find(o => o.id === optionId);
        if (option && option.price) {
          total += option.price;
        }
      }
    }
    
    return total * quantity;
  };

  // Handle add to cart
  const handleAddToCart = () => {
    // Collect all selected variation names
    const variationNames = [];
    for (const group of variationGroups) {
      const selections = selectedByGroup[group.group_name] || [];
      for (const optionId of selections) {
        const option = group.options.find(o => o.id === optionId);
        if (option) {
          variationNames.push(option.name);
        }
      }
    }

    onAddToCart({
      ...item,
      variations: variationNames,
      selectedByGroup: selectedByGroup,
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
            {item.category_name || item.category}
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
          <div className="mb-6 pb-6 border-b border-border">
            <h3 className="text-2xl font-serif font-medium mb-2">{item.name}</h3>
            {item.description && (
              <p className="text-muted-foreground mb-3">{item.description}</p>
            )}
            
            {/* Nutritional Info */}
            <div className="grid grid-cols-3 gap-4 mb-3">
              {item.price > 0 && (
                <div className="bg-muted/50 p-3 rounded-sm">
                  <p className="text-xs text-muted-foreground uppercase">Base Price</p>
                  <p className="text-xl font-medium">₹{item.price.toFixed(2)}</p>
                </div>
              )}
              {item.calories > 0 && (
                <div className="bg-muted/50 p-3 rounded-sm">
                  <p className="text-xs text-muted-foreground uppercase">Calories</p>
                  <p className="text-xl font-medium">{item.calories} cal</p>
                </div>
              )}
              {item.portion_size && (
                <div className="bg-muted/50 p-3 rounded-sm">
                  <p className="text-xs text-muted-foreground uppercase">Portion</p>
                  <p className="text-lg font-medium">{item.portion_size}</p>
                </div>
              )}
            </div>

            {/* Allergen Warning */}
            {item.allergens && item.allergens.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">Allergen Information</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.allergens.map((allergen) => (
                        <span
                          key={allergen}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-200 text-red-800"
                        >
                          {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Variation Groups */}
          {variationGroups.length > 0 && variationGroups.map((group) => (
            <div key={group.group_name} className="mb-6">
              <h3 className="text-xl font-medium mb-4">
                {group.group_name}{' '}
                <span className={`text-sm ${group.required ? 'text-red-500' : 'text-muted-foreground'}`}>
                  ({group.required ? 'Required' : 'Optional'})
                  {group.type === 'single' ? ' - Select one' : ' - Select multiple'}
                </span>
              </h3>
              <div className="space-y-3">
                {group.options.map((option) => {
                  const isSelected = (selectedByGroup[group.group_name] || []).includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(group.group_name, option.id, group.type)}
                      data-testid={`variation-${option.id}`}
                      className={`w-full flex items-center space-x-4 p-4 border-2 rounded-sm transition-all touch-target ${
                        isSelected 
                          ? 'border-accent bg-accent/10' 
                          : 'border-border hover:border-accent'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 border-2 flex items-center justify-center transition-all ${
                          group.type === 'single' ? 'rounded-full' : 'rounded'
                        } ${
                          isSelected
                            ? 'bg-accent border-accent'
                            : 'bg-white border-foreground'
                        }`}
                      >
                        {isSelected && (
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
                        {option.name}
                      </span>
                      {option.price > 0 && (
                        <span className="text-lg font-medium text-accent">
                          +₹{option.price.toFixed(2)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legacy variations fallback */}
          {variationGroups.length === 0 && item.variations && item.variations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-medium mb-4">
                CHOICE <span className="text-muted-foreground text-sm">(Optional)</span>
              </h3>
              <div className="space-y-3">
                {item.variations.map((variation) => {
                  const isSelected = (selectedByGroup['default'] || []).includes(variation.id);
                  return (
                    <button
                      key={variation.id}
                      onClick={() => handleOptionSelect('default', variation.id, 'multiple')}
                      data-testid={`variation-${variation.id}`}
                      className={`w-full flex items-center space-x-4 p-4 border-2 rounded-sm transition-all touch-target ${
                        isSelected 
                          ? 'border-accent bg-accent/10' 
                          : 'border-border hover:border-accent'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 border-2 border-foreground rounded flex items-center justify-center transition-all ${
                          isSelected ? 'bg-accent border-accent' : 'bg-white'
                        }`}
                      >
                        {isSelected && (
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
                  );
                })}
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
            disabled={!allRequiredSelected()}
            data-testid="add-to-cart-final"
            className={`w-full py-6 rounded-sm text-xl font-medium transition-all active:scale-98 touch-target ${
              allRequiredSelected()
                ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {allRequiredSelected() ? 'Add to Cart' : 'Select Required Options'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CustomizationModal;
