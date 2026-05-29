import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, LogOut, ShoppingCart, Settings, Clock, Lock, Unlock } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMenuSettings } from '@/contexts/MenuSettingsContext';
import { useTimingSettings } from '@/contexts/TimingSettingsContext';
import { toast } from 'sonner';
import touchSound from '@/utils/touchSound';
import kioskLock from '@/utils/kioskLock';
import useOrientation from '@/hooks/useOrientation';
import { createAuthAxios } from '@/utils/kioskHelpers';

import CustomizationModal from '@/components/kiosk/CustomizationModal';
import SuccessOverlay from '@/components/kiosk/SuccessOverlay';
import CategoryPills from '@/components/kiosk/CategoryPills';
import InlineCartItem from '@/components/kiosk/InlineCartItem';
import CartSectionLandscape from '@/components/kiosk/CartSectionLandscape';
import PortraitMenuCard from '@/components/kiosk/PortraitMenuCard';
import LandscapeMenuCard from '@/components/kiosk/LandscapeMenuCard';
import TableSelector from '@/components/kiosk/TableSelector';
import LogoutConfirmModal from '@/components/kiosk/LogoutConfirmModal';
import EditInstructionsModal from '@/components/kiosk/EditInstructionsModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const KioskPage = ({ onNavigate }) => {
  const { cart, addToCart, removeFromCart, updateQuantity, updateInstructions, getTotal, clearCart } = useCart();
  const { logout, user, menuData } = useAuth();
  const { applySettings, resetComplete } = useMenuSettings();
  const { getCurrentPrepTime } = useTimingSettings();
  const isPortrait = useOrientation();
  
  const { categories, menuItems } = useMemo(
    () => applySettings(menuData.categories || [], menuData.menuItems || []),
    [applySettings, menuData.categories, menuData.menuItems]
  );
  
  const [tables] = useState(menuData.tables || []);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editingInstructions, setEditingInstructions] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const authAxios = useMemo(() => createAuthAxios(user?.token), [user?.token]);

  // Show table selector on mount if restaurant has tables but none selected
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

  const filteredItems = activeCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);
  
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

  const handleEditInstructionsUpdate = (value) => {
    updateInstructions(editingInstructions.cartId, value);
    setEditingInstructions({ ...editingInstructions, specialInstructions: value });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* ==================== PORTRAIT LAYOUT ==================== */}
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
              {isAdminMode && (
                <>
                  <button onClick={() => { touchSound.playClick(); onNavigate?.('menuSettings'); }} data-testid="portrait-menu-settings" className="p-2 rounded-sm bg-muted hover:bg-muted/80">
                    <Settings size={18} />
                  </button>
                  <button onClick={() => { touchSound.playClick(); onNavigate?.('timingSettings'); }} data-testid="portrait-timing-settings" className="p-2 rounded-sm bg-muted hover:bg-muted/80">
                    <Clock size={18} />
                  </button>
                  <button onClick={toggleSound} className="p-2 rounded-sm bg-muted hover:bg-muted/80">
                    {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </button>
                  <button onClick={() => { touchSound.playClick(); setShowLogoutConfirm(true); }} className="p-2 rounded-sm bg-red-50 text-red-600 hover:bg-red-100">
                    <LogOut size={18} />
                  </button>
                </>
              )}
              <button onClick={() => setIsAdminMode(prev => !prev)} data-testid="admin-toggle-portrait" className="p-1.5 rounded-sm text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-all">
                {isAdminMode ? <Unlock size={16} /> : <Lock size={16} />}
              </button>
            </div>
          </div>

          <CategoryPills categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

          {/* Scrollable Menu Grid */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="px-4 pt-3 pb-2">
              {activeCategory === 'all' ? (
                <div className="grid grid-cols-5 gap-2">
                  {categories.flatMap((category) => itemsByCategory[category.id] || []).map((item) => (
                    <PortraitMenuCard key={item.id} item={item} cart={cart} onSelectItem={setSelectedItem} />
                  ))}
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-heading font-bold uppercase text-blue-dark mb-3">
                    {categories.find(c => c.id === activeCategory)?.name || 'MENU'}
                  </h2>
                  <div className="grid grid-cols-5 gap-2">
                    {filteredItems.map((item) => (
                      <PortraitMenuCard key={item.id} item={item} cart={cart} onSelectItem={setSelectedItem} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom: Cart + Place Order */}
          <div className="flex-shrink-0 border-t border-border bg-background">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-heading font-bold uppercase text-blue-dark">Your Order</h2>
                <span className="text-sm text-muted-foreground">{cart.length} items</span>
              </div>
              {cart.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground bg-white rounded-sm border border-border">
                  <ShoppingCart size={28} className="mx-auto mb-1.5 opacity-30" />
                  <p className="font-medium text-sm">Ready to order?</p>
                  <p className="text-xs">Select items from the menu to begin</p>
                </div>
              ) : (
                <div className="max-h-[30vh] overflow-y-auto scrollbar-hide">
                  {cart.map((item) => (
                    <InlineCartItem key={item.cartId} item={item} removeFromCart={removeFromCart} updateQuantity={updateQuantity} setEditingInstructions={setEditingInstructions} />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border-t border-border p-4">
              {tables.length > 0 && tableNumber && (
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-sm text-muted-foreground">Ordering for</span>
                  <span className="text-sm font-bold text-blue-hero">Table {tableNumber}</span>
                  <button onClick={() => { touchSound.playClick(); setShowTableSelector(true); }} className="text-xs text-blue-hero underline">Change</button>
                </div>
              )}
              <button
                onClick={() => {
                  if (tables.length > 0 && !tableNumber) { touchSound.playClick(); setShowTableSelector(true); }
                  else if (cart.length > 0) { handlePlaceOrder(); }
                }}
                disabled={cart.length === 0 || isPlacingOrder}
                data-testid="place-order-button"
                className={`w-full py-4 rounded-sm text-lg font-semibold transition-all ${
                  cart.length > 0 && !isPlacingOrder ? 'bg-blue-hero text-white hover:bg-blue-medium' : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {isPlacingOrder ? 'Placing Order...' : cart.length === 0 ? 'Add items to order' : (tables.length > 0 && !tableNumber) ? 'Select Table to Order' : calculateTotals.grandTotal > 0 ? `Place Order • ₹${calculateTotals.grandTotal.toFixed(0)}` : 'Place Order'}
              </button>
            </div>
          </div>
        </>
      ) : (
        /* ==================== LANDSCAPE LAYOUT ==================== */
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Categories */}
          <div className="w-64 bg-white border-r border-border flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-border">
              <img src="https://customer-assets.emergentagent.com/job_aba4da0b-91ee-4a40-b348-36daa43480a8/artifacts/zyial4es_piyush_hyatt_logo_1.png" alt="Hyatt Centric" className="w-full h-auto max-h-20 object-contain" />
              <p className="text-xs text-muted-foreground mt-2 uppercase tracking-widest text-center">Breakfast Buffet</p>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => { touchSound.playTap(); setActiveCategory(category.id); }}
                  data-testid={`category-${category.id}`}
                  className={`w-full p-4 rounded-sm text-left transition-all ${
                    activeCategory === category.id ? 'bg-blue-hero text-white' : 'hover:bg-blue-light/20 text-muted-foreground'
                  }`}
                >
                  <span className="text-sm font-semibold uppercase tracking-wide">{category.name}</span>
                </button>
              ))}
            </nav>
            {isAdminMode && (
              <div className="p-4 border-t border-border space-y-2">
                <button onClick={() => { touchSound.playClick(); onNavigate?.('menuSettings'); }} data-testid="sidebar-menu-settings" className="w-full flex items-center justify-center space-x-2 p-3 rounded-sm bg-muted hover:bg-muted/80">
                  <Settings size={20} /><span className="text-sm">Menu Settings</span>
                </button>
                <button onClick={() => { touchSound.playClick(); onNavigate?.('timingSettings'); }} data-testid="sidebar-timing-settings" className="w-full flex items-center justify-center space-x-2 p-3 rounded-sm bg-muted hover:bg-muted/80">
                  <Clock size={20} /><span className="text-sm">Timing</span>
                </button>
                <button onClick={toggleSound} className="w-full flex items-center justify-center space-x-2 p-3 rounded-sm bg-muted hover:bg-muted/80">
                  {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  <span className="text-sm">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
                </button>
                <button onClick={() => { touchSound.playClick(); setShowLogoutConfirm(true); }} className="w-full flex items-center justify-center space-x-2 p-3 rounded-sm bg-red-50 text-red-600 hover:bg-red-100">
                  <LogOut size={20} /><span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            )}
            <div className="p-2 border-t border-border flex justify-center">
              <button onClick={() => setIsAdminMode(prev => !prev)} data-testid="admin-toggle-landscape" className="p-2 rounded-sm text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-all">
                {isAdminMode ? <Unlock size={16} /> : <Lock size={16} />}
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
                  <LandscapeMenuCard key={item.id} item={item} cart={cart} onSelectItem={setSelectedItem} />
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
      <AnimatePresence>
        {selectedItem && (
          <CustomizationModal item={selectedItem} onClose={() => { touchSound.playClick(); setSelectedItem(null); }} onAddToCart={handleAddToCart} isPortrait={isPortrait} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTableSelector && (
          <TableSelector tables={tables} tableNumber={tableNumber} setTableNumber={setTableNumber} setSelectedTableId={setSelectedTableId} onClose={() => setShowTableSelector(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {orderSuccess && <SuccessOverlay orderId={orderSuccess.id} tableNumber={orderSuccess.tableNumber} onNewOrder={() => setOrderSuccess(null)} prepTime={getCurrentPrepTime()} />}
      </AnimatePresence>

      <AnimatePresence>
        {showLogoutConfirm && <LogoutConfirmModal onClose={() => setShowLogoutConfirm(false)} onConfirm={handleLogout} />}
      </AnimatePresence>

      <AnimatePresence>
        {editingInstructions && (
          <EditInstructionsModal item={editingInstructions} isPortrait={isPortrait} onClose={() => setEditingInstructions(null)} onUpdate={handleEditInstructionsUpdate} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default KioskPage;
