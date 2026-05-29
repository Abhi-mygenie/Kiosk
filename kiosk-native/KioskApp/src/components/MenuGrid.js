import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import MenuItemCard from './MenuItemCard';
import { spacing } from '../theme/spacing';

const MenuGrid = ({ items, cart, onSelectItem }) => {
  const getCartQuantity = (itemId) =>
    cart.filter(ci => ci.id === itemId).reduce((sum, ci) => sum + ci.quantity, 0);

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => (
        <MenuItemCard
          item={item}
          onPress={() => onSelectItem(item)}
          cartQuantity={getCartQuantity(item.id)}
        />
      )}
      keyExtractor={item => item.id}
      numColumns={5}
      columnWrapperStyle={styles.grid}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    padding: spacing.base,
  },
  grid: {
    justifyContent: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
});

export default MenuGrid;
