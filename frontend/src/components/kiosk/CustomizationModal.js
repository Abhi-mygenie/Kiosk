import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Minus, MessageSquare } from 'lucide-react';
import { normalizePrice } from '@/utils/kioskHelpers';
import touchSound from '@/utils/touchSound';

const CustomizationModal = ({ item, onClose, onAddToCart, isPortrait }) => {
  const [groupSelections, setGroupSelections] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [visibleHeight, setVisibleHeight] = useState(null);

  // Detect keyboard open/close via visualViewport API
  useEffect(() => {
    if (!isPortrait || !window.visualViewport) return;
    const vv = window.visualViewport;
    const handleResize = () => {
      const isKb = vv.height < window.innerHeight * 0.75;
      setKeyboardVisible(isKb);
      if (isKb) setVisibleHeight(vv.height);
      else setVisibleHeight(null);
    };
    vv.addEventListener('resize', handleResize);
    return () => vv.removeEventListener('resize', handleResize);
  }, [isPortrait]);

  const handleVariationSelect = (group, option) => {
    touchSound.playTap();
    
    setGroupSelections(prev => {
      const currentGroupSelections = prev[group.group_name] || [];
      const isSelected = currentGroupSelections.find(v => v.id === option.id);
      
      if (group.type === 'single') {
        if (isSelected) {
          return group.required 
            ? prev 
            : { ...prev, [group.group_name]: [] };
        }
        return { ...prev, [group.group_name]: [option] };
      } else {
        if (isSelected) {
          return { ...prev, [group.group_name]: currentGroupSelections.filter(v => v.id !== option.id) };
        }
        return { ...prev, [group.group_name]: [...currentGroupSelections, option] };
      }
    });
  };

  const isOptionSelected = (groupName, optionId) => {
    const selections = groupSelections[groupName] || [];
    return selections.some(v => v.id === optionId);
  };

  const getAllSelectedVariations = () => {
    return Object.values(groupSelections).flat();
  };

  const calculateTotal = () => {
    const basePrice = normalizePrice(item.price);
    const variationTotal = getAllSelectedVariations().reduce((sum, v) => sum + normalizePrice(v.price), 0);
    return (basePrice + variationTotal) * quantity;
  };

  const hasRequiredSelections = () => {
    if (!item.variation_groups) return true;
    
    return item.variation_groups.every(group => {
      if (!group.required) return true;
      const selections = groupSelections[group.group_name] || [];
      return selections.length > 0;
    });
  };

  const getMissingRequiredGroups = () => {
    if (!item.variation_groups) return [];
    
    return item.variation_groups
      .filter(group => group.required && !(groupSelections[group.group_name]?.length > 0))
      .map(group => group.group_name);
  };

  const handleAddToCart = () => {
    const selectedVariations = getAllSelectedVariations();
    
    if (!hasRequiredSelections()) {
      const missing = getMissingRequiredGroups();
      alert(`Please select: ${missing.join(', ')}`);
      return;
    }
    
    const basePrice = normalizePrice(item.price);
    const variationPriceTotal = selectedVariations.reduce((sum, v) => sum + normalizePrice(v.price), 0);
    
    onAddToCart({
      ...item,
      price: basePrice,
      variations: selectedVariations.map(v => v.name),
      variationDetails: selectedVariations,
      quantity,
      specialInstructions,
      totalPrice: basePrice + variationPriceTotal
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 bg-black/50 flex ${keyboardVisible ? 'items-start pt-4' : 'items-center'} justify-center z-50`}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: isPortrait ? 1 : 0.9, y: isPortrait ? '-100%' : 0, opacity: isPortrait ? 1 : 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: isPortrait ? 1 : 0.9, y: isPortrait ? '-100%' : 0, opacity: isPortrait ? 1 : 0 }}
        className={`bg-white overflow-hidden flex flex-col ${
          isPortrait 
            ? 'w-full rounded-2xl mx-4' 
            : 'rounded-sm max-w-lg w-full max-h-[85vh] mx-4'
        }`}
        style={isPortrait ? { maxHeight: visibleHeight ? `${visibleHeight - 32}px` : '85vh' } : undefined}
        onClick={e => e.stopPropagation()}
      >
        
        <div className={`p-4 portrait:p-4 landscape:p-6 border-b border-border flex justify-between items-start`}>
          <div>
            <p className="text-sm text-blue-hero uppercase tracking-wide mb-1 font-medium">{item.category_name || item.category}</p>
            <h2 className="text-xl portrait:text-xl landscape:text-2xl font-heading font-semibold uppercase tracking-wide text-blue-dark">{item.name}</h2>
            {item.description && <p className="text-muted-foreground text-sm mt-1">{item.description}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-sm">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 portrait:p-4 landscape:p-6">
          {item.variation_groups?.length > 0 && item.variation_groups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6">
              <p className="text-sm font-semibold mb-3 uppercase">
                {group.group_name}{' '}
                <span className={`font-normal ${group.required ? 'text-red-500' : 'text-muted-foreground'}`}>
                  ({group.required ? 'Required' : 'Optional'})
                </span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {group.options.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleVariationSelect(group, option)}
                    className={`p-3 portrait:p-4 rounded-sm text-left text-sm transition-all ${
                      isOptionSelected(group.group_name, option.id)
                        ? 'bg-blue-hero text-white'
                        : 'bg-muted hover:bg-blue-light/20'
                    }`}
                  >
                    <span className="font-medium">{option.name}</span>
                    {option.price > 0 && <span className="text-xs ml-1">+₹{option.price}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {(!item.variation_groups || item.variation_groups.length === 0) && item.variations?.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold mb-3 uppercase">Choice <span className="text-muted-foreground font-normal">(Optional)</span></p>
              <div className="grid grid-cols-2 gap-2">
                {item.variations.map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleVariationSelect({ group_name: 'Choice', type: 'multiple', required: false }, v)}
                    className={`p-3 portrait:p-4 rounded-sm text-left text-sm transition-all ${
                      isOptionSelected('Choice', v.id)
                        ? 'bg-blue-hero text-white'
                        : 'bg-muted hover:bg-blue-light/20'
                    }`}
                  >
                    <span className="font-medium">{v.name}</span>
                    {v.price > 0 && <span className="text-xs ml-1">+₹{v.price}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm font-semibold mb-3 uppercase">Cooking Instructions <span className="text-muted-foreground font-normal">(Optional)</span></p>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
              placeholder="E.g., Less spicy, No onions, Extra crispy..."
              data-testid="special-instructions"
              className="w-full bg-muted border border-border p-3 rounded-sm text-sm focus:outline-none focus:border-blue-hero resize-none h-20"
              maxLength={200}
            />
          </div>

          <div className="flex items-center justify-between mb-6">
            <span className="font-semibold">Quantity</span>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => { touchSound.playClick(); setQuantity(Math.max(1, quantity - 1)); }}
                className="w-12 h-12 portrait:w-14 portrait:h-14 bg-muted rounded-sm flex items-center justify-center hover:bg-blue-light/20"
              >
                <Minus size={20} />
              </button>
              <span className="text-2xl font-semibold w-10 text-center text-blue-dark">{quantity}</span>
              <button
                onClick={() => { touchSound.playClick(); setQuantity(quantity + 1); }}
                className="w-12 h-12 portrait:w-14 portrait:h-14 bg-muted rounded-sm flex items-center justify-center hover:bg-blue-light/20"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 portrait:p-4 landscape:p-6 border-t border-border bg-white">
          {calculateTotal() > 0 && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium">Total</span>
              <span className="text-2xl font-heading font-semibold text-blue-dark">₹{calculateTotal().toFixed(2)}</span>
            </div>
          )}
          <button
            onClick={() => { touchSound.playAddToCart(); handleAddToCart(); }}
            disabled={!hasRequiredSelections()}
            className={`w-full py-4 portrait:py-5 rounded-sm text-lg font-semibold transition-all ${
              hasRequiredSelections()
                ? 'bg-blue-hero text-white hover:bg-blue-medium'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {hasRequiredSelections() ? 'Add to Cart' : `Select Required Options`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CustomizationModal;
