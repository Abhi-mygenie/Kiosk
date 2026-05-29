// Menu Item Card Component
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { normalizePrice } from '../utils/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.base * 2 - spacing.sm * 3) / 4;

const MenuItemCard = ({ item, onPress, cartQuantity = 0 }) => {
  const inCart = cartQuantity > 0;

  return (
    <TouchableOpacity
      style={[styles.card, inCart && styles.cardInCart]}
      onPress={onPress}
      testID={`menu-item-${item.id}`}
      activeOpacity={0.8}>
      {/* Cart quantity badge */}
      {inCart && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{cartQuantity}</Text>
        </View>
      )}

      {/* Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>

        {item.description && (
          <Text style={styles.description} numberOfLines={1}>
            {item.description}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.meta}>
            {item.calories > 0 && (
              <Text style={styles.metaText}>🔥 {item.calories}</Text>
            )}
            {item.portion_size && (
              <Text style={styles.metaText}>⚖️ {item.portion_size}</Text>
            )}
          </View>

          {/* Add button */}
          <TouchableOpacity style={styles.addButton} onPress={onPress}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardInCart: {
    borderColor: colors.blueHero,
    backgroundColor: `${colors.blueHero}08`,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.blueHero,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },
  imageContainer: {
    aspectRatio: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: spacing.xs,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.blueDark,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  meta: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
});

export default MenuItemCard;
