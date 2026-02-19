import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Trash2, Search, X, CheckCircle } from 'lucide-react';
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
  const [tableInput, setTableInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // Valid coupon codes
  const VALID_COUPONS = {
    'WELCOME10': { discount: 10, type: 'percent', description: '10% off' },
    'FLAT50': { discount: 50, type: 'flat', description: '₹50 off' },
    'HYATT20': { discount: 20, type: 'percent', description: '20% off' },
  };

  // GST rates
  const CGST_RATE = 2.5;
  const SGST_RATE = 2.5;

  // Generate table numbers 1-150
  const allTables = useMemo(() => 
    Array.from({ length: 150 }, (_, i) => String(i + 1)), []
  );

  const suggestions = useMemo(() => {
    if (!tableInput) return [];
    return allTables.filter(table => table.startsWith(tableInput)).slice(0, 6);
  }, [tableInput, allTables]);

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

  const handleTableInputChange = (value) => {
    const numericValue = value.replace(/\D/g, '');
    setTableInput(numericValue);
    setShowSuggestions(numericValue.length > 0);
  };

  const handleSelectTable = (table) => {
    setTableNumber(table);
    setTableInput(table);
    setShowSuggestions(false);
  };

  const handlePlaceOrder = async () => {
    if (!tableNumber || cart.length === 0) return;
    
    setIsPlacingOrder(true);
    try {
      const orderData = {
        table_number: tableNumber,
        items: cart.map(item => ({
          item_id: item.id,
          name: item.name,
          price: item.totalPrice || item.price,
          quantity: item.quantity,
          variations: item.variations || []
        })),
        total: getTotal()
      };

      const response = await axios.post(`${API}/orders`, orderData);
      setOrderSuccess({ id: response.data.id, tableNumber });
      clearCart();
      setTableNumber('');
      setTableInput('');
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
                    <button
                      onClick={() => removeFromCart(item.cartId)}
                      className="p-1 text-destructive hover:bg-destructive/10 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                        className="w-7 h-7 bg-white rounded flex items-center justify-center"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                        className="w-7 h-7 bg-white rounded flex items-center justify-center"
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
          {/* Table Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Table Number</label>
            <div className="relative">
              <div className="flex items-center">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tableInput}
                    onChange={(e) => handleTableInputChange(e.target.value)}
                    onFocus={() => tableInput && setShowSuggestions(true)}
                    placeholder="Type table number..."
                    data-testid="table-number-input"
                    className="w-full bg-muted border border-border p-3 pl-10 rounded-sm text-lg focus:outline-none focus:border-accent"
                  />
                </div>
                {tableInput && (
                  <button
                    onClick={() => { setTableNumber(''); setTableInput(''); setShowSuggestions(false); }}
                    className="ml-2 p-3 bg-destructive/10 text-destructive rounded-sm"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute z-10 w-full mt-1 bg-white border border-border rounded-sm shadow-lg"
                  >
                    <div className="grid grid-cols-3 gap-1 p-2">
                      {suggestions.map((table) => (
                        <button
                          key={table}
                          onClick={() => handleSelectTable(table)}
                          data-testid={`table-suggestion-${table}`}
                          className={`p-3 text-lg font-medium rounded-sm transition-all ${
                            tableNumber === table 
                              ? 'bg-accent text-accent-foreground' 
                              : 'bg-muted hover:bg-accent/20'
                          }`}
                        >
                          {table}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {tableNumber && (
              <p className="text-sm text-accent mt-2">Table {tableNumber} selected</p>
            )}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between py-3 border-t border-border mb-4">
            <span className="text-lg font-medium">Total</span>
            <span className="text-2xl font-serif font-medium" data-testid="cart-total">₹{getTotal().toFixed(0)}</span>
          </div>

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
            {isPlacingOrder ? 'Placing Order...' : cart.length === 0 ? 'Add items to order' : !tableNumber ? 'Select table to continue' : 'Place Order'}
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
