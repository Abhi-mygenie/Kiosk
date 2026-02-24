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
  TextInput,
  Modal,
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

interface VariationOption {
  id: string;
  name: string;
  price: number;
}

interface VariationGroup {
  group_name: string;
  type: 'single' | 'multiple';
  required: boolean;
  min_select: number;
  max_select: number;
  options: VariationOption[];
}

const KioskScreen: React.FC = () => {
  const { logout, menuData } = useAuth();
  const { items: cartItems, addItem, updateQuantity, clearCart, getTotal, getItemCount } = useCart();
  const { colors } = useTheme();
  
  // Use cached menu data from AuthContext (fetched at login) - NO API CALLS
  const categories = menuData.categories || [];
  const tables = menuData.tables || [];
  
  // Memoize menuItems to prevent reference changes
  const menuItems = useMemo(() => menuData.menuItems || [], [menuData.menuItems]);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categories.length > 0 ? categories[0].id : null
  );
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  
  // Customization modal state
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [groupSelections, setGroupSelections] = useState<Record<string, VariationOption[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Filter items by selected category
  const filteredItems = useMemo(() => {
    return menuItems.filter((item: any) => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  // Open customization modal
  const openCustomizationModal = (item: any) => {
    setSelectedItem(item);
    setGroupSelections({});
    setQuantity(1);
    setSpecialInstructions('');
  };

  // Close customization modal
  const closeCustomizationModal = () => {
    setSelectedItem(null);
    setGroupSelections({});
    setQuantity(1);
    setSpecialInstructions('');
  };

  // Handle variation selection
  const handleVariationSelect = (group: VariationGroup, option: VariationOption) => {
    setGroupSelections(prev => {
      const currentSelections = prev[group.group_name] || [];
      const isSelected = currentSelections.some(v => v.id === option.id);
      
      if (group.type === 'single') {
        // Single selection: replace any existing
        if (isSelected && !group.required) {
          return { ...prev, [group.group_name]: [] };
        }
        return { ...prev, [group.group_name]: [option] };
      } else {
        // Multiple selection: toggle
        if (isSelected) {
          return { ...prev, [group.group_name]: currentSelections.filter(v => v.id !== option.id) };
        }
        return { ...prev, [group.group_name]: [...currentSelections, option] };
      }
    });
  };

  // Check if option is selected
  const isOptionSelected = (groupName: string, optionId: string) => {
    return (groupSelections[groupName] || []).some(v => v.id === optionId);
  };

  // Get all selected variations flattened
  const getAllSelectedVariations = () => {
    return Object.values(groupSelections).flat();
  };

  // Check if all required groups have selections
  const hasRequiredSelections = () => {
    if (!selectedItem?.variation_groups) return true;
    return selectedItem.variation_groups.every((group: VariationGroup) => {
      if (!group.required) return true;
      return (groupSelections[group.group_name] || []).length > 0;
    });
  };

  // Build grouped variations for API
  const buildGroupedVariations = (): Record<string, string[]> => {
    const result: Record<string, string[]> = {};
    Object.entries(groupSelections).forEach(([groupName, options]) => {
      if (options.length > 0) {
        result[groupName] = options.map(opt => opt.name);
      }
    });
    return result;
  };

  // Add item to cart from customization modal
  const handleAddToCartFromModal = () => {
    if (!selectedItem) return;
    
    if (!hasRequiredSelections()) {
      Alert.alert('Required Options', 'Please select all required options');
      return;
    }

    const selectedVariations = getAllSelectedVariations();
    const basePrice = selectedItem.price;
    const variationPriceTotal = selectedVariations.reduce((sum, v) => sum + normalizePrice(v.price), 0);
    
    addItem({
      item_id: selectedItem.id,
      name: selectedItem.name,
      price: normalizePrice(basePrice) + variationPriceTotal,
      originalPrice: basePrice, // Keep original for API
      quantity: quantity,
      variations: selectedVariations.map(v => v.name),
      grouped_variations: buildGroupedVariations(),
      special_instructions: specialInstructions || undefined,
      image: selectedItem.image,
    });

    closeCustomizationModal();
  };

  // Direct add for items without variations
  const handleAddToCart = (item: any) => {
    // If item has variations, open modal
    if (item.variation_groups && item.variation_groups.length > 0) {
      openCustomizationModal(item);
      return;
    }
    
    // No variations - add directly
    addItem({
      item_id: item.id,
      name: item.name,
      price: item.price,
      originalPrice: item.price,
      quantity: 1,
      variations: [],
      grouped_variations: {},
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
          // Use original price for API (₹1 stays ₹1, not normalized to ₹0)
          price: item.originalPrice || item.price,
          quantity: item.quantity,
          variations: item.variations,
          // Pass grouped variations for POS API format
          grouped_variations: item.grouped_variations || {},
        })),
        total: getTotal(),
      };

      const response = await ordersAPI.createOrder(orderData);
      Alert.alert('Order Confirmed', `Order ID: ${response.id || response.pos_order_id}\nTable: ${selectedTable.table_no}`);
      clearCart();
      setSelectedTable(null);
    } catch (error: any) {
      console.error('Failed to place order:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to place order. Please try again.';
      Alert.alert('Order Failed', errorMessage);
    } finally {
      setPlacingOrder(false);
    }
  };

  const renderCategoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && { backgroundColor: colors.primary },
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
        <Text style={[styles.menuName, { color: colors.text }]}>{item.name}</Text>
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
            <Text style={[styles.menuPrice, { color: colors.primary }]}>₹{normalizePrice(item.price)}</Text>
          ) : (
            <Text style={styles.menuPrice}></Text>
          )}
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
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
        <Text style={[styles.cartItemName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        {normalizePrice(item.price) > 0 && (
          <Text style={[styles.cartItemPrice, { color: colors.primary }]}>₹{normalizePrice(item.price)}</Text>
        )}
      </View>
      <View style={styles.cartItemQuantity}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.item_id, item.quantity - 1)}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={[styles.quantityText, { color: colors.text }]}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.item_id, item.quantity + 1)}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Customization Modal
  const renderCustomizationModal = () => {
    if (!selectedItem) return null;

    const variationGroups: VariationGroup[] = selectedItem.variation_groups || [];
    const basePrice = normalizePrice(selectedItem.price);
    const variationTotal = getAllSelectedVariations().reduce((sum, v) => sum + normalizePrice(v.price), 0);
    const totalPrice = (basePrice + variationTotal) * quantity;

    return (
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={closeCustomizationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.customizationModal, { backgroundColor: colors.card }]}>
            {/* Header */}
            <View style={styles.customizationHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.customizationCategory}>{selectedItem.category_name || ''}</Text>
                <Text style={[styles.customizationTitle, { color: colors.text }]}>{selectedItem.name}</Text>
                {selectedItem.description && (
                  <Text style={styles.customizationDescription}>{selectedItem.description}</Text>
                )}
              </View>
              <TouchableOpacity onPress={closeCustomizationModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.customizationBody}>
              {/* Variation Groups */}
              {variationGroups.map((group, groupIndex) => (
                <View key={groupIndex} style={styles.variationGroup}>
                  <View style={styles.variationGroupHeader}>
                    <Text style={styles.variationGroupName}>{group.group_name}</Text>
                    <Text style={[
                      styles.variationGroupRequired,
                      { color: group.required ? colors.error : '#9CA3AF' }
                    ]}>
                      ({group.required ? 'Required' : 'Optional'})
                    </Text>
                    <Text style={styles.variationGroupType}>
                      • {group.type === 'single' ? 'Select one' : 'Select multiple'}
                    </Text>
                  </View>
                  <View style={styles.variationOptions}>
                    {group.options.map(option => (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.variationOption,
                          isOptionSelected(group.group_name, option.id) && {
                            backgroundColor: colors.primary,
                          }
                        ]}
                        onPress={() => handleVariationSelect(group, option)}
                      >
                        <Text style={[
                          styles.variationOptionText,
                          isOptionSelected(group.group_name, option.id) && { color: '#fff' }
                        ]}>
                          {option.name}
                        </Text>
                        {option.price > 0 && (
                          <Text style={[
                            styles.variationOptionPrice,
                            isOptionSelected(group.group_name, option.id) && { color: '#fff' }
                          ]}>
                            +₹{option.price}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              {/* Special Instructions */}
              <View style={styles.instructionsSection}>
                <Text style={styles.instructionsLabel}>
                  COOKING INSTRUCTIONS <Text style={{ color: '#9CA3AF' }}>(Optional)</Text>
                </Text>
                <TextInput
                  style={styles.instructionsInput}
                  placeholder="E.g., Less spicy, No onions..."
                  placeholderTextColor="#9CA3AF"
                  value={specialInstructions}
                  onChangeText={setSpecialInstructions}
                  multiline
                  maxLength={200}
                />
                <Text style={styles.instructionsCount}>{specialInstructions.length}/200</Text>
              </View>

              {/* Quantity */}
              <View style={styles.quantitySection}>
                <Text style={styles.quantityLabel}>Quantity</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityBtn}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Text style={styles.quantityBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.quantityValue, { color: colors.text }]}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityBtn}
                    onPress={() => setQuantity(quantity + 1)}
                  >
                    <Text style={styles.quantityBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.customizationFooter, { borderTopColor: colors.border }]}>
              {totalPrice > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={[styles.totalAmount, { color: colors.text }]}>₹{totalPrice.toFixed(2)}</Text>
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.addToCartButton,
                  { backgroundColor: hasRequiredSelections() ? colors.primary : '#9CA3AF' }
                ]}
                onPress={handleAddToCartFromModal}
                disabled={!hasRequiredSelections()}
              >
                <Text style={styles.addToCartButtonText}>
                  {hasRequiredSelections() ? 'Add to Cart' : 'Select Required Options'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderTableModal = () => (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={[styles.modalTitle, { color: colors.text }]}>Select Table</Text>
        <ScrollView style={styles.tableList}>
          <View style={styles.tableGrid}>
            {tables.slice(0, 20).map((table: Table) => (
              <TouchableOpacity
                key={table.id}
                style={[
                  styles.tableItem,
                  selectedTable?.id === table.id && { borderColor: colors.primary, backgroundColor: '#E0F2FE' },
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
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={styles.loadingText}>No menu data available. Please re-login.</Text>
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.error }]} onPress={logout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedCategoryName = categories.find((c: any) => c.id === selectedCategory)?.name || '';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sidebar */}
      <View style={[styles.sidebar, { backgroundColor: colors.card, borderRightColor: colors.border }]}>
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText, { color: colors.text }]}>HYATT</Text>
          <Text style={[styles.logoSubtext, { color: colors.text }]}>CENTRIC</Text>
        </View>
        <Text style={styles.sidebarTitle}>BREAKFAST BUFFET</Text>
        
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          style={styles.categoryList}
          showsVerticalScrollIndicator={false}
        />

        <View style={[styles.sidebarFooter, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.soundButton}>
            <Text style={styles.soundButtonText}>🔊 Sound On</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={[styles.logoutBtnText, { color: colors.error }]}>→ Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.categoryTitle, { color: colors.text }]}>{selectedCategoryName}</Text>
            <Text style={styles.categorySubtitle}>Select items to add to your order</Text>
          </View>
          {selectedTable && (
            <TouchableOpacity 
              style={[styles.tableIndicator, { backgroundColor: colors.primary }]}
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
      <View style={[styles.cartSidebar, { backgroundColor: colors.card, borderLeftColor: colors.border }]}>
        <Text style={[styles.cartTitle, { color: colors.text }]}>YOUR ORDER</Text>
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

        <View style={[styles.cartFooter, { borderTopColor: colors.border }]}>
          {getTotal() > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={[styles.totalAmount, { color: colors.primary }]}>₹{getTotal().toFixed(2)}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.orderButton, 
              { backgroundColor: colors.primary },
              cartItems.length === 0 && styles.orderButtonDisabled
            ]}
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

      {/* Customization Modal */}
      {renderCustomizationModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#6B7280',
  },
  logoutButton: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  
  // Sidebar
  sidebar: {
    width: isLargeScreen ? 200 : 160,
    borderRightWidth: 1,
    paddingTop: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: isLargeScreen ? 20 : 16,
    fontWeight: 'bold',
  },
  logoSubtext: {
    fontSize: isLargeScreen ? 14 : 12,
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
  },
  categorySubtitle: {
    fontSize: isLargeScreen ? 16 : 14,
    color: '#6B7280',
    marginTop: 4,
  },
  tableIndicator: {
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
  },
  addButton: {
    width: 36,
    height: 36,
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
    borderLeftWidth: 1,
    padding: 20,
  },
  cartTitle: {
    fontSize: isLargeScreen ? 20 : 18,
    fontWeight: 'bold',
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
  },
  cartItemPrice: {
    fontSize: 13,
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
  },
  cartFooter: {
    borderTopWidth: 1,
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
  },
  orderButton: {
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
