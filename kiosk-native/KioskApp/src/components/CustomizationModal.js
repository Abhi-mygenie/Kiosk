// Customization Modal - Item variations and quantity
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { normalizePrice, formatCurrencyShort } from '../utils/helpers';

const CustomizationModal = ({ item, onClose, onAddToCart }) => {
  const [groupSelections, setGroupSelections] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const handleVariationSelect = (group, option) => {
    setGroupSelections(prev => {
      const currentSelections = prev[group.group_name] || [];
      const isSelected = currentSelections.find(v => v.id === option.id);

      if (group.type === 'single') {
        if (isSelected) {
          return group.required ? prev : { ...prev, [group.group_name]: [] };
        }
        return { ...prev, [group.group_name]: [option] };
      } else {
        if (isSelected) {
          return {
            ...prev,
            [group.group_name]: currentSelections.filter(v => v.id !== option.id),
          };
        }
        return { ...prev, [group.group_name]: [...currentSelections, option] };
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
    const variationTotal = getAllSelectedVariations().reduce(
      (sum, v) => sum + normalizePrice(v.price),
      0
    );
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

  const handleAdd = () => {
    const selectedVariations = getAllSelectedVariations();
    const basePrice = normalizePrice(item.price);
    const variationPriceTotal = selectedVariations.reduce(
      (sum, v) => sum + normalizePrice(v.price),
      0
    );

    onAddToCart({
      ...item,
      price: basePrice,
      variations: selectedVariations.map(v => v.name),
      variationDetails: selectedVariations,
      quantity,
      specialInstructions,
      totalPrice: basePrice + variationPriceTotal,
    });
    onClose();
  };

  return (
    <Modal visible={true} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.category}>{item.category_name || item.category}</Text>
              <Text style={styles.title}>{item.name}</Text>
              {item.description && (
                <Text style={styles.description}>{item.description}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Variation Groups */}
            {item.variation_groups?.map((group, index) => (
              <View key={index} style={styles.variationGroup}>
                <Text style={styles.groupTitle}>
                  {group.group_name}{' '}
                  <Text style={group.required ? styles.required : styles.optional}>
                    ({group.required ? 'Required' : 'Optional'})
                  </Text>
                </Text>
                <View style={styles.optionsGrid}>
                  {group.options.map(option => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.optionButton,
                        isOptionSelected(group.group_name, option.id) &&
                          styles.optionButtonSelected,
                      ]}
                      onPress={() => handleVariationSelect(group, option)}>
                      <Text
                        style={[
                          styles.optionText,
                          isOptionSelected(group.group_name, option.id) &&
                            styles.optionTextSelected,
                        ]}>
                        {option.name}
                      </Text>
                      {option.price > 0 && (
                        <Text
                          style={[
                            styles.optionPrice,
                            isOptionSelected(group.group_name, option.id) &&
                              styles.optionPriceSelected,
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
              <Text style={styles.groupTitle}>
                COOKING INSTRUCTIONS <Text style={styles.optional}>(Optional)</Text>
              </Text>
              <TextInput
                style={styles.instructionsInput}
                placeholder="E.g., Less spicy, No onions..."
                placeholderTextColor={colors.textMuted}
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                multiline
                maxLength={200}
                testID="special-instructions"
              />
            </View>

            {/* Quantity */}
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantity</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(quantity + 1)}>
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {calculateTotal() > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {formatCurrencyShort(calculateTotal())}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.addButton,
                !hasRequiredSelections() && styles.addButtonDisabled,
              ]}
              onPress={handleAdd}
              disabled={!hasRequiredSelections()}>
              <Text style={styles.addButtonText}>
                {hasRequiredSelections() ? 'Add to Cart' : 'Select Required Options'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  handle: {
    width: 48,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  category: {
    fontSize: 12,
    color: colors.blueHero,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '500',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.blueDark,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.base,
  },
  variationGroup: {
    marginBottom: spacing.lg,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  required: {
    color: colors.error,
    fontWeight: 'normal',
  },
  optional: {
    color: colors.textMuted,
    fontWeight: 'normal',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.muted,
    minWidth: '48%',
  },
  optionButtonSelected: {
    backgroundColor: colors.blueHero,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.white,
  },
  optionPrice: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  optionPriceSelected: {
    color: colors.white,
  },
  instructionsSection: {
    marginBottom: spacing.lg,
  },
  instructionsInput: {
    backgroundColor: colors.muted,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.textPrimary,
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.blueDark,
    minWidth: 40,
    textAlign: 'center',
  },
  footer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.blueDark,
  },
  addButton: {
    backgroundColor: colors.blueHero,
    borderRadius: 8,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: colors.border,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default CustomizationModal;
