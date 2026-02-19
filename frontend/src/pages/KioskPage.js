import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Trash2, Search, X, CheckCircle, Tag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Customization Modal Component
const CustomizationModal = ({ item, onClose, onAddToCart }) => {
  const [selectedVariations, setSelectedVariations] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const toggleVariation = (variation) => {
    setSelectedVariations(prev => 
      prev.find(v => v.id === variation.id)
        ? prev.filter(v => v.id !== variation.id)
        : [...prev, variation]
    );
  };

  const calculateTotal = () => {
    const variationTotal = selectedVariations.reduce((sum, v) => sum + v.price, 0);
    return (item.price + variationTotal) * quantity;
  };

  const handleAddToCart = () => {
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
            <p className="text-sm text-accent uppercase tracking-wide mb-1">{item.category}</p>
            <h2 className="text-2xl font-serif font-medium">{item.name}</h2>
            <p className="text-muted-foreground text-sm mt-1">{item.description}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-sm">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Item Info */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-muted p-3 rounded-sm text-center">
              <p className="text-xs text-muted-foreground uppercase">Price</p>
              <p className="text-lg font-medium">₹{item.price.toFixed(2)}</p>
            </div>
            <div className="bg-muted p-3 rounded-sm text-center">
              <p className="text-xs text-muted-foreground uppercase">Calories</p>
              <p className="text-lg font-medium">{item.calories} cal</p>
            </div>
            <div className="bg-muted p-3 rounded-sm text-center">
              <p className="text-xs text-muted-foreground uppercase">Portion</p>
              <p className="text-lg font-medium">{item.portion_size}</p>
            </div>
          </div>

          {/* Allergens */}
          {item.allergens?.length > 0 && (
            <div className="mb-6 p-3 bg-red-50 rounded-sm">
              <p className="text-xs text-red-700 font-medium mb-2">Allergen Information</p>
              <div className="flex flex-wrap gap-2">
                {item.allergens.map(a => (
                  <span key={a} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Variations */}
          {item.variations?.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-3">CHOICE <span className="text-muted-foreground font-normal">(Optional)</span></p>
              <div className="grid grid-cols-2 gap-2">
                {item.variations.map(v => (
                  <button
                    key={v.id}
                    onClick={() => toggleVariation(v)}
                    className={`p-3 rounded-sm text-left text-sm transition-all ${
                      selectedVariations.find(sv => sv.id === v.id)
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <span className="font-medium">{v.name}</span>
                    {v.price > 0 && <span className="text-xs ml-1">+₹{v.price}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center justify-between mb-6">
            <span className="font-medium">Quantity</span>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 bg-muted rounded-sm flex items-center justify-center hover:bg-muted/80"
              >
                <Minus size={18} />
              </button>
              <span className="text-2xl font-medium w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 bg-muted rounded-sm flex items-center justify-center hover:bg-muted/80"
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
            <span className="text-2xl font-serif font-medium">₹{calculateTotal().toFixed(2)}</span>
          </div>
          <button
            onClick={handleAddToCart}
            className="w-full bg-accent text-accent-foreground py-4 rounded-sm text-lg font-medium hover:bg-accent/90 transition-all"
          >
            Add to Cart
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
          <CheckCircle size={120} className="text-[#2D6A4F] mx-auto mb-6" />
        </motion.div>
        
        <h1 className="text-5xl font-serif font-medium mb-4">Order Confirmed!</h1>
        <p className="text-xl text-muted-foreground mb-2">Table Number: {tableNumber}</p>
        <p className="text-lg text-muted-foreground mb-8">Order ID: {orderId?.slice(0, 8).toUpperCase()}</p>
        
        <div className="bg-muted p-6 rounded-sm mb-8 max-w-md mx-auto">
          <p className="text-lg">Your order has been sent to the kitchen</p>
          <p className="text-muted-foreground mt-2">Please proceed to Table {tableNumber}</p>
        </div>
        
        <div className="mb-8">
          <p className="text-xl text-muted-foreground">
            Redirecting to main screen in{' '}
            <span className="font-bold text-3xl text-accent">{countdown}</span>
          </p>
        </div>
        
        <button
          onClick={onNewOrder}
          className="bg-accent text-accent-foreground px-12 py-4 rounded-sm text-xl font-medium hover:bg-accent/90 transition-all"
        >
          Start New Order
        </button>
      </motion.div>
    </motion.div>
  );
};

const KioskPage = () => {
  const { cart, addToCart, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('dosa');
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

        <nav className="flex-1 p-4 space-y-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              data-testid={`category-${category.id}`}
              className={`w-full p-4 rounded-sm text-left transition-all ${
                activeCategory === category.id
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              <span className="text-sm font-medium uppercase tracking-wide">{category.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* MIDDLE COLUMN - Menu Items */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 bg-white border-b border-border">
          <h1 className="text-3xl font-serif font-medium uppercase tracking-wide">
            {categories.find(c => c.id === activeCategory)?.name || 'MENU'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Select items to add to your order</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-sm overflow-hidden border border-border hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedItem(item)}
                data-testid={`menu-item-${item.id}`}
              >
                <div className="h-32 overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <h3 className="font-serif font-medium text-sm mb-1 truncate">{item.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-medium">₹{item.price.toFixed(0)}</span>
                      <span className="text-xs text-muted-foreground ml-2">{item.calories} cal</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(item);
                      }}
                      className="w-9 h-9 bg-accent text-accent-foreground rounded-full flex items-center justify-center hover:bg-accent/90"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Cart/Order */}
      <div className="w-96 bg-white border-l border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-serif font-medium">Your Order</h2>
          <p className="text-sm text-muted-foreground">{cart.length} items</p>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">Your cart is empty</p>
              <p className="text-sm">Select items from the menu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.cartId} className="bg-muted p-3 rounded-sm" data-testid={`cart-item-${item.cartId}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      {item.variations?.length > 0 && (
                        <p className="text-xs text-accent">{item.variations.join(', ')}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          if (item.quantity <= 1) {
                            removeFromCart(item.cartId);
                          } else {
                            updateQuantity(item.cartId, item.quantity - 1);
                          }
                        }}
                        className="w-7 h-7 bg-white rounded flex items-center justify-center hover:bg-destructive/10"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                        className="w-7 h-7 bg-white rounded flex items-center justify-center hover:bg-accent/10"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="font-medium">₹{((item.totalPrice || item.price) * item.quantity).toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Footer */}
        <div className="p-4 border-t border-border bg-white">
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
                    className="flex-1 bg-muted border border-border p-2 rounded-sm text-sm focus:outline-none focus:border-accent uppercase"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode}
                    data-testid="apply-coupon-button"
                    className="px-4 py-2 bg-accent text-accent-foreground rounded-sm text-sm font-medium hover:bg-accent/90 disabled:bg-muted disabled:text-muted-foreground"
                  >
                    Apply
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs text-destructive mt-1">{couponError}</p>}
            </div>
          )}

          {/* Table Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Table Number</label>
            <button
              onClick={() => setShowTableSelector(true)}
              data-testid="select-table-button"
              className={`w-full p-3 rounded-sm text-left border-2 transition-all ${
                tableNumber 
                  ? 'bg-accent/10 border-accent' 
                  : 'bg-muted border-border hover:border-accent/50'
              }`}
            >
              {tableNumber ? (
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-serif font-medium">Table {tableNumber}</span>
                  <span className="text-sm text-accent">Tap to change</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Tap to select table</span>
              )}
            </button>
          </div>

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
                className="w-full bg-muted border border-border p-2 rounded-sm text-sm focus:outline-none focus:border-accent"
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
                className="w-full bg-muted border border-border p-2 rounded-sm text-sm focus:outline-none focus:border-accent"
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
              <div className="flex justify-between pt-2 border-t border-border text-base font-medium">
                <span>Grand Total</span>
                <span data-testid="cart-total">₹{calculateTotals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Place Order Button */}
          <button
            onClick={handlePlaceOrder}
            disabled={!tableNumber || cart.length === 0 || isPlacingOrder}
            data-testid="place-order-button"
            className={`w-full py-4 rounded-sm text-lg font-medium transition-all ${
              tableNumber && cart.length > 0 && !isPlacingOrder
                ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {isPlacingOrder ? 'Placing Order...' : cart.length === 0 ? 'Add items to order' : !tableNumber ? 'Select table to continue' : `Place Order • ₹${calculateTotals.grandTotal.toFixed(0)}`}
          </button>
        </div>
      </div>

      {/* Customization Modal */}
      <AnimatePresence>
        {selectedItem && (
          <CustomizationModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
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
                <h2 className="text-3xl font-serif font-medium">Select Your Table</h2>
                <p className="text-muted-foreground mt-1">Tap on your table number</p>
              </div>
              <button
                onClick={() => setShowTableSelector(false)}
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
                    onClick={() => handleSelectTable(table)}
                    data-testid={`table-${table}`}
                    className={`aspect-square rounded-lg text-2xl font-bold transition-all shadow-sm ${
                      tableNumber === table
                        ? 'bg-accent text-white shadow-lg ring-4 ring-accent/30'
                        : 'bg-white hover:bg-accent/10 hover:shadow-md border border-border'
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
                  onClick={() => setShowTableSelector(false)}
                  className="w-full max-w-md mx-auto block bg-accent text-accent-foreground py-4 rounded-sm text-xl font-medium hover:bg-accent/90 transition-all"
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
    </div>
  );
};

export default KioskPage;
