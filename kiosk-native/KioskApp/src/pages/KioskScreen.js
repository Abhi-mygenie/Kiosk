// Kiosk Screen - Main ordering screen
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { normalizePrice, formatCurrencyShort } from '../utils/helpers';
import { createAuthClient, API_URL } from '../utils/api';

// Components
import MenuItemCard from '../components/MenuItemCard';
import CartSection from '../components/CartSection';
import CategoryPills from '../components/CategoryPills';
import TableSelector from '../components/TableSelector';
import CustomizationModal from '../components/CustomizationModal';
import SuccessOverlay from '../components/SuccessOverlay';
import Header from '../components/Header';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;

const CGST_RATE = 2.5;
const SGST_RATE = 2.5;

const KioskScreen = () => {
  const { user, menuData, logout } = useAuth();
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, getTotal } = useCart();

  // State
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { categories, menuItems, tables } = menuData;

  // Show table selector on mount if no table selected
  useEffect(() => {
    if (!tableNumber && tables.length > 0 && !orderSuccess) {
      setShowTableSelector(true);
    }
  }, [tables, tableNumber, orderSuccess]);

  // Calculate totals
  const calculateTotals = useMemo(() => {
    const subtotal = getTotal();
    const cgst = (subtotal * CGST_RATE) / 100;
    const sgst = (subtotal * SGST_RATE) / 100;
    const grandTotal = subtotal + cgst + sgst;
    return { subtotal, cgst, sgst, grandTotal };
  }, [getTotal]);

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') {
      return menuItems;
    }
    return menuItems.filter(item => item.category === activeCategory);
  }, [activeCategory, menuItems]);

  // Group items by category for ALL view
  const itemsByCategory = useMemo(() => {
    const grouped = {};
    categories.forEach(cat => {
      grouped[cat.id] = menuItems.filter(item => item.category === cat.id);
    });
    return grouped;
  }, [categories, menuItems]);

  // Handle add to cart with variations
  const handleAddToCart = item => {
    const itemWithGroupedVariations = {
      ...item,
      groupedVariations:
        item.variationDetails?.reduce((acc, v) => {
          const sourceItem = menuItems.find(mi => mi.id === item.id);
          const group = sourceItem?.variation_groups?.find(g =>
            g.options.some(opt => opt.name === v.name)
          );
          const groupName = group?.group_name || 'CHOICE';
          if (!acc[groupName]) acc[groupName] = [];
          acc[groupName].push(v.name);
          return acc;
        }, {}) || {},
    };
    addToCart(itemWithGroupedVariations);
    Toast.show({
      type: 'success',
      text1: `${item.name} added to cart`,
      visibilityTime: 2000,
    });
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!tableNumber || cart.length === 0) return;

    setIsPlacingOrder(true);
    try {
      const { subtotal, cgst, sgst, grandTotal } = calculateTotals;
      const authAxios = createAuthClient(user.token);

      const orderData = {
        table_number: tableNumber,
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
        subtotal,
        discount: 0,
        cgst,
        sgst,
        total: grandTotal,
      };

      const response = await authAxios.post(`${API_URL}/orders`, orderData);
      setOrderSuccess({
        id: response.data.id || response.data.pos_order_id,
        tableNumber,
        grandTotal,
      });
      clearCart();
      setTableNumber('');
      setSelectedTableId('');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to place order',
        text2: error.response?.data?.detail || 'Please try again',
        visibilityTime: 3000,
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    clearCart();
    logout();
    Toast.show({
      type: 'success',
      text1: 'Logged out successfully',
    });
  };

  // Render category section for ALL view
  const renderCategorySection = ({ item: category }) => {
    const categoryItems = itemsByCategory[category.id] || [];
    if (categoryItems.length === 0) return null;

    return (
      <View style={styles.categorySection}>
        <Text style={styles.categorySectionTitle}>{category.name}</Text>
        <FlatList
          data={categoryItems}
          renderItem={({ item }) => (
            <MenuItemCard
              item={item}
              onPress={() => setSelectedItem(item)}
              cartQuantity={cart
                .filter(ci => ci.id === item.id)
                .reduce((sum, ci) => sum + ci.quantity, 0)}
            />
          )}
          keyExtractor={item => item.id}
          numColumns={4}
          scrollEnabled={false}
          columnWrapperStyle={styles.menuGrid}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header
        tableNumber={tableNumber}
        onTablePress={() => setShowTableSelector(true)}
        onLogoutPress={() => setShowLogoutConfirm(true)}
      />

      {/* Category Pills */}
      <CategoryPills
        categories={categories}
        activeCategory={activeCategory}
        onCategoryPress={setActiveCategory}
      />

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {activeCategory === 'all' ? (
            <FlatList
              data={categories}
              renderItem={renderCategorySection}
              keyExtractor={cat => cat.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.menuList}
            />
          ) : (
            <FlatList
              data={filteredItems}
              renderItem={({ item }) => (
                <MenuItemCard
                  item={item}
                  onPress={() => setSelectedItem(item)}
                  cartQuantity={cart
                    .filter(ci => ci.id === item.id)
                    .reduce((sum, ci) => sum + ci.quantity, 0)}
                />
              )}
              keyExtractor={item => item.id}
              numColumns={4}
              columnWrapperStyle={styles.menuGrid}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.menuList}
            />
          )}
        </View>

        {/* Cart Section (Landscape) or Bottom Cart (Portrait) */}
        <CartSection
          cart={cart}
          totals={calculateTotals}
          tableNumber={tableNumber}
          isPlacingOrder={isPlacingOrder}
          onRemoveItem={removeFromCart}
          onUpdateQuantity={updateQuantity}
          onPlaceOrder={handlePlaceOrder}
          onSelectTable={() => setShowTableSelector(true)}
        />
      </View>

      {/* Modals */}
      {selectedItem && (
        <CustomizationModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {showTableSelector && (
        <TableSelector
          tables={tables}
          selectedTable={tableNumber}
          onSelectTable={(tableNo, tableId) => {
            setTableNumber(tableNo);
            setSelectedTableId(tableId);
          }}
          onClose={() => tableNumber && setShowTableSelector(false)}
        />
      )}

      {orderSuccess && (
        <SuccessOverlay
          orderId={orderSuccess.id}
          tableNumber={orderSuccess.tableNumber}
          onNewOrder={() => setOrderSuccess(null)}
        />
      )}

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModal}>
            <Text style={styles.logoutTitle}>LOGOUT</Text>
            <Text style={styles.logoutText}>Are you sure you want to logout?</Text>
            <View style={styles.logoutButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowLogoutConfirm(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleLogout}>
                <Text style={styles.confirmButtonText}>Yes, Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  menuList: {
    padding: spacing.base,
  },
  menuGrid: {
    justifyContent: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  categorySection: {
    marginBottom: spacing.lg,
  },
  categorySectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.blueDark,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  logoutModal: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.xl,
    width: 320,
    alignItems: 'center',
  },
  logoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.blueDark,
    marginBottom: spacing.sm,
  },
  logoutText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  logoutButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});

export default KioskScreen;
