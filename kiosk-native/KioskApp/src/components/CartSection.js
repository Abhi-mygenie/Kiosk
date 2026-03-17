// Cart Section Component
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { normalizePrice, formatCurrencyShort } from '../utils/helpers';

const CartSection = ({
  cart,
  totals,
  tableNumber,
  isPlacingOrder,
  hasTables,
  onRemoveItem,
  onUpdateQuantity,
  onPlaceOrder,
  onSelectTable,
  onEditInstructions,
}) => {
  const { subtotal, cgst, sgst, grandTotal } = totals;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>YOUR ORDER</Text>
        <Text style={styles.itemCount}>{cart.length} items</Text>
      </View>

      {/* Cart Items */}
      <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
        {cart.length === 0 ? (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>Ready to order?</Text>
            <Text style={styles.emptySubtitle}>Select items from the menu to begin</Text>
          </View>
        ) : (
          cart.map(item => (
            <View key={item.cartId} style={styles.cartItem}>
              <View style={styles.itemInfo}>
                <View style={styles.itemNameRow}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <TouchableOpacity
                    style={[styles.instructionsIcon, item.specialInstructions && styles.instructionsIconActive]}
                    onPress={() => onEditInstructions?.(item)}
                    testID={`edit-instructions-${item.cartId}`}
                  >
                    <Text style={[styles.instructionsIconText, item.specialInstructions && styles.instructionsIconTextActive]}>💬</Text>
                  </TouchableOpacity>
                </View>
                {item.variations?.length > 0 && (
                  <Text style={styles.itemVariations} numberOfLines={1}>
                    {item.variations.join(', ')}
                  </Text>
                )}
                {item.specialInstructions ? (
                  <Text style={styles.itemInstructions} numberOfLines={1}>
                    "{item.specialInstructions}"
                  </Text>
                ) : null}
              </View>

              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    if (item.quantity <= 1) {
                      onRemoveItem(item.cartId);
                    } else {
                      onUpdateQuantity(item.cartId, item.quantity - 1);
                    }
                  }}>
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>

                <Text style={styles.quantity}>{item.quantity}</Text>

                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => onUpdateQuantity(item.cartId, item.quantity + 1)}>
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              {normalizePrice(item.totalPrice || item.price) > 0 && (
                <Text style={styles.itemPrice}>
                  {formatCurrencyShort(
                    normalizePrice(item.totalPrice || item.price) * item.quantity
                  )}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Table indicator - only when restaurant has tables */}
        {hasTables && tableNumber ? (
          <View style={styles.tableRow}>
            <View style={styles.tableInfo}>
              <Text style={styles.tableLabel}>Table:</Text>
              <Text style={styles.tableNumber}>{tableNumber}</Text>
            </View>
            <TouchableOpacity onPress={onSelectTable}>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Totals */}
        {cart.length > 0 && grandTotal > 0 && (
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrencyShort(subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>CGST (2.5%)</Text>
              <Text style={styles.totalValue}>{formatCurrencyShort(cgst)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>SGST (2.5%)</Text>
              <Text style={styles.totalValue}>{formatCurrencyShort(sgst)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrencyShort(grandTotal)}</Text>
            </View>
          </View>
        )}

        {/* Place Order Button */}
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            (cart.length === 0 || isPlacingOrder) && styles.placeOrderButtonDisabled,
          ]}
          onPress={() => {
            if (hasTables && !tableNumber && cart.length > 0) {
              onSelectTable();
            } else {
              onPlaceOrder();
            }
          }}
          disabled={cart.length === 0 || isPlacingOrder}
          testID="place-order-button">
          {isPlacingOrder ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.placeOrderText}>
              {cart.length === 0
                ? 'Add items'
                : hasTables && !tableNumber
                ? 'Select Table'
                : grandTotal > 0
                ? `Place Order • ${formatCurrencyShort(grandTotal)}`
                : 'Place Order'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 300,
    backgroundColor: colors.white,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  header: {
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.blueDark,
    textTransform: 'uppercase',
  },
  itemCount: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemsContainer: {
    flex: 1,
    padding: spacing.base,
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyIcon: {
    fontSize: 40,
    opacity: 0.3,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.blueLight}15`,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.blueLight}30`,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.blueDark,
    flex: 1,
  },
  instructionsIcon: {
    padding: 2,
    borderRadius: 4,
  },
  instructionsIconActive: {
    backgroundColor: `${colors.blueHero}15`,
  },
  instructionsIconText: {
    fontSize: 12,
    opacity: 0.4,
  },
  instructionsIconTextActive: {
    opacity: 1,
  },
  itemVariations: {
    fontSize: 11,
    color: colors.blueMedium,
    marginTop: 2,
  },
  itemInstructions: {
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  quantity: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 20,
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.blueDark,
    marginLeft: spacing.sm,
  },
  footer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tableInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tableLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  tableNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.blueDark,
  },
  changeText: {
    fontSize: 12,
    color: colors.blueHero,
    textDecorationLine: 'underline',
  },
  totals: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  totalValue: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.blueDark,
  },
  placeOrderButton: {
    backgroundColor: colors.blueHero,
    borderRadius: 8,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  placeOrderButtonDisabled: {
    backgroundColor: colors.muted,
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default CartSection;
