import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Search, X, CheckCircle, Tag, Volume2, VolumeX, LogOut, MessageSquare } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import touchSound from '@/utils/touchSound';
import kioskLock from '@/utils/kioskLock';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Customization Modal Component
const CustomizationModal = ({ item, onClose, onAddToCart }) => {
  // Track selections per group for proper single/multiple handling
  const [groupSelections, setGroupSelections] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Handle variation selection based on group type
  const handleVariationSelect = (group, option) => {
    touchSound.playTap();
    
    setGroupSelections(prev => {
      const currentGroupSelections = prev[group.group_name] || [];
      const isSelected = currentGroupSelections.find(v => v.id === option.id);
      
      if (group.type === 'single') {
        // Single selection: replace any existing selection
        if (isSelected) {
          // Deselect if already selected (only if not required)
          return group.required 
            ? prev 
            : { ...prev, [group.group_name]: [] };
        }
        return { ...prev, [group.group_name]: [option] };
      } else {
        // Multiple selection: toggle
        if (isSelected) {
          return { ...prev, [group.group_name]: currentGroupSelections.filter(v => v.id !== option.id) };
        }
        return { ...prev, [group.group_name]: [...currentGroupSelections, option] };
      }
    });
  };

  // Check if option is selected
  const isOptionSelected = (groupName, optionId) => {
    const selections = groupSelections[groupName] || [];
    return selections.some(v => v.id === optionId);
  };

  // Get all selected variations flattened
  const getAllSelectedVariations = () => {
    return Object.values(groupSelections).flat();
  };

  // Calculate total price
  const calculateTotal = () => {
    const variationTotal = getAllSelectedVariations().reduce((sum, v) => sum + v.price, 0);
    return (item.price + variationTotal) * quantity;
  };

  // Check if all required groups have selections
  const hasRequiredSelections = () => {
    if (!item.variation_groups) return true;
    
    return item.variation_groups.every(group => {
      if (!group.required) return true;
      const selections = groupSelections[group.group_name] || [];
      return selections.length > 0;
    });
  };

  // Get missing required groups for error message
  const getMissingRequiredGroups = () => {
    if (!item.variation_groups) return [];
    
    return item.variation_groups
      .filter(group => group.required && !(groupSelections[group.group_name]?.length > 0))
      .map(group => group.group_name);
  };

  const handleAddToCart = () => {
    const selectedVariations = getAllSelectedVariations();
    
    // Check required selections
    if (!hasRequiredSelections()) {
      const missing = getMissingRequiredGroups();
      alert(`Please select: ${missing.join(', ')}`);
      return;
    }
    
    onAddToCart({
      ...item,
      variations: selectedVariations.map(v => v.name),
      variationDetails: selectedVariations,
      quantity,
      specialInstructions,
      totalPrice: item.price + selectedVariations.reduce((sum, v) => sum + v.price, 0)
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-sm max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border flex justify-between items-start">
          <div>
            <p className="text-sm text-blue-hero uppercase tracking-wide mb-1 font-medium">{item.category_name || item.category}</p>
            <h2 className="text-2xl font-heading font-semibold uppercase tracking-wide text-blue-dark">{item.name}</h2>
            {item.description && <p className="text-muted-foreground text-sm mt-1">{item.description}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-sm">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Variation Groups */}
          {item.variation_groups?.length > 0 && item.variation_groups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6">
              <p className="text-sm font-semibold mb-3 uppercase">
                {group.group_name}{' '}
                <span className={`font-normal ${group.required ? 'text-red-500' : 'text-muted-foreground'}`}>
                  ({group.required ? 'Required' : 'Optional'})
                </span>
                {group.type === 'single' && <span className="text-xs text-muted-foreground ml-2">• Select one</span>}
                {group.type === 'multiple' && <span className="text-xs text-muted-foreground ml-2">• Select multiple</span>}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {group.options.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleVariationSelect(group, option)}
                    className={`p-3 rounded-sm text-left text-sm transition-all ${
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

          {/* Fallback to old variations array if no variation_groups */}
          {(!item.variation_groups || item.variation_groups.length === 0) && item.variations?.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold mb-3 uppercase">Choice <span className="text-muted-foreground font-normal">(Optional)</span></p>
              <div className="grid grid-cols-2 gap-2">
                {item.variations.map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleVariationSelect({ group_name: 'Choice', type: 'multiple', required: false }, v)}
                    className={`p-3 rounded-sm text-left text-sm transition-all ${
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
                className="w-10 h-10 bg-muted rounded-sm flex items-center justify-center hover:bg-blue-light/20"
              >
                <Minus size={18} />
              </button>
              <span className="text-2xl font-semibold w-8 text-center text-blue-dark">{quantity}</span>
              <button
                onClick={() => { touchSound.playClick(); setQuantity(quantity + 1); }}
                className="w-10 h-10 bg-muted rounded-sm flex items-center justify-center hover:bg-blue-light/20"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-medium">Total</span>
            {item.is_complementary ? (
              <span className="text-2xl font-heading font-semibold text-green-600">FREE</span>
            ) : (
              <span className="text-2xl font-heading font-semibold text-blue-dark">₹{calculateTotal().toFixed(2)}</span>
            )}
          </div>
          <button
            onClick={() => { touchSound.playAddToCart(); handleAddToCart(); }}
            disabled={!hasRequiredSelections()}
            className={`w-full py-4 rounded-sm text-lg font-semibold transition-all ${
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
    // Play success sound when overlay appears
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
        className="text-center p-16"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <CheckCircle size={120} className="text-blue-medium mx-auto mb-6" />
        </motion.div>
        
        <h1 className="text-5xl font-heading font-bold mb-4 text-blue-dark uppercase tracking-wide">Order Confirmed!</h1>
        <p className="text-xl text-muted-foreground mb-2">Table Number: {tableNumber}</p>
        <p className="text-lg text-muted-foreground mb-8">Order ID: {orderId?.slice(0, 8).toUpperCase()}</p>
        
        <div className="bg-blue-light/20 p-6 rounded-sm mb-8 max-w-md mx-auto border border-blue-hero/30">
          <p className="text-lg font-medium">Your order has been sent to the kitchen</p>
          <p className="text-muted-foreground mt-2">Please proceed to Table {tableNumber}</p>
        </div>
        
        <div className="mb-8">
          <p className="text-xl text-muted-foreground">
            Redirecting to main screen in{' '}
            <span className="font-bold text-3xl text-blue-hero">{countdown}</span>
          </p>
        </div>
        
        <button
          onClick={onNewOrder}
          className="bg-blue-hero text-white px-12 py-4 rounded-sm text-xl font-semibold hover:bg-blue-medium transition-all"
        >
          Start New Order
        </button>
      </motion.div>
    </motion.div>
  );
};

const KioskPage = () => {
  const { cart, addToCart, removeFromCart, updateQuantity, updateInstructions, getTotal, clearCart } = useCart();
  const { logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editingInstructions, setEditingInstructions] = useState(null); // For editing instructions popup

  // Initialize kiosk lock on mount
  useEffect(() => {
    // Enable kiosk lock
    kioskLock.enable();
    
    // Setup admin unlock (5 taps on top-left corner)
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

  // Toggle sound
  const toggleSound = () => {
    const enabled = touchSound.toggle();
    setSoundEnabled(enabled);
    if (enabled) {
      touchSound.playClick();
    }
  };

  // Valid coupon codes
  const VALID_COUPONS = {
    'WELCOME10': { discount: 10, type: 'percent', description: '10% off' },
    'FLAT50': { discount: 50, type: 'flat', description: '₹50 off' },
    'HYATT20': { discount: 20, type: 'percent', description: '20% off' },
  };

  // GST rates
  const CGST_RATE = 2.5;
  const SGST_RATE = 2.5;

  // Generate table numbers 01-100 with leading zeros
  const allTables = useMemo(() => 
    Array.from({ length: 100 }, (_, i) => String(i + 1).padStart(2, '0')), []
  );

  // Calculate totals with GST and discount
  const calculateTotals = useMemo(() => {
    const subtotal = getTotal();
    
    // Apply coupon discount
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

  const handleSelectTable = (table) => {
    setTableNumber(table);
    setShowTableSelector(false);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, itemsRes] = await Promise.all([
          axios.get(`${API}/menu/categories`),
          axios.get(`${API}/menu/items`)
        ]);
        setCategories(catRes.data);
        setMenuItems(itemsRes.data);
        // Set first category as active
        if (catRes.data.length > 0 && !activeCategory) {
          setActiveCategory(catRes.data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredItems = menuItems.filter(item => item.category === activeCategory);

  const handleAddToCart = (item) => {
    addToCart(item);
    toast.success(`${item.name} added to cart`);
  };

  const handleMobileChange = (value) => {
    // Only allow numbers and limit to 10 digits
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
        customer_name: customerName || null,
        customer_mobile: customerMobile || null,
        items: cart.map(item => ({
          item_id: item.id,
          name: item.name,
          price: item.totalPrice || item.price,
          quantity: item.quantity,
          variations: item.variations || []
        })),
        subtotal: subtotal,
        discount: discount,
        coupon_code: appliedCoupon?.code || null,
        cgst: cgst,
        sgst: sgst,
        total: grandTotal
      };

      const response = await axios.post(`${API}/orders`, orderData);
      setOrderSuccess({ id: response.data.id, tableNumber, grandTotal, customerName });
      clearCart();
      setTableNumber('');
      setAppliedCoupon(null);
      setCouponCode('');
      setCustomerName('');
      setCustomerMobile('');
    } catch (error) {
      console.error('Failed to place order:', error);
      toast.error('Failed to place order. Please try again.');
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

  return (
    <div className="h-screen flex overflow-hidden bg-[#F9F8F6]">
      {/* LEFT COLUMN - Categories */}
      <div className="w-64 bg-white border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <img 
            src="https://customer-assets.emergentagent.com/job_660831f3-d103-4fb3-ae20-d0fe3dd0af53/artifacts/4li3nr0o_hya.png" 
            alt="Hyatt Centric Candolim Goa" 
            className="w-full h-auto max-h-20 object-contain"
          />
          <p className="text-xs text-muted-foreground mt-2 uppercase tracking-widest text-center">Breakfast Buffet</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              // Check if item is in cart and get quantity
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
                  {/* Cart quantity badge */}
                  {inCart && (
                    <div className="absolute top-2 right-2 z-10 w-8 h-8 bg-blue-hero text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                      {cartQty}
                    </div>
                  )}
                  <div className={`h-32 overflow-hidden ${inCart ? 'opacity-80' : ''}`}>
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-heading font-semibold text-sm mb-1 truncate uppercase text-blue-dark">{item.name}</h3>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{item.description}</p>
                    )}
                    {(item.portion_size || item.calories > 0) && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {[item.portion_size, item.calories > 0 ? `${item.calories} cal` : null].filter(Boolean).join(' • ')}
                        </span>
                      </div>
                    )}
                    {item.allergens?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.allergens.map(allergen => (
                          <span key={allergen} className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                            {allergen}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      {item.is_complementary ? (
                        <span className="text-lg font-semibold text-green-600">FREE</span>
                      ) : (
                        <span className="text-lg font-semibold text-blue-dark">₹{item.price.toFixed(0)}</span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                        }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          inCart 
                            ? 'bg-blue-light/30 text-blue-medium hover:bg-blue-hero hover:text-white' 
                            : 'bg-blue-hero text-white hover:bg-blue-medium'
                        }`}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Cart/Order */}
      <div className="w-96 bg-white border-l border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-heading font-bold uppercase text-blue-dark">Your Order</h2>
          <p className="text-sm text-muted-foreground">{cart.length} items</p>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2 font-medium">Your cart is empty</p>
              <p className="text-sm">Select items from the menu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.cartId} className="bg-blue-light/10 p-3 rounded-sm border border-blue-light/30" data-testid={`cart-item-${item.cartId}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-blue-dark">{item.name}</h4>
                        {/* Cooking Instructions Icon */}
                        <button
                          onClick={() => { touchSound.playTap(); setEditingInstructions(item); }}
                          data-testid={`edit-instructions-${item.cartId}`}
                          className={`p-1 rounded transition-all ${
                            item.specialInstructions 
                              ? 'text-blue-hero bg-blue-hero/10' 
                              : 'text-muted-foreground hover:text-blue-hero hover:bg-blue-hero/10'
                          }`}
                          title={item.specialInstructions || 'Add cooking instructions'}
                        >
                          <MessageSquare size={14} />
                        </button>
                      </div>
                      {item.variations?.length > 0 && (
                        <p className="text-xs text-blue-medium">{item.variations.join(', ')}</p>
                      )}
                      {item.specialInstructions && (
                        <p className="text-xs text-muted-foreground mt-1 italic">"{item.specialInstructions}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          touchSound.playClick();
                          if (item.quantity <= 1) {
                            removeFromCart(item.cartId);
                          } else {
                            updateQuantity(item.cartId, item.quantity - 1);
                          }
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
                    <span className="font-semibold text-blue-dark">₹{((item.totalPrice || item.price) * item.quantity).toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Footer */}
        <div className="p-4 border-t border-border bg-white">
          {/* Table Selection - Moved to top */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Table Number</label>
            <button
              onClick={() => setShowTableSelector(true)}
              data-testid="select-table-button"
              className={`w-full p-3 rounded-sm text-left border-2 transition-all ${
                tableNumber 
                  ? 'bg-blue-light/10 border-blue-hero' 
                  : 'bg-muted border-border hover:border-blue-light'
              }`}
            >
              {tableNumber ? (
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-heading font-bold text-blue-dark">Table {tableNumber}</span>
                  <span className="text-sm text-blue-hero">Tap to change</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Tap to select table</span>
              )}
            </button>
          </div>

          {/* Coupon Code */}
          {cart.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Coupon Code</label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 p-3 rounded-sm border border-green-200">
                  <div>
                    <span className="text-green-700 font-medium">{appliedCoupon.code}</span>
                    <span className="text-green-600 text-sm ml-2">({appliedCoupon.description})</span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-green-700 hover:text-green-900"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                    placeholder="Enter code"
                    data-testid="coupon-input"
                    className="flex-1 bg-muted border border-border p-2 rounded-sm text-sm focus:outline-none focus:border-blue-hero uppercase"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode}
                    data-testid="apply-coupon-button"
                    className="px-4 py-2 bg-blue-hero text-white rounded-sm text-sm font-semibold hover:bg-blue-medium disabled:bg-muted disabled:text-muted-foreground"
                  >
                    Apply
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs text-destructive mt-1">{couponError}</p>}
            </div>
          )}

          {/* Customer Info */}
          <div className="mb-4 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Name (Optional)</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                data-testid="customer-name-input"
                className="w-full bg-muted border border-border p-2 rounded-sm text-sm focus:outline-none focus:border-blue-hero"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mobile (Optional)</label>
              <input
                type="tel"
                inputMode="numeric"
                value={customerMobile}
                onChange={(e) => handleMobileChange(e.target.value)}
                placeholder="10-digit mobile number"
                data-testid="customer-mobile-input"
                className="w-full bg-muted border border-border p-2 rounded-sm text-sm focus:outline-none focus:border-blue-hero"
              />
            </div>
          </div>

          {/* Bill Summary with GST */}
          {cart.length > 0 && (
            <div className="border-t border-border pt-3 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{calculateTotals.subtotal.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedCoupon.description})</span>
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
              <div className="flex justify-between pt-2 border-t border-border text-base font-semibold">
                <span>Grand Total</span>
                <span data-testid="cart-total" className="text-blue-dark">₹{calculateTotals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Place Order Button - Opens table selector if no table selected */}
          <button
            onClick={() => {
              if (!tableNumber && cart.length > 0) {
                // Open table selector directly if no table selected
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
            {isPlacingOrder ? 'Placing Order...' : cart.length === 0 ? 'Add items to order' : !tableNumber ? 'Select Table' : `Place Order • ₹${calculateTotals.grandTotal.toFixed(0)}`}
          </button>
        </div>
      </div>

      {/* Customization Modal */}
      <AnimatePresence>
        {selectedItem && (
          <CustomizationModal
            item={selectedItem}
            onClose={() => { touchSound.playClick(); setSelectedItem(null); }}
            onAddToCart={handleAddToCart}
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
            <div className="p-6 border-b border-border flex items-center justify-between bg-white">
              <div>
                <h2 className="text-3xl font-heading font-bold uppercase text-blue-dark">Select Your Table</h2>
                <p className="text-muted-foreground mt-1">Tap on your table number</p>
              </div>
              <button
                onClick={() => { touchSound.playClick(); setShowTableSelector(false); }}
                className="p-3 hover:bg-muted rounded-sm transition-colors"
              >
                <X size={32} />
              </button>
            </div>

            {/* Table Grid */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#F9F8F6]">
              <div className="grid grid-cols-10 gap-3 max-w-6xl mx-auto">
                {allTables.map((table) => (
                  <motion.button
                    key={table}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { touchSound.playSelect(); handleSelectTable(table); }}
                    data-testid={`table-${table}`}
                    className={`aspect-square rounded-lg text-2xl font-bold transition-all shadow-sm ${
                      tableNumber === table
                        ? 'bg-blue-hero text-white shadow-lg ring-4 ring-blue-hero/30'
                        : 'bg-white hover:bg-blue-light/20 hover:shadow-md border border-border'
                    }`}
                  >
                    {table}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Footer */}
            {tableNumber && (
              <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="p-6 border-t border-border bg-white"
              >
                <button
                  onClick={() => { touchSound.playClick(); setShowTableSelector(false); }}
                  className="w-full max-w-md mx-auto block bg-blue-hero text-white py-4 rounded-sm text-xl font-semibold hover:bg-blue-medium transition-all"
                >
                  Confirm Table {tableNumber}
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
              className="bg-white rounded-sm p-8 max-w-md w-full mx-4 text-center"
              onClick={e => e.stopPropagation()}
            >
              <LogOut size={48} className="mx-auto text-red-500 mb-4" />
              <h2 className="text-2xl font-heading font-bold mb-2 uppercase text-blue-dark">Logout</h2>
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setEditingInstructions(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-sm p-6 max-w-md w-full mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-heading font-bold uppercase text-blue-dark">Cooking Instructions</h2>
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
                className="w-full bg-blue-hero text-white py-3 rounded-sm font-semibold hover:bg-blue-medium transition-all"
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
