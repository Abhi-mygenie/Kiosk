// Kiosk Screen - Main ordering screen (orchestrator)
import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useMenuSettings } from '../contexts/MenuSettingsContext';
import { useTimingSettings } from '../contexts/TimingSettingsContext';
import { colors } from '../theme/colors';
import { createAuthClient, API_URL } from '../utils/api';

import Header from '../components/Header';
import CategoryPills from '../components/CategoryPills';
import MenuGrid from '../components/MenuGrid';
import CartSection from '../components/CartSection';
import CustomizationModal from '../components/CustomizationModal';
import TableSelector from '../components/TableSelector';
import SuccessOverlay from '../components/SuccessOverlay';
import LogoutConfirmModal from '../components/LogoutConfirmModal';
import EditInstructionsModal from '../components/EditInstructionsModal';

const CGST_RATE = 2.5;
const SGST_RATE = 2.5;

const KioskScreen = ({ navigation }) => {
  const { user, menuData, logout } = useAuth();
  const { cart, addToCart, removeFromCart, updateQuantity, updateInstructions, clearCart, getTotal } = useCart();
  const { applySettings, resetComplete } = useMenuSettings();
  const { getCurrentPrepTime } = useTimingSettings();

  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [editingInstructions, setEditingInstructions] = useState(null);

  const { categories, menuItems } = useMemo(
    () => applySettings(menuData.categories || [], menuData.menuItems || []),
    [applySettings, menuData.categories, menuData.menuItems],
  );
  const tables = menuData.tables || [];

  useEffect(() => {
    if (!tableNumber && tables.length > 0 && !orderSuccess) {
      setShowTableSelector(true);
    }
  }, [tables, tableNumber, orderSuccess]);

  const calculateTotals = useMemo(() => {
    const subtotal = getTotal();
    const cgst = (subtotal * CGST_RATE) / 100;
    const sgst = (subtotal * SGST_RATE) / 100;
    return { subtotal, cgst, sgst, grandTotal: subtotal + cgst + sgst };
  }, [getTotal]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return menuItems;
    return menuItems.filter(item => item.category === activeCategory);
  }, [activeCategory, menuItems]);

  const itemsByCategory = useMemo(() => {
    const grouped = {};
    categories.forEach(cat => {
      grouped[cat.id] = menuItems.filter(item => item.category === cat.id);
    });
    return grouped;
  }, [categories, menuItems]);

  const allItems = useMemo(
    () => categories.flatMap(cat => itemsByCategory[cat.id] || []),
    [categories, itemsByCategory],
  );

  const displayItems = activeCategory === 'all' ? allItems : filteredItems;

  const handleAddToCart = (item) => {
    const itemWithGroupedVariations = {
      ...item,
      groupedVariations:
        item.variationDetails?.reduce((acc, v) => {
          const sourceItem = menuItems.find(mi => mi.id === item.id);
          const group = sourceItem?.variation_groups?.find(g =>
            g.options.some(opt => opt.name === v.name),
          );
          const groupName = group?.group_name || 'CHOICE';
          if (!acc[groupName]) acc[groupName] = [];
          acc[groupName].push(v.name);
          return acc;
        }, {}) || {},
    };
    addToCart(itemWithGroupedVariations);
    Toast.show({ type: 'success', text1: `${item.name} added to cart`, visibilityTime: 2000 });
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (tables.length > 0 && !tableNumber) return;

    setIsPlacingOrder(true);
    try {
      const { subtotal, cgst, sgst, grandTotal } = calculateTotals;
      const authAxios = createAuthClient(user.token);
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
          special_instructions: item.specialInstructions || null,
        })),
        subtotal, discount: 0, cgst, sgst, total: grandTotal,
      };

      const response = await authAxios.post(`${API_URL}/orders`, orderData);
      setOrderSuccess({ id: response.data.id || response.data.pos_order_id, tableNumber, grandTotal });
      clearCart();
      setTableNumber('');
      setSelectedTableId('');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to place order', text2: error.response?.data?.detail || 'Please try again', visibilityTime: 3000 });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleLogout = () => {
    clearCart();
    resetComplete();
    logout();
    Toast.show({ type: 'success', text1: 'Logged out successfully' });
  };

  const handleEditInstructionsUpdate = (val) => {
    updateInstructions(editingInstructions.cartId, val);
    setEditingInstructions({ ...editingInstructions, specialInstructions: val });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        tableNumber={tableNumber}
        hasTables={tables.length > 0}
        isAdminMode={isAdminMode}
        onAdminToggle={() => setIsAdminMode(prev => !prev)}
        onTablePress={() => setShowTableSelector(true)}
        onLogoutPress={() => setShowLogoutConfirm(true)}
        onMenuSettingsPress={() => navigation.navigate('MenuSettings', { fromSidebar: true })}
        onTimingPress={() => navigation.navigate('TimingSettings', { fromSidebar: true })}
      />

      <CategoryPills
        categories={categories}
        activeCategory={activeCategory}
        onCategoryPress={setActiveCategory}
      />

      <View style={styles.mainContent}>
        <View style={styles.menuContainer}>
          <MenuGrid items={displayItems} cart={cart} onSelectItem={setSelectedItem} />
        </View>

        <CartSection
          cart={cart}
          totals={calculateTotals}
          tableNumber={tableNumber}
          isPlacingOrder={isPlacingOrder}
          hasTables={tables.length > 0}
          onRemoveItem={removeFromCart}
          onUpdateQuantity={updateQuantity}
          onPlaceOrder={handlePlaceOrder}
          onSelectTable={() => setShowTableSelector(true)}
          onEditInstructions={setEditingInstructions}
        />
      </View>

      {selectedItem && (
        <CustomizationModal item={selectedItem} onClose={() => setSelectedItem(null)} onAddToCart={handleAddToCart} />
      )}

      {showTableSelector && (
        <TableSelector
          tables={tables}
          selectedTable={tableNumber}
          onSelectTable={(tableNo, tableId) => { setTableNumber(tableNo); setSelectedTableId(tableId); }}
          onClose={() => tableNumber && setShowTableSelector(false)}
        />
      )}

      {orderSuccess && (
        <SuccessOverlay orderId={orderSuccess.id} tableNumber={orderSuccess.tableNumber} onNewOrder={() => setOrderSuccess(null)} prepTime={getCurrentPrepTime()} />
      )}

      {showLogoutConfirm && (
        <LogoutConfirmModal onClose={() => setShowLogoutConfirm(false)} onConfirm={handleLogout} />
      )}

      {editingInstructions && (
        <EditInstructionsModal item={editingInstructions} onClose={() => setEditingInstructions(null)} onUpdate={handleEditInstructionsUpdate} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  menuContainer: {
    flex: 1,
  },
});

export default KioskScreen;
