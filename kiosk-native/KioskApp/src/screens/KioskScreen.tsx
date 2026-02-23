import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';
import { ordersAPI } from '../services/api';

const { width } = Dimensions.get('window');
const isLargeScreen = width > 1200;

// Helper: Treat price of 1 as 0 (complimentary item indicator)
const normalizePrice = (price: number): number => {
  return price === 1 ? 0 : price;
};

interface Table {
  id: string;
  table_no: string;
  title?: string;
}

const KioskScreen: React.FC = () => {
  const { logout, menuData } = useAuth();
  const { items: cartItems, addItem, updateQuantity, clearCart, getTotal, getItemCount } = useCart();
  
  // Use cached menu data from AuthContext (fetched at login) - NO API CALLS
  const categories = menuData.categories || [];
  const menuItems = menuData.menuItems || [];
  const tables = menuData.tables || [];
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categories.length > 0 ? categories[0].id : null
  );
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Filter items by selected category
  const filteredItems = useMemo(() => {
    return menuItems.filter((item: any) => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  const handleAddToCart = (item: any) => {
    addItem({
      item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      variations: [],
      image: item.image,
    });
  };

  const handlePlaceOrder = async () => {
    if (!selectedTable) {
      setShowTableModal(true);
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your order');
      return;
    }

    setPlacingOrder(true);
    try {
      const orderData = {
        table_number: selectedTable.table_no,
        table_id: selectedTable.id,
        items: cartItems.map(item => ({
          item_id: item.item_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          variations: item.variations,
        })),
        total: getTotal(),
      };

      await ordersAPI.createOrder(orderData);
      Alert.alert('Success', 'Order placed successfully!');
      clearCart();
      setSelectedTable(null);
    } catch (error) {
      console.error('Failed to place order:', error);
      Alert.alert('Error', 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  const renderCategoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.categoryItemSelected,
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.categoryTextSelected,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderMenuItem = ({ item }: { item: any }) => (
    <View style={styles.menuCard}>
      <Image source={{ uri: item.image }} style={styles.menuImage} />
      <View style={styles.menuContent}>
        <Text style={styles.menuName}>{item.name}</Text>
        <Text style={styles.menuDescription} numberOfLines={2}>
          {item.description}
        </Text>
        {item.portion_size && item.calories && (
          <Text style={styles.menuInfo}>
            {item.portion_size} • {item.calories} cal
          </Text>
        )}
        {item.allergens && item.allergens.length > 0 && (
          <View style={styles.allergenContainer}>
            {item.allergens.map((allergen: string, index: number) => (
              <View key={index} style={styles.allergenTag}>
                <Text style={styles.allergenText}>{allergen}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.menuFooter}>
          {normalizePrice(item.price) > 0 ? (
            <Text style={styles.menuPrice}>₹{normalizePrice(item.price)}</Text>
          ) : (
            <Text style={styles.menuPrice}></Text>
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddToCart(item)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
        {normalizePrice(item.price) > 0 && (
          <Text style={styles.cartItemPrice}>₹{normalizePrice(item.price)}</Text>
        )}
      </View>
      <View style={styles.cartItemQuantity}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.item_id, item.quantity - 1)}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.item_id, item.quantity + 1)}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTableModal = () => (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Table</Text>
        <ScrollView style={styles.tableList}>
          <View style={styles.tableGrid}>
            {tables.slice(0, 20).map((table: Table) => (
              <TouchableOpacity
                key={table.id}
                style={[
                  styles.tableItem,
                  selectedTable?.id === table.id && styles.tableItemSelected,
                ]}
                onPress={() => {
                  setSelectedTable(table);
                  setShowTableModal(false);
                }}
              >
                <Text style={styles.tableNumber}>{table.table_no}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <TouchableOpacity
          style={styles.modalCloseButton}
          onPress={() => setShowTableModal(false)}
        >
          <Text style={styles.modalCloseText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // No loading state needed - data is cached from login
  if (categories.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No menu data available. Please re-login.</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedCategoryName = categories.find((c: any) => c.id === selectedCategory)?.name || '';

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>HYATT</Text>
          <Text style={styles.logoSubtext}>CENTRIC</Text>
        </View>
        <Text style={styles.sidebarTitle}>BREAKFAST BUFFET</Text>
        
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          style={styles.categoryList}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.sidebarFooter}>
          <TouchableOpacity style={styles.soundButton}>
            <Text style={styles.soundButtonText}>🔊 Sound On</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>→ Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.categoryTitle}>{selectedCategoryName}</Text>
            <Text style={styles.categorySubtitle}>Select items to add to your order</Text>
          </View>
          {selectedTable && (
            <TouchableOpacity 
              style={styles.tableIndicator}
              onPress={() => setShowTableModal(true)}
            >
              <Text style={styles.tableIndicatorText}>Table {selectedTable.table_no}</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredItems}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item.id}
          numColumns={isLargeScreen ? 3 : 2}
          contentContainerStyle={styles.menuGrid}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Cart Sidebar */}
      <View style={styles.cartSidebar}>
        <Text style={styles.cartTitle}>YOUR ORDER</Text>
        <Text style={styles.cartSubtitle}>{getItemCount()} items</Text>

        {cartItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyCartTitle}>Your breakfast awaits.</Text>
            <Text style={styles.emptyCartSubtitle}>Select from the menu.</Text>
          </View>
        ) : (
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.item_id}
            style={styles.cartList}
          />
        )}

        <View style={styles.cartFooter}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>₹{getTotal().toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.orderButton, cartItems.length === 0 && styles.orderButtonDisabled]}
            onPress={handlePlaceOrder}
            disabled={cartItems.length === 0 || placingOrder}
          >
            {placingOrder ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.orderButtonText}>
                {selectedTable ? 'Place Order' : 'Select Table'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Table Selection Modal */}
      {showTableModal && renderTableModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F9F8F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F8F6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#6B7280',
  },
  logoutButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  
  // Sidebar
  sidebar: {
    width: isLargeScreen ? 200 : 160,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    paddingTop: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: isLargeScreen ? 20 : 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  logoSubtext: {
    fontSize: isLargeScreen ? 14 : 12,
    color: '#1a1a1a',
  },
  sidebarTitle: {
    fontSize: isLargeScreen ? 12 : 10,
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 24,
  },
  categoryList: {
    flex: 1,
  },
  categoryItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  categoryItemSelected: {
    backgroundColor: '#177DAA',
    borderLeftColor: '#177DAA',
  },
  categoryText: {
    fontSize: isLargeScreen ? 14 : 12,
    fontWeight: '600',
    color: '#374151',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  soundButton: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 8,
  },
  soundButtonText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  logoutBtn: {
    padding: 12,
  },
  logoutBtnText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },

  // Main Content
  mainContent: {
    flex: 1,
    padding: isLargeScreen ? 24 : 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: isLargeScreen ? 32 : 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  categorySubtitle: {
    fontSize: isLargeScreen ? 16 : 14,
    color: '#6B7280',
    marginTop: 4,
  },
  tableIndicator: {
    backgroundColor: '#177DAA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tableIndicatorText: {
    color: '#fff',
    fontWeight: '600',
  },
  menuGrid: {
    paddingBottom: 20,
  },
  menuCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: isLargeScreen ? '31%' : '46%',
  },
  menuImage: {
    width: '100%',
    height: isLargeScreen ? 160 : 120,
    resizeMode: 'cover',
  },
  menuContent: {
    padding: 12,
  },
  menuName: {
    fontSize: isLargeScreen ? 16 : 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: isLargeScreen ? 13 : 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  menuInfo: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  allergenContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  allergenTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  allergenText: {
    fontSize: 10,
    color: '#DC2626',
  },
  menuFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuPrice: {
    fontSize: isLargeScreen ? 18 : 16,
    fontWeight: 'bold',
    color: '#177DAA',
  },
  addButton: {
    width: 36,
    height: 36,
    backgroundColor: '#177DAA',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Cart Sidebar
  cartSidebar: {
    width: isLargeScreen ? 300 : 240,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    padding: 20,
  },
  cartTitle: {
    fontSize: isLargeScreen ? 20 : 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  cartSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyCartSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  cartList: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  cartItemPrice: {
    fontSize: 13,
    color: '#177DAA',
    marginTop: 2,
  },
  cartItemQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cartFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#177DAA',
  },
  orderButton: {
    backgroundColor: '#177DAA',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  orderButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: isLargeScreen ? 500 : '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  tableList: {
    maxHeight: 400,
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tableItem: {
    width: 60,
    height: 60,
    margin: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tableItemSelected: {
    borderColor: '#177DAA',
    backgroundColor: '#E0F2FE',
  },
  tableNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  modalCloseButton: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default KioskScreen;
