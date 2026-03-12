import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Search, X, CheckCircle, Tag, Volume2, VolumeX, LogOut, MessageSquare, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
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
        {/* Drag handle for portrait */}
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
          {/* Variation Groups */}
          {item.variation_groups?.length > 0 && item.variation_groups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6">
              <p className="text-sm font-semibold mb-3 uppercase">
                {group.group_name}{' '}
                <span className={`font-normal ${group.required ? 'text-red-500' : 'text-muted-foreground'}`}>
                  ({group.required ? 'Required' : 'Optional'})
                </span>
                {group.type === 'single' && <span className="text-xs text-muted-foreground ml-2">Select one</span>}
                {group.type === 'multiple' && <span className="text-xs text-muted-foreground ml-2">Select multiple</span>}
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

          {/* Fallback to old variations array */}
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

          {/* Special Instructions */}
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
            <p className="text-xs text-muted-foreground mt-1 text-right">{specialInstructions.length}/200</p>
          </div>

          {/* Quantity */}
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

        {/* Footer */}
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
const SuccessOverlay = ({ orderId, tableNumber, onNewOrder }) => {
  const [countdown, setCountdown] = useState(15);

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
        
        <h1 className="text-3xl portrait:text-3xl landscape:text-5xl font-heading font-bold mb-4 text-blue-dark uppercase tracking-wide">Order Confirmed!</h1>
        <p className="text-lg portrait:text-lg landscape:text-xl text-muted-foreground mb-2">Table Number: {tableNumber}</p>
        <p className="text-base portrait:text-base landscape:text-lg text-muted-foreground mb-8">Order ID: {orderId?.slice(0, 8).toUpperCase()}</p>
        
        <div className="bg-blue-light/20 p-4 portrait:p-4 landscape:p-6 rounded-sm mb-8 max-w-md mx-auto border border-blue-hero/30">
          <p className="text-base portrait:text-base landscape:text-lg font-medium">Your order has been sent to the kitchen</p>
          <p className="text-muted-foreground mt-2">Please proceed to Table {tableNumber}</p>
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

// Category Pills Component (for Portrait mode)
const CategoryPills = ({ categories, activeCategory, setActiveCategory }) => {
  const scrollRef = useRef(null);

  return (
    <div className="bg-white border-b border-border">
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide px-4 py-3 gap-2"
      >
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

// Cart Section Component (shared between layouts)
const CartSection = ({ 
  cart, 
  removeFromCart, 
  updateQuantity, 
  updateInstructions,
  calculateTotals, 
  tableNumber, 
  setShowTableSelector, 
  handlePlaceOrder, 
  isPlacingOrder,
  appliedCoupon,
  setEditingInstructions,
  isPortrait,
  isCompact = false
}) => {
  return (
    <div className={`bg-white flex flex-col h-full ${isPortrait ? 'border-l border-border' : 'border-l border-border'}`}>
      <div className={`p-3 portrait:p-3 landscape:p-4 border-b border-border`}>
        <h2 className={`font-heading font-bold uppercase text-blue-dark ${isCompact ? 'text-base' : 'text-lg portrait:text-lg landscape:text-xl'}`}>Your Order</h2>
        <p className="text-xs portrait:text-xs landscape:text-sm text-muted-foreground">{cart.length} items</p>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-3 portrait:p-3 landscape:p-4 scrollbar-hide">
        {cart.length === 0 ? (
          <div className="text-center py-8 portrait:py-6 landscape:py-12 text-muted-foreground">
            <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
            <p className={`mb-1 font-medium ${isCompact ? 'text-sm' : 'text-base portrait:text-base landscape:text-lg'}`}>Your breakfast awaits</p>
            <p className="text-xs portrait:text-xs landscape:text-sm">Select from the menu</p>
          </div>
        ) : (
          <div className="space-y-2 portrait:space-y-2 landscape:space-y-3">
            {cart.map((item) => (
              <div key={item.cartId} className={`bg-blue-light/10 p-2 portrait:p-2 landscape:p-3 rounded-sm border border-blue-light/30`} data-testid={`cart-item-${item.cartId}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h4 className={`font-semibold text-blue-dark truncate ${isCompact ? 'text-xs' : 'text-sm'}`}>{item.name}</h4>
                      <button
                        onClick={() => { touchSound.playTap(); setEditingInstructions(item); }}
                        data-testid={`edit-instructions-${item.cartId}`}
                        className={`p-1 rounded transition-all flex-shrink-0 ${
                          item.specialInstructions 
                            ? 'text-blue-hero bg-blue-hero/10' 
                            : 'text-muted-foreground hover:text-blue-hero hover:bg-blue-hero/10'
                        }`}
                      >
                        <MessageSquare size={isCompact ? 12 : 14} />
                      </button>
                    </div>
                    {item.variations?.length > 0 && (
                      <p className="text-[10px] portrait:text-[10px] landscape:text-xs text-blue-medium truncate">{item.variations.join(', ')}</p>
                    )}
                    {item.specialInstructions && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 italic truncate">"{item.specialInstructions}"</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 portrait:space-x-1 landscape:space-x-2">
                    <button
                      onClick={() => {
                        touchSound.playClick();
                        if (item.quantity <= 1) {
                          removeFromCart(item.cartId);
                        } else {
                          updateQuantity(item.cartId, item.quantity - 1);
                        }
                      }}
                      className={`bg-white rounded flex items-center justify-center hover:bg-red-50 ${isCompact ? 'w-6 h-6' : 'w-7 h-7 portrait:w-8 portrait:h-8'}`}
                    >
                      <Minus size={isCompact ? 12 : 14} />
                    </button>
                    <span className={`text-center font-semibold ${isCompact ? 'w-5 text-sm' : 'w-6'}`}>{item.quantity}</span>
                    <button
                      onClick={() => { touchSound.playClick(); updateQuantity(item.cartId, item.quantity + 1); }}
                      className={`bg-white rounded flex items-center justify-center hover:bg-blue-light/30 ${isCompact ? 'w-6 h-6' : 'w-7 h-7 portrait:w-8 portrait:h-8'}`}
                    >
                      <Plus size={isCompact ? 12 : 14} />
                    </button>
                  </div>
                  {!item.is_complementary && normalizePrice(item.totalPrice || item.price) > 0 && (
                    <span className={`font-semibold text-blue-dark ${isCompact ? 'text-xs' : 'text-sm'}`}>₹{(normalizePrice(item.totalPrice || item.price) * item.quantity).toFixed(0)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Footer */}
      <div className={`p-3 portrait:p-3 landscape:p-4 border-t border-border bg-white`}>
        {tableNumber && (
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Table:</span>
              <span className={`font-heading font-bold text-blue-dark ${isCompact ? 'text-base' : 'text-lg'}`}>{tableNumber}</span>
            </div>
            <button
              onClick={() => { touchSound.playClick(); setShowTableSelector(true); }}
              data-testid="change-table-button"
              className="text-xs text-blue-hero hover:text-blue-medium underline"
            >
              Change
            </button>
          </div>
        )}

        {/* Bill Summary */}
        {cart.length > 0 && calculateTotals.grandTotal > 0 && (
          <div className={`border-t border-border pt-2 mb-3 space-y-1 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{calculateTotals.subtotal.toFixed(2)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-₹{calculateTotals.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">CGST (2.5%)</span>
              <span>₹{calculateTotals.cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">SGST (2.5%)</span>
              <span>₹{calculateTotals.sgst.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between pt-2 border-t border-border font-semibold ${isCompact ? 'text-sm' : 'text-base'}`}>
              <span>Total</span>
              <span data-testid="cart-total" className="text-blue-dark">₹{calculateTotals.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Place Order Button */}
        <button
          onClick={() => {
            if (!tableNumber && cart.length > 0) {
              touchSound.playClick();
              setShowTableSelector(true);
            } else {
              handlePlaceOrder();
            }
          }}
          disabled={cart.length === 0 || isPlacingOrder}
          data-testid="place-order-button"
          className={`w-full rounded-sm font-semibold transition-all ${
            cart.length > 0 && !isPlacingOrder
              ? 'bg-blue-hero text-white hover:bg-blue-medium'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          } ${isCompact ? 'py-3 text-sm' : 'py-4 text-base portrait:py-4 landscape:text-lg'}`}
        >
          {isPlacingOrder ? 'Placing...' : cart.length === 0 ? 'Add items' : calculateTotals.grandTotal > 0 ? `Order • ₹${calculateTotals.grandTotal.toFixed(0)}` : 'Place Order'}
        </button>
      </div>
    </div>
  );
};

const KioskPage = () => {
  const { cart, addToCart, removeFromCart, updateQuantity, updateInstructions, getTotal, clearCart } = useCart();
  const { logout, user, menuData } = useAuth();
  const isPortrait = useOrientation();
  
  const [categories, setCategories] = useState(menuData.categories || []);
  const [menuItems, setMenuItems] = useState(menuData.menuItems || []);
  const [tables, setTables] = useState(menuData.tables || []);
  
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editingInstructions, setEditingInstructions] = useState(null);

  const authAxios = useMemo(() => createAuthAxios(user?.token), [user?.token]);
  const [tablesLoading, setTablesLoading] = useState(false);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    kioskLock.enable();
    kioskLock.setupAdminUnlock(() => {
      if (window.confirm('Exit kiosk mode?')) {
        kioskLock.disable();
        document.exitFullscreen?.();
      }
    });

    return () => {
      kioskLock.disable();
    };
  }, []);

  const toggleSound = () => {
    const enabled = touchSound.toggle();
    setSoundEnabled(enabled);
    if (enabled) {
      touchSound.playClick();
    }
  };

  const VALID_COUPONS = {
    'WELCOME10': { discount: 10, type: 'percent', description: '10% off' },
    'FLAT50': { discount: 50, type: 'flat', description: '₹50 off' },
    'HYATT20': { discount: 20, type: 'percent', description: '20% off' },
  };

  const CGST_RATE = 2.5;
  const SGST_RATE = 2.5;

  const calculateTotals = useMemo(() => {
    const subtotal = getTotal();
    
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percent') {
        discount = (subtotal * appliedCoupon.discount) / 100;
      } else {
        discount = Math.min(appliedCoupon.discount, subtotal);
      }
    }
    
    const afterDiscount = subtotal - discount;
    const cgst = (afterDiscount * CGST_RATE) / 100;
    const sgst = (afterDiscount * SGST_RATE) / 100;
    const grandTotal = afterDiscount + cgst + sgst;
    
    return { subtotal, discount, afterDiscount, cgst, sgst, grandTotal };
  }, [getTotal, appliedCoupon]);

  const handleSelectTable = (table, tableId) => {
    setTableNumber(table);
    setSelectedTableId(tableId || '');
  };

  const handleApplyCoupon = () => {
    const code = couponCode.toUpperCase().trim();
    if (VALID_COUPONS[code]) {
      setAppliedCoupon({ ...VALID_COUPONS[code], code });
      setCouponError('');
      toast.success(`Coupon applied: ${VALID_COUPONS[code].description}`);
    } else {
      setCouponError('Invalid coupon code');
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const filteredItems = menuItems.filter(item => item.category === activeCategory);

  const handleAddToCart = (item) => {
    const itemWithGroupedVariations = {
      ...item,
      groupedVariations: item.variationDetails?.reduce((acc, v) => {
        const sourceItem = menuItems.find(mi => mi.id === item.id);
        const group = sourceItem?.variation_groups?.find(g => 
          g.options.some(opt => opt.name === v.name)
        );
        const groupName = group?.group_name || 'CHOICE';
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(v.name);
        return acc;
      }, {}) || {}
    };
    addToCart(itemWithGroupedVariations);
    toast.success(`${item.name} added to cart`);
  };

  const handleMobileChange = (value) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 10);
    setCustomerMobile(numericValue);
  };

  const handlePlaceOrder = async () => {
    if (!tableNumber || cart.length === 0) return;
    
    setIsPlacingOrder(true);
    try {
      const { subtotal, discount, cgst, sgst, grandTotal } = calculateTotals;
      
      const orderData = {
        table_number: tableNumber,
        table_id: selectedTableId || null,
        customer_name: customerName || null,
        customer_mobile: customerMobile || null,
        items: cart.map(item => ({
          item_id: item.id,
          name: item.name,
          price: item.originalTotalPrice || item.originalPrice || item.totalPrice || item.price,
          quantity: item.quantity,
          variations: item.variations || [],
          grouped_variations: item.groupedVariations || {},
          special_instructions: item.specialInstructions || null
        })),
        subtotal: subtotal,
        discount: discount,
        coupon_code: appliedCoupon?.code || null,
        cgst: cgst,
        sgst: sgst,
        total: grandTotal
      };

      const response = await authAxios.post(`${API}/orders`, orderData);
      setOrderSuccess({ id: response.data.id || response.data.pos_order_id, tableNumber, grandTotal, customerName });
      clearCart();
      setTableNumber('');
      setSelectedTableId('');
      setAppliedCoupon(null);
      setCouponCode('');
      setCustomerName('');
      setCustomerMobile('');
    } catch (error) {
      console.error('Failed to place order:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to place order. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleNewOrder = () => {
    setOrderSuccess(null);
  };

  const handleLogout = () => {
    touchSound.playClick();
    clearCart();
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

  // Menu Item Card Component
  const MenuItemCard = ({ item }) => {
    const cartItem = cart.find(ci => ci.id === item.id);
    const inCart = !!cartItem;
    const cartQty = cartItem ? cart.filter(ci => ci.id === item.id).reduce((sum, ci) => sum + ci.quantity, 0) : 0;

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-sm overflow-hidden border-2 transition-all cursor-pointer relative ${
          inCart 
            ? 'border-blue-hero bg-blue-light/10 shadow-md' 
            : 'border-border bg-white hover:shadow-lg hover:border-blue-light'
        }`}
        onClick={() => { touchSound.playTap(); setSelectedItem(item); }}
        data-testid={`menu-item-${item.id}`}
      >
        {inCart && (
          <div className="absolute top-2 right-2 z-10 w-7 h-7 portrait:w-6 portrait:h-6 bg-blue-hero text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
            {cartQty}
          </div>
        )}
        <div className={`overflow-hidden ${inCart ? 'opacity-80' : ''} h-24 portrait:h-20 landscape:h-28`}>
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        </div>
        <div className="p-2 portrait:p-2 landscape:p-3">
          <h3 className="font-heading font-semibold text-xs portrait:text-xs landscape:text-sm mb-1 truncate uppercase text-blue-dark">{item.name}</h3>
          {item.description && (
            <p className="text-[10px] portrait:text-[10px] landscape:text-xs text-muted-foreground mb-1 line-clamp-1">{item.description}</p>
          )}
          <div className="flex items-center justify-between">
            {!item.is_complementary && normalizePrice(item.price) > 0 && (
              <span className="text-sm portrait:text-sm landscape:text-lg font-semibold text-blue-dark">₹{normalizePrice(item.price).toFixed(0)}</span>
            )}
            {(item.is_complementary || normalizePrice(item.price) === 0) && <span></span>}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedItem(item);
              }}
              className={`w-8 h-8 portrait:w-8 portrait:h-8 landscape:w-9 landscape:h-9 rounded-full flex items-center justify-center transition-all ${
                inCart 
                  ? 'bg-blue-light/30 text-blue-medium hover:bg-blue-hero hover:text-white' 
                  : 'bg-blue-hero text-white hover:bg-blue-medium'
              }`}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F9F8F6]">
      {/* ==================== PORTRAIT LAYOUT ==================== */}
      {isPortrait ? (
        <>
          {/* Portrait Header */}
          <div className="bg-white border-b border-border px-4 py-3 flex items-center justify-between flex-shrink-0">
            <img 
              src="https://customer-assets.emergentagent.com/job_660831f3-d103-4fb3-ae20-d0fe3dd0af53/artifacts/4li3nr0o_hya.png" 
              alt="Hyatt Centric Candolim Goa" 
              className="h-10 object-contain"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSound}
                className="p-2 rounded-sm bg-muted hover:bg-muted/80 transition-all"
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button
                onClick={() => { touchSound.playClick(); setShowLogoutConfirm(true); }}
                data-testid="logout-button"
                className="p-2 rounded-sm bg-red-50 text-red-600 hover:bg-red-100 transition-all"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Portrait Category Pills */}
          <CategoryPills 
            categories={categories} 
            activeCategory={activeCategory} 
            setActiveCategory={setActiveCategory} 
          />

          {/* Portrait Main Content - 2 Column */}
          <div className="flex-1 flex overflow-hidden">
            {/* Menu Items Column (60%) */}
            <div className="w-[58%] flex flex-col overflow-hidden border-r border-border">
              <div className="p-3 bg-white border-b border-border">
                <h1 className="text-lg font-heading font-bold uppercase tracking-wide text-blue-dark">
                  {categories.find(c => c.id === activeCategory)?.name || 'MENU'}
                </h1>
              </div>
              <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
                <div className="grid grid-cols-2 gap-2">
                  {filteredItems.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </div>

            {/* Cart Column (40%) */}
            <div className="w-[42%] flex flex-col overflow-hidden">
              <CartSection
                cart={cart}
                removeFromCart={removeFromCart}
                updateQuantity={updateQuantity}
                updateInstructions={updateInstructions}
                calculateTotals={calculateTotals}
                tableNumber={tableNumber}
                setShowTableSelector={setShowTableSelector}
                handlePlaceOrder={handlePlaceOrder}
                isPlacingOrder={isPlacingOrder}
                appliedCoupon={appliedCoupon}
                setEditingInstructions={setEditingInstructions}
                isPortrait={isPortrait}
                isCompact={true}
              />
            </div>
          </div>
        </>
      ) : (
        /* ==================== LANDSCAPE LAYOUT (Current 3-Column) ==================== */
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT COLUMN - Categories */}
          <div className="w-64 bg-white border-r border-border flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-border">
              <img 
                src="https://customer-assets.emergentagent.com/job_660831f3-d103-4fb3-ae20-d0fe3dd0af53/artifacts/4li3nr0o_hya.png" 
                alt="Hyatt Centric Candolim Goa" 
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

            {/* Sound Toggle & Logout */}
            <div className="p-4 border-t border-border space-y-2">
              <button
                onClick={toggleSound}
                className="w-full flex items-center justify-center space-x-2 p-3 rounded-sm bg-muted hover:bg-muted/80 transition-all"
              >
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                <span className="text-sm">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
              </button>
              <button
                onClick={() => { touchSound.playClick(); setShowLogoutConfirm(true); }}
                data-testid="logout-button"
                className="w-full flex items-center justify-center space-x-2 p-3 rounded-sm bg-red-50 text-red-600 hover:bg-red-100 transition-all"
              >
                <LogOut size={20} />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>

          {/* MIDDLE COLUMN - Menu Items */}
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
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Cart/Order */}
          <div className="w-80 xl:w-96 flex flex-col flex-shrink-0">
            <CartSection
              cart={cart}
              removeFromCart={removeFromCart}
              updateQuantity={updateQuantity}
              updateInstructions={updateInstructions}
              calculateTotals={calculateTotals}
              tableNumber={tableNumber}
              setShowTableSelector={setShowTableSelector}
              handlePlaceOrder={handlePlaceOrder}
              isPlacingOrder={isPlacingOrder}
              appliedCoupon={appliedCoupon}
              setEditingInstructions={setEditingInstructions}
              isPortrait={isPortrait}
              isCompact={false}
            />
          </div>
        </div>
      )}

      {/* ==================== MODALS (Shared) ==================== */}
      
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

      {/* Full-Screen Table Selector */}
      <AnimatePresence>
        {showTableSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 portrait:p-4 landscape:p-6 border-b border-border flex items-center justify-between bg-white">
              <div>
                <h2 className="text-xl portrait:text-xl landscape:text-3xl font-heading font-bold uppercase text-blue-dark">Select Your Table</h2>
                <p className="text-muted-foreground mt-1 text-sm portrait:text-sm landscape:text-base">Tap on your table number</p>
              </div>
              <button
                onClick={() => { touchSound.playClick(); setShowTableSelector(false); }}
                className="p-3 hover:bg-muted rounded-sm transition-colors"
              >
                <X size={isPortrait ? 24 : 32} />
              </button>
            </div>

            {/* Table Grid */}
            <div className="flex-1 overflow-y-auto p-4 portrait:p-4 landscape:p-6 bg-[#F9F8F6] scrollbar-hide">
              {tablesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading tables...</p>
                </div>
              ) : (
                <div className="max-w-6xl mx-auto">
                  {(() => {
                    const sections = {};
                    tables.forEach(table => {
                      const section = table.title || '';
                      if (!sections[section]) {
                        sections[section] = [];
                      }
                      sections[section].push(table);
                    });
                    
                    const sectionNames = Object.keys(sections).sort((a, b) => {
                      if (a === '') return 1;
                      if (b === '') return -1;
                      return a.localeCompare(b);
                    });
                    
                    return sectionNames.map(section => (
                      <div key={section || 'no-section'} className="mb-6">
                        {section && (
                          <h3 className="text-base portrait:text-base landscape:text-lg font-semibold mb-3 text-blue-dark uppercase">
                            {section}
                          </h3>
                        )}
                        <div className={`grid gap-2 portrait:gap-2 landscape:gap-3 ${isPortrait ? 'grid-cols-5' : 'grid-cols-6 sm:grid-cols-8 md:grid-cols-10'}`}>
                          {sections[section].map((table) => (
                            <motion.button
                              key={table.id}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => { 
                                touchSound.playSelect(); 
                                setTableNumber(table.table_no);
                                setSelectedTableId(table.id);
                              }}
                              data-testid={`table-${table.table_no}`}
                              className={`aspect-square rounded-lg text-base portrait:text-base landscape:text-lg font-bold transition-all shadow-sm flex flex-col items-center justify-center ${
                                tableNumber === table.table_no
                                  ? 'bg-blue-hero text-white shadow-lg ring-4 ring-blue-hero/30'
                                  : 'bg-white hover:bg-blue-light/20 hover:shadow-md border border-border'
                              }`}
                            >
                              <span>{table.table_no}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>

            {/* Footer */}
            {tableNumber && (
              <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="p-4 portrait:p-4 landscape:p-6 border-t border-border bg-white"
              >
                <button
                  onClick={() => { 
                    touchSound.playClick(); 
                    setShowTableSelector(false);
                    setTimeout(() => handlePlaceOrder(), 100);
                  }}
                  disabled={isPlacingOrder}
                  className={`w-full max-w-md mx-auto block bg-blue-hero text-white py-4 rounded-sm font-semibold hover:bg-blue-medium transition-all disabled:bg-muted disabled:text-muted-foreground ${isPortrait ? 'text-base' : 'text-xl'}`}
                >
                  {isPlacingOrder ? 'Placing Order...' : calculateTotals.grandTotal > 0 ? `Place Order • ₹${calculateTotals.grandTotal.toFixed(0)}` : 'Place Order'}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Overlay */}
      <AnimatePresence>
        {orderSuccess && (
          <SuccessOverlay
            orderId={orderSuccess.id}
            tableNumber={orderSuccess.tableNumber}
            onNewOrder={handleNewOrder}
          />
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-sm p-6 portrait:p-6 landscape:p-8 max-w-md w-full mx-4 text-center"
              onClick={e => e.stopPropagation()}
            >
              <LogOut size={40} className="portrait:w-10 portrait:h-10 landscape:w-12 landscape:h-12 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl portrait:text-xl landscape:text-2xl font-heading font-bold mb-2 uppercase text-blue-dark">Logout</h2>
              <p className="text-muted-foreground mb-6">Are you sure you want to logout?</p>
              <div className="flex gap-4">
                <button
                  onClick={() => { touchSound.playClick(); setShowLogoutConfirm(false); }}
                  data-testid="logout-cancel"
                  className="flex-1 py-3 rounded-sm border border-border hover:bg-muted transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  data-testid="logout-confirm"
                  className="flex-1 py-3 rounded-sm bg-red-500 text-white hover:bg-red-600 transition-all font-semibold"
                >
                  Yes, Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cooking Instructions Edit Popup */}
      <AnimatePresence>
        {editingInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end portrait:items-end landscape:items-center justify-center z-50"
            onClick={() => setEditingInstructions(null)}
          >
            <motion.div
              initial={{ scale: isPortrait ? 1 : 0.9, y: isPortrait ? '100%' : 0, opacity: isPortrait ? 1 : 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: isPortrait ? 1 : 0.9, y: isPortrait ? '100%' : 0, opacity: isPortrait ? 1 : 0 }}
              className={`bg-white ${isPortrait ? 'w-full rounded-t-2xl' : 'rounded-sm max-w-md w-full mx-4'} p-6`}
              onClick={e => e.stopPropagation()}
            >
              {isPortrait && (
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg portrait:text-lg landscape:text-xl font-heading font-bold uppercase text-blue-dark">Cooking Instructions</h2>
                  <p className="text-sm text-muted-foreground">{editingInstructions.name}</p>
                </div>
                <button
                  onClick={() => { touchSound.playClick(); setEditingInstructions(null); }}
                  className="p-2 hover:bg-muted rounded-sm"
                >
                  <X size={20} />
                </button>
              </div>
              <textarea
                value={editingInstructions.specialInstructions || ''}
                onChange={(e) => {
                  const newInstructions = e.target.value;
                  updateInstructions(editingInstructions.cartId, newInstructions);
                  setEditingInstructions({ ...editingInstructions, specialInstructions: newInstructions });
                }}
                placeholder="E.g., Less spicy, No onions, Extra crispy..."
                data-testid="edit-instructions-textarea"
                className="w-full bg-muted border border-border p-3 rounded-sm text-sm focus:outline-none focus:border-blue-hero resize-none h-24 mb-2"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right mb-4">{(editingInstructions.specialInstructions || '').length}/200</p>
              <button
                onClick={() => { touchSound.playClick(); setEditingInstructions(null); }}
                data-testid="save-instructions-button"
                className="w-full bg-blue-hero text-white py-4 rounded-sm font-semibold hover:bg-blue-medium transition-all"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KioskPage;
