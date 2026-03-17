import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Search, X, CheckCircle, Tag, Volume2, VolumeX, LogOut, MessageSquare, ShoppingCart, Info, AlertTriangle, Flame, Scale, Settings, Clock } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMenuSettings } from '@/contexts/MenuSettingsContext';
import { useTimingSettings } from '@/contexts/TimingSettingsContext';
import { toast } from 'sonner';
import touchSound from '@/utils/touchSound';
import kioskLock from '@/utils/kioskLock';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Helper: Treat price of 1 as 0 (complimentary item indicator)
const normalizePrice = (price) => {
  return price === 1 ? 0 : price;
};

// Create axios instance with auth interceptor
const createAuthAxios = (token) => {
  const instance = axios.create();
  instance.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  return instance;
};

// Hook to detect orientation
const useOrientation = () => {
  const [isPortrait, setIsPortrait] = useState(
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return isPortrait;
};

// Customization Modal Component
const CustomizationModal = ({ item, onClose, onAddToCart, isPortrait }) => {
  const [groupSelections, setGroupSelections] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

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
      className="fixed inset-0 bg-black/50 flex items-end portrait:items-end landscape:items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: isPortrait ? 1 : 0.9, y: isPortrait ? '100%' : 0, opacity: isPortrait ? 1 : 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: isPortrait ? 1 : 0.9, y: isPortrait ? '100%' : 0, opacity: isPortrait ? 1 : 0 }}
        className={`bg-white overflow-hidden flex flex-col ${
          isPortrait 
            ? 'w-full max-h-[90vh] rounded-t-2xl' 
            : 'rounded-sm max-w-lg w-full max-h-[85vh] mx-4'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {isPortrait && (
          <div className="flex justify-center py-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>
        )}
        
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

// Success Overlay Component
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

// Category Pills Component (for Portrait mode) - with ALL option
const CategoryPills = ({ categories, activeCategory, setActiveCategory }) => {
  return (
    <div className="bg-white border-b border-border flex-shrink-0">
      <div className="flex overflow-x-auto scrollbar-hide px-4 py-3 gap-2">
        {/* ALL pill - first option */}
        <button
          onClick={() => { touchSound.playTap(); setActiveCategory('all'); }}
          data-testid="category-pill-all"
          className={`flex-shrink-0 px-5 py-3 rounded-full text-sm font-semibold uppercase tracking-wide transition-all whitespace-nowrap ${
            activeCategory === 'all'
              ? 'bg-blue-hero text-white'
              : 'bg-muted hover:bg-blue-light/20 text-muted-foreground'
          }`}
        >
          All
        </button>
        {/* Category pills */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => { touchSound.playTap(); setActiveCategory(category.id); }}
            data-testid={`category-pill-${category.id}`}
            className={`flex-shrink-0 px-5 py-3 rounded-full text-sm font-semibold uppercase tracking-wide transition-all whitespace-nowrap ${
              activeCategory === category.id
                ? 'bg-blue-hero text-white'
                : 'bg-muted hover:bg-blue-light/20 text-muted-foreground'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

// Inline Cart Item Component (for Portrait mode - Compact Design)
const InlineCartItem = ({ item, removeFromCart, updateQuantity, setEditingInstructions }) => {
  return (
    <div className="bg-white border border-border rounded-sm px-3 py-2.5 mb-1.5" data-testid={`cart-item-${item.cartId}`}>
      {/* Row 1: Name + Icon + Qty Controls (all in one row) */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: Name + Comment Icon */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <h4 className="font-heading font-bold text-sm uppercase text-blue-dark truncate">{item.name}</h4>
          <button
            onClick={() => { touchSound.playTap(); setEditingInstructions(item); }}
            data-testid={`edit-instructions-${item.cartId}`}
            className={`p-0.5 rounded transition-all flex-shrink-0 ${
              item.specialInstructions 
                ? 'text-blue-hero bg-blue-hero/10' 
                : 'text-muted-foreground hover:text-blue-hero'
            }`}
          >
            <MessageSquare size={14} />
          </button>
        </div>
        
        {/* Right: Qty Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => {
              touchSound.playClick();
              if (item.quantity <= 1) {
                removeFromCart(item.cartId);
              } else {
                updateQuantity(item.cartId, item.quantity - 1);
              }
            }}
            className="w-8 h-8 bg-muted rounded flex items-center justify-center hover:bg-red-50 transition-all"
          >
            <Minus size={16} />
          </button>
          <span className="text-base font-bold w-5 text-center">{item.quantity}</span>
          <button
            onClick={() => { touchSound.playClick(); updateQuantity(item.cartId, item.quantity + 1); }}
            className="w-8 h-8 bg-muted rounded flex items-center justify-center hover:bg-blue-light/30 transition-all"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      
      {/* Row 2: Variations (only if present) */}
      {item.variations?.length > 0 && (
        <p className="text-xs text-blue-hero mt-1 truncate">{item.variations.join(', ')}</p>
      )}
      
      {/* Row 3: Special Instructions (only if present) */}
      {item.specialInstructions && (
        <p className="text-[11px] text-muted-foreground mt-0.5 italic truncate">"{item.specialInstructions}"</p>
      )}
    </div>
  );
};

// Cart Section Component for Landscape
const CartSectionLandscape = ({ 
  cart, 
  removeFromCart, 
  updateQuantity, 
  calculateTotals, 
  tableNumber, 
  setShowTableSelector, 
  handlePlaceOrder, 
  isPlacingOrder,
  appliedCoupon,
  setEditingInstructions,
  hasTables
}) => {
  return (
    <div className="bg-white border-l border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-heading font-bold uppercase text-blue-dark">Your Order</h2>
        <p className="text-sm text-muted-foreground">{cart.length} items</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        {cart.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg mb-1 font-medium">Ready to order?</p>
            <p className="text-sm">Select items from the menu to begin</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.cartId} className="bg-blue-light/10 p-3 rounded-sm border border-blue-light/30">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-blue-dark truncate">{item.name}</h4>
                      <button
                        onClick={() => { touchSound.playTap(); setEditingInstructions(item); }}
                        className={`p-1 rounded transition-all flex-shrink-0 ${
                          item.specialInstructions 
                            ? 'text-blue-hero bg-blue-hero/10' 
                            : 'text-muted-foreground hover:text-blue-hero'
                        }`}
                      >
                        <MessageSquare size={14} />
                      </button>
                    </div>
                    {item.variations?.length > 0 && (
                      <p className="text-xs text-blue-medium truncate">{item.variations.join(', ')}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        touchSound.playClick();
                        if (item.quantity <= 1) removeFromCart(item.cartId);
                        else updateQuantity(item.cartId, item.quantity - 1);
                      }}
                      className="w-7 h-7 bg-white rounded flex items-center justify-center hover:bg-red-50"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => { touchSound.playClick(); updateQuantity(item.cartId, item.quantity + 1); }}
                      className="w-7 h-7 bg-white rounded flex items-center justify-center hover:bg-blue-light/30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {normalizePrice(item.totalPrice || item.price) > 0 && (
                    <span className="font-semibold text-sm text-blue-dark">
                      ₹{(normalizePrice(item.totalPrice || item.price) * item.quantity).toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-white">
        {hasTables && tableNumber && (
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Table:</span>
              <span className="text-lg font-heading font-bold text-blue-dark">{tableNumber}</span>
            </div>
            <button
              onClick={() => { touchSound.playClick(); setShowTableSelector(true); }}
              className="text-sm text-blue-hero hover:text-blue-medium underline"
            >
              Change
            </button>
          </div>
        )}

        {cart.length > 0 && calculateTotals.grandTotal > 0 && (
          <div className="border-t border-border pt-3 mb-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{calculateTotals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CGST (2.5%)</span>
              <span>₹{calculateTotals.cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">SGST (2.5%)</span>
              <span>₹{calculateTotals.sgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border text-base font-semibold">
              <span>Total</span>
              <span className="text-blue-dark">₹{calculateTotals.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            if (hasTables && !tableNumber && cart.length > 0) {
              touchSound.playClick();
              setShowTableSelector(true);
            } else {
              handlePlaceOrder();
            }
          }}
          disabled={cart.length === 0 || isPlacingOrder}
          data-testid="place-order-button"
          className={`w-full py-4 rounded-sm text-lg font-semibold transition-all ${
            cart.length > 0 && !isPlacingOrder
              ? 'bg-blue-hero text-white hover:bg-blue-medium'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {isPlacingOrder ? 'Placing...' : cart.length === 0 ? 'Add items' : hasTables && !tableNumber ? 'Select Table' : calculateTotals.grandTotal > 0 ? `Place Order • ₹${calculateTotals.grandTotal.toFixed(0)}` : 'Place Order'}
        </button>
      </div>
    </div>
  );
};

const KioskPage = ({ onNavigate }) => {
  const { cart, addToCart, removeFromCart, updateQuantity, updateInstructions, getTotal, clearCart } = useCart();
  const { logout, user, menuData } = useAuth();
  const { applySettings, resetComplete } = useMenuSettings();
  const { getCurrentPrepTime } = useTimingSettings();
  const isPortrait = useOrientation();
  
  // Apply admin menu settings (order + visibility) to categories and items
  const { categories, menuItems } = useMemo(
    () => applySettings(menuData.categories || [], menuData.menuItems || []),
    [applySettings, menuData.categories, menuData.menuItems]
  );
  
  const [tables, setTables] = useState(menuData.tables || []);
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editingInstructions, setEditingInstructions] = useState(null);

  const authAxios = useMemo(() => createAuthAxios(user?.token), [user?.token]);
  const [tablesLoading, setTablesLoading] = useState(false);

  // activeCategory defaults to 'all' - no need to set first category

  // Show table selector on mount if no table selected (table-first flow)
  // Skip entirely when restaurant has no tables configured
  useEffect(() => {
    if (!tableNumber && tables.length > 0 && !orderSuccess) {
      setShowTableSelector(true);
    }
  }, [tables, tableNumber, orderSuccess]);

  useEffect(() => {
    kioskLock.enable();
    kioskLock.setupAdminUnlock(() => {
      if (window.confirm('Exit kiosk mode?')) {
        kioskLock.disable();
        document.exitFullscreen?.();
      }
    });
    return () => { kioskLock.disable(); };
  }, []);

  const toggleSound = () => {
    const enabled = touchSound.toggle();
    setSoundEnabled(enabled);
    if (enabled) touchSound.playClick();
  };

  const CGST_RATE = 2.5;
  const SGST_RATE = 2.5;

  const calculateTotals = useMemo(() => {
    const subtotal = getTotal();
    let discount = 0;
    if (appliedCoupon) {
      discount = appliedCoupon.type === 'percent' 
        ? (subtotal * appliedCoupon.discount) / 100 
        : Math.min(appliedCoupon.discount, subtotal);
    }
    const afterDiscount = subtotal - discount;
    const cgst = (afterDiscount * CGST_RATE) / 100;
    const sgst = (afterDiscount * SGST_RATE) / 100;
    const grandTotal = afterDiscount + cgst + sgst;
    return { subtotal, discount, afterDiscount, cgst, sgst, grandTotal };
  }, [getTotal, appliedCoupon]);

  // Get items based on active category (all or filtered)
  const filteredItems = activeCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);
  
  // Group items by category for "ALL" view
  const itemsByCategory = useMemo(() => {
    const grouped = {};
    categories.forEach(cat => {
      grouped[cat.id] = menuItems.filter(item => item.category === cat.id);
    });
    return grouped;
  }, [categories, menuItems]);

  const handleAddToCart = (item) => {
    const itemWithGroupedVariations = {
      ...item,
      groupedVariations: item.variationDetails?.reduce((acc, v) => {
        const sourceItem = menuItems.find(mi => mi.id === item.id);
        const group = sourceItem?.variation_groups?.find(g => g.options.some(opt => opt.name === v.name));
        const groupName = group?.group_name || 'CHOICE';
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(v.name);
        return acc;
      }, {}) || {}
    };
    addToCart(itemWithGroupedVariations);
    toast.success(`${item.name} added to cart`);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    // If tables exist but none selected, prompt selection
    if (tables.length > 0 && !tableNumber) return;
    
    setIsPlacingOrder(true);
    try {
      const { subtotal, discount, cgst, sgst, grandTotal } = calculateTotals;
      const orderData = {
        table_number: tableNumber || '',
        table_id: selectedTableId || null,
        items: cart.map(item => ({
          item_id: item.id,
          name: item.name,
          price: item.originalTotalPrice || item.originalPrice || item.totalPrice || item.price,
          quantity: item.quantity,
          variations: item.variations || [],
          grouped_variations: item.groupedVariations || {},
          special_instructions: item.specialInstructions || null
        })),
        subtotal, discount, cgst, sgst, total: grandTotal
      };

      const response = await authAxios.post(`${API}/orders`, orderData);
      setOrderSuccess({ id: response.data.id || response.data.pos_order_id, tableNumber, grandTotal });
      clearCart();
      setTableNumber('');
      setSelectedTableId('');
      setAppliedCoupon(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleLogout = () => {
    touchSound.playClick();
    clearCart();
    resetComplete();
    logout();
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F9F8F6]">
        <div className="text-2xl font-serif">Loading menu...</div>
      </div>
    );
  }

  // Compact Menu Item Card for Portrait (4 per row) - 70:30 Image-Dominant Layout
  const PortraitMenuCard = ({ item }) => {
    const cartItem = cart.find(ci => ci.id === item.id);
    const inCart = !!cartItem;
    const cartQty = cartItem ? cart.filter(ci => ci.id === item.id).reduce((sum, ci) => sum + ci.quantity, 0) : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-sm overflow-hidden border-2 transition-all cursor-pointer relative ${
          inCart ? 'border-blue-hero bg-blue-light/10' : 'border-border bg-white hover:border-blue-light'
        }`}
        onClick={() => { touchSound.playTap(); setSelectedItem(item); }}
        data-testid={`menu-item-${item.id}`}
      >
        {/* Cart quantity badge */}
        {inCart && (
          <div className="absolute top-1 right-1 z-10 w-5 h-5 bg-blue-hero text-white rounded-full flex items-center justify-center text-[10px] font-bold">
            {cartQty}
          </div>
        )}
        
        {/* Image Section - 70% */}
        <div className={`aspect-square overflow-hidden ${inCart ? 'opacity-80' : ''}`}>
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        </div>
        
        {/* Content Section - 30% - Tight layout */}
        <div className="p-1.5">
          {/* Item Name */}
          <h3 className="font-heading font-bold text-[16px] truncate uppercase text-blue-dark leading-tight">{item.name}</h3>
          
          {/* Description - Full width */}
          {item.description && (
            <div className="flex items-center gap-1 mt-0.5">
              <Info size={14} className="text-blue-hero flex-shrink-0" />
              <span className="text-[13px] text-muted-foreground truncate">{item.description}</span>
            </div>
          )}
          
          {/* Allergen + Portion row with Add Button */}
          <div className="flex gap-1 mt-0.5">
            {/* Left Column: Allergen + Calories/Portion stacked */}
            <div className="flex-1 min-w-0">
              {/* Allergens */}
              {item.allergens && item.allergens.length > 0 && (
                <div className="flex items-center gap-1">
                  <AlertTriangle size={14} className="text-blue-hero flex-shrink-0" />
                  <span className="text-[13px] text-muted-foreground truncate">
                    {item.allergens.slice(0, 2).join(', ')}{item.allergens.length > 2 ? '...' : ''}
                  </span>
                </div>
              )}
              {/* Calories + Portion */}
              <div className="flex items-center gap-1.5 mt-0.5">
                {item.calories > 0 && (
                  <div className="flex items-center gap-0.5">
                    <Flame size={14} className="text-blue-hero" />
                    <span className="text-[13px] text-muted-foreground">{item.calories}</span>
                  </div>
                )}
                {item.portion_size && (
                  <div className="flex items-center gap-0.5">
                    <Scale size={14} className="text-blue-hero" />
                    <span className="text-[13px] text-muted-foreground">{item.portion_size}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Column: Add Button - perfect circle */}
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
              className="w-9 h-9 min-w-[36px] min-h-[36px] aspect-square rounded-full flex items-center justify-center flex-shrink-0 bg-blue-light text-white self-center"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Landscape Menu Item Card
  const LandscapeMenuCard = ({ item }) => {
    const cartItem = cart.find(ci => ci.id === item.id);
    const inCart = !!cartItem;
    const cartQty = cartItem ? cart.filter(ci => ci.id === item.id).reduce((sum, ci) => sum + ci.quantity, 0) : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-sm overflow-hidden border-2 transition-all cursor-pointer relative ${
          inCart ? 'border-blue-hero bg-blue-light/10 shadow-md' : 'border-border bg-white hover:shadow-lg hover:border-blue-light'
        }`}
        onClick={() => { touchSound.playTap(); setSelectedItem(item); }}
        data-testid={`menu-item-${item.id}`}
      >
        {inCart && (
          <div className="absolute top-2 right-2 z-10 w-7 h-7 bg-blue-hero text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
            {cartQty}
          </div>
        )}
        <div className={`h-28 overflow-hidden ${inCart ? 'opacity-80' : ''}`}>
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        </div>
        <div className="p-3">
          <h3 className="font-heading font-bold text-[16px] mb-1 truncate uppercase text-blue-dark">{item.name}</h3>
          {item.description && (
            <div className="flex items-center gap-1 mb-1">
              <Info size={14} className="text-blue-hero flex-shrink-0" />
              <span className="text-[13px] text-muted-foreground truncate">{item.description}</span>
            </div>
          )}
          
          {/* Allergen + Portion row with Add Button */}
          <div className="flex items-center gap-2">
            {/* Left Column: Allergen + Calories/Portion stacked */}
            <div className="flex-1 min-w-0">
              {/* Allergens */}
              {item.allergens && item.allergens.length > 0 && (
                <div className="flex items-center gap-1">
                  <AlertTriangle size={14} className="text-blue-hero flex-shrink-0" />
                  <span className="text-[13px] text-muted-foreground truncate">
                    {item.allergens.slice(0, 2).join(', ')}{item.allergens.length > 2 ? '...' : ''}
                  </span>
                </div>
              )}
              {/* Calories + Portion */}
              <div className="flex items-center gap-1.5 mt-0.5">
                {item.calories > 0 && (
                  <div className="flex items-center gap-0.5">
                    <Flame size={14} className="text-blue-hero" />
                    <span className="text-[13px] text-muted-foreground">{item.calories}</span>
                  </div>
                )}
                {item.portion_size && (
                  <div className="flex items-center gap-0.5">
                    <Scale size={14} className="text-blue-hero" />
                    <span className="text-[13px] text-muted-foreground">{item.portion_size}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Column: Add Button - spans allergen & portion rows */}
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-light text-white"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F9F8F6]">
      {/* ==================== PORTRAIT LAYOUT (Single Column) ==================== */}
      {isPortrait ? (
        <>
          {/* Fixed Header */}
          <div className="bg-white border-b border-border px-4 py-2 flex items-center justify-between flex-shrink-0">
            <img 
              src="https://customer-assets.emergentagent.com/job_aba4da0b-91ee-4a40-b348-36daa43480a8/artifacts/zyial4es_piyush_hyatt_logo_1.png" 
              alt="Hyatt Centric" 
              className="h-9 object-contain"
            />
            <div className="flex items-center gap-2">
              {/* Table indicator in header - only when restaurant has tables */}
              {tables.length > 0 && tableNumber && (
                <button
                  onClick={() => { touchSound.playClick(); setShowTableSelector(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-blue-hero/10 text-blue-hero border border-blue-hero/30"
                  data-testid="header-table-indicator"
                >
                  <span className="text-xs font-medium">Table</span>
                  <span className="text-sm font-bold">{tableNumber}</span>
                </button>
              )}
              <button
                onClick={() => { touchSound.playClick(); onNavigate?.('menuSettings'); }}
                data-testid="portrait-menu-settings"
                className="p-2 rounded-sm bg-muted hover:bg-muted/80"
              >
                <Settings size={18} />
              </button>
              <button
                onClick={() => { touchSound.playClick(); onNavigate?.('timingSettings'); }}
                data-testid="portrait-timing-settings"
                className="p-2 rounded-sm bg-muted hover:bg-muted/80"
              >
                <Clock size={18} />
              </button>
              <button onClick={toggleSound} className="p-2 rounded-sm bg-muted hover:bg-muted/80">
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button
                onClick={() => { touchSound.playClick(); setShowLogoutConfirm(true); }}
                className="p-2 rounded-sm bg-red-50 text-red-600 hover:bg-red-100"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Sticky Category Pills */}
          <CategoryPills categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

          {/* Scrollable Content: Food Grid + Inline Cart */}
          <div className="flex-1 overflow-y-auto scrollbar-hide pb-32">
            {/* Food Grid Section */}
            <div className="px-4 pt-3 pb-2">
              {activeCategory === 'all' ? (
                /* ALL view - show all categories with section headers */
                categories.map((category) => {
                  const categoryItems = itemsByCategory[category.id] || [];
                  if (categoryItems.length === 0) return null;
                  return (
                    <div key={category.id} className="mb-4">
                      <h2 className="text-base font-heading font-bold uppercase text-blue-dark mb-2 pb-1 border-b border-border">
                        {category.name}
                      </h2>
                      <div className="grid grid-cols-4 gap-2">
                        {categoryItems.map((item) => (
                          <PortraitMenuCard key={item.id} item={item} />
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Filtered view - show single category */
                <>
                  <h2 className="text-lg font-heading font-bold uppercase text-blue-dark mb-3">
                    {categories.find(c => c.id === activeCategory)?.name || 'MENU'}
                  </h2>
                  <div className="grid grid-cols-4 gap-2">
                    {filteredItems.map((item) => (
                      <PortraitMenuCard key={item.id} item={item} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Inline Cart Section */}
            <div className="px-4 py-3 mt-2 border-t border-border bg-[#F9F8F6]">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-heading font-bold uppercase text-blue-dark">Your Order</h2>
                <span className="text-sm text-muted-foreground">{cart.length} items</span>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground bg-white rounded-sm border border-border">
                  <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="font-medium text-sm">Ready to order?</p>
                  <p className="text-xs">Select items from the menu to begin</p>
                </div>
              ) : (
                <div>
                  {cart.map((item) => (
                    <InlineCartItem
                      key={item.cartId}
                      item={item}
                      removeFromCart={removeFromCart}
                      updateQuantity={updateQuantity}
                      setEditingInstructions={setEditingInstructions}
                    />
                  ))}
                </div>
              )}

            </div>
          </div>

          {/* Sticky Place Order Button */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 z-40">
            {/* Show table indicator above button if selected */}
            {tables.length > 0 && tableNumber && (
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground">Ordering for</span>
                <span className="text-sm font-bold text-blue-hero">Table {tableNumber}</span>
                <button
                  onClick={() => { touchSound.playClick(); setShowTableSelector(true); }}
                  className="text-xs text-blue-hero underline"
                >
                  Change
                </button>
              </div>
            )}
            <button
              onClick={() => {
                if (tables.length > 0 && !tableNumber) {
                  touchSound.playClick();
                  setShowTableSelector(true);
                } else if (cart.length > 0) {
                  handlePlaceOrder();
                }
              }}
              disabled={cart.length === 0 || isPlacingOrder}
              data-testid="place-order-button"
              className={`w-full py-4 rounded-sm text-lg font-semibold transition-all ${
                cart.length > 0 && !isPlacingOrder
                  ? 'bg-blue-hero text-white hover:bg-blue-medium'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {isPlacingOrder ? 'Placing Order...' : cart.length === 0 ? 'Add items to order' : (tables.length > 0 && !tableNumber) ? 'Select Table to Order' : calculateTotals.grandTotal > 0 ? `Place Order • ₹${calculateTotals.grandTotal.toFixed(0)}` : 'Place Order'}
            </button>
          </div>
        </>
      ) : (
        /* ==================== LANDSCAPE LAYOUT (3-Column) ==================== */
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Categories */}
          <div className="w-64 bg-white border-r border-border flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-border">
              <img 
                src="https://customer-assets.emergentagent.com/job_aba4da0b-91ee-4a40-b348-36daa43480a8/artifacts/zyial4es_piyush_hyatt_logo_1.png" 
                alt="Hyatt Centric" 
                className="w-full h-auto max-h-20 object-contain"
              />
              <p className="text-xs text-muted-foreground mt-2 uppercase tracking-widest text-center">Breakfast Buffet</p>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => { touchSound.playTap(); setActiveCategory(category.id); }}
                  data-testid={`category-${category.id}`}
                  className={`w-full p-4 rounded-sm text-left transition-all ${
                    activeCategory === category.id
                      ? 'bg-blue-hero text-white'
                      : 'hover:bg-blue-light/20 text-muted-foreground'
                  }`}
                >
                  <span className="text-sm font-semibold uppercase tracking-wide">{category.name}</span>
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-border space-y-2">
              <button
                onClick={() => { touchSound.playClick(); onNavigate?.('menuSettings'); }}
                data-testid="sidebar-menu-settings"
                className="w-full flex items-center justify-center space-x-2 p-3 rounded-sm bg-muted hover:bg-muted/80"
              >
                <Settings size={20} />
                <span className="text-sm">Menu Settings</span>
              </button>
              <button
                onClick={() => { touchSound.playClick(); onNavigate?.('timingSettings'); }}
                data-testid="sidebar-timing-settings"
                className="w-full flex items-center justify-center space-x-2 p-3 rounded-sm bg-muted hover:bg-muted/80"
              >
                <Clock size={20} />
                <span className="text-sm">Timing</span>
              </button>
              <button onClick={toggleSound} className="w-full flex items-center justify-center space-x-2 p-3 rounded-sm bg-muted hover:bg-muted/80">
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                <span className="text-sm">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
              </button>
              <button
                onClick={() => { touchSound.playClick(); setShowLogoutConfirm(true); }}
                className="w-full flex items-center justify-center space-x-2 p-3 rounded-sm bg-red-50 text-red-600 hover:bg-red-100"
              >
                <LogOut size={20} />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>

          {/* MIDDLE: Menu Items */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 bg-white border-b border-border">
              <h1 className="text-3xl font-heading font-bold uppercase tracking-wide text-blue-dark">
                {categories.find(c => c.id === activeCategory)?.name || 'MENU'}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Select items to add to your order</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                  <LandscapeMenuCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Cart */}
          <div className="w-80 xl:w-96 flex flex-col flex-shrink-0">
            <CartSectionLandscape
              cart={cart}
              removeFromCart={removeFromCart}
              updateQuantity={updateQuantity}
              calculateTotals={calculateTotals}
              tableNumber={tableNumber}
              setShowTableSelector={setShowTableSelector}
              handlePlaceOrder={handlePlaceOrder}
              isPlacingOrder={isPlacingOrder}
              appliedCoupon={appliedCoupon}
              setEditingInstructions={setEditingInstructions}
              hasTables={tables.length > 0}
            />
          </div>
        </div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* Customization Modal */}
      <AnimatePresence>
        {selectedItem && (
          <CustomizationModal
            item={selectedItem}
            onClose={() => { touchSound.playClick(); setSelectedItem(null); }}
            onAddToCart={handleAddToCart}
            isPortrait={isPortrait}
          />
        )}
      </AnimatePresence>

      {/* Table Selector - Transparent Overlay */}
      <AnimatePresence>
        {showTableSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/70 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          >
            {/* Centered content block */}
            <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white/50 rounded-xl border border-white/30 shadow-lg overflow-hidden">
              {/* Header - Centered */}
              <div className="p-4 border-b border-white/30 flex items-center justify-center bg-white/30 flex-shrink-0 relative">
                <div className="text-center">
                  <h2 className="text-xl font-heading font-bold uppercase text-blue-dark">Select Your Table</h2>
                  <p className="text-muted-foreground mt-0.5 text-sm">Tap on your table number to continue</p>
                </div>
                {tableNumber && (
                  <button onClick={() => { touchSound.playClick(); setShowTableSelector(false); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/50 rounded-sm">
                    <X size={24} />
                  </button>
                )}
              </div>
              
              {/* Table Grid - Scrollable - 10 columns */}
              <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                {(() => {
                  const sections = {};
                  tables.forEach(table => {
                    const section = table.title || '';
                    if (!sections[section]) sections[section] = [];
                    sections[section].push(table);
                  });
                  return Object.keys(sections).sort((a, b) => a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)).map(section => (
                    <div key={section || 'no-section'} className="mb-4">
                      {section && <h3 className="text-sm font-semibold mb-2 text-blue-dark uppercase text-center">{section}</h3>}
                      <div className="grid grid-cols-10 gap-2">
                        {sections[section].map((table) => (
                          <motion.button
                            key={table.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { touchSound.playSelect(); setTableNumber(table.table_no); setSelectedTableId(table.id); }}
                            data-testid={`table-${table.table_no}`}
                            className={`aspect-square rounded-lg text-sm font-bold transition-all shadow-sm flex items-center justify-center ${
                              tableNumber === table.table_no
                                ? 'bg-blue-hero text-white shadow-lg ring-4 ring-blue-hero/30'
                                : 'bg-white/80 hover:bg-white border border-white/50 text-blue-dark'
                            }`}
                          >
                            {table.table_no}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
              
              {/* Footer with Continue Button - Centered */}
              <div className="p-4 border-t border-white/30 bg-white/30 flex-shrink-0 flex justify-center">
                <button
                  onClick={() => { 
                    if (tableNumber) {
                      touchSound.playClick(); 
                      setShowTableSelector(false); 
                    }
                  }}
                  disabled={!tableNumber}
                  className={`w-full max-w-md py-4 rounded-sm font-semibold text-lg transition-all ${
                    tableNumber 
                      ? 'bg-blue-hero text-white hover:bg-blue-medium' 
                      : 'bg-white/50 text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  {tableNumber ? `Continue with Table ${tableNumber}` : 'Select a Table'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Overlay */}
      <AnimatePresence>
        {orderSuccess && <SuccessOverlay orderId={orderSuccess.id} tableNumber={orderSuccess.tableNumber} onNewOrder={() => setOrderSuccess(null)} prepTime={getCurrentPrepTime()} />}
      </AnimatePresence>

      {/* Logout Confirmation */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLogoutConfirm(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-sm p-6 max-w-md w-full mx-4 text-center" onClick={e => e.stopPropagation()}>
              <LogOut size={40} className="mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-heading font-bold mb-2 uppercase text-blue-dark">Logout</h2>
              <p className="text-muted-foreground mb-6">Are you sure you want to logout?</p>
              <div className="flex gap-4">
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 rounded-sm border border-border hover:bg-muted font-semibold">Cancel</button>
                <button onClick={handleLogout} className="flex-1 py-3 rounded-sm bg-red-500 text-white hover:bg-red-600 font-semibold">Yes, Logout</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Instructions Modal */}
      <AnimatePresence>
        {editingInstructions && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-end portrait:items-end landscape:items-center justify-center z-50" onClick={() => setEditingInstructions(null)}>
            <motion.div
              initial={{ y: isPortrait ? '100%' : 0, scale: isPortrait ? 1 : 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: isPortrait ? '100%' : 0, scale: isPortrait ? 1 : 0.9 }}
              className={`bg-white p-6 ${isPortrait ? 'w-full rounded-t-2xl' : 'rounded-sm max-w-md w-full mx-4'}`}
              onClick={e => e.stopPropagation()}
            >
              {isPortrait && <div className="flex justify-center mb-2"><div className="w-12 h-1.5 bg-gray-300 rounded-full" /></div>}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-heading font-bold uppercase text-blue-dark">Cooking Instructions</h2>
                  <p className="text-sm text-muted-foreground">{editingInstructions.name}</p>
                </div>
                <button onClick={() => setEditingInstructions(null)} className="p-2 hover:bg-muted rounded-sm"><X size={20} /></button>
              </div>
              <textarea
                value={editingInstructions.specialInstructions || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  updateInstructions(editingInstructions.cartId, val);
                  setEditingInstructions({ ...editingInstructions, specialInstructions: val });
                }}
                placeholder="E.g., Less spicy, No onions..."
                className="w-full bg-muted border border-border p-3 rounded-sm text-sm focus:outline-none focus:border-blue-hero resize-none h-24 mb-2"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right mb-4">{(editingInstructions.specialInstructions || '').length}/200</p>
              <button onClick={() => setEditingInstructions(null)} className="w-full bg-blue-hero text-white py-4 rounded-sm font-semibold hover:bg-blue-medium">Done</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KioskPage;
