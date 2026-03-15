// Admin Settings Screen - Menu ordering and visibility configuration
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, {
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAuth } from '../contexts/AuthContext';
import { useMenuSettings } from '../contexts/MenuSettingsContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const LOGO_URL =
  'https://customer-assets.emergentagent.com/job_aba4da0b-91ee-4a40-b348-36daa43480a8/artifacts/zyial4es_piyush_hyatt_logo_1.png';

// Single menu item row
const ItemRow = ({ item, isHidden, onToggleVisibility }) => (
  <View style={[styles.itemRow, isHidden && styles.hiddenRow]}>
    {item.image ? (
      <Image source={{ uri: item.image }} style={styles.itemImage} />
    ) : (
      <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
        <Text style={styles.placeholderText}>No img</Text>
      </View>
    )}
    <View style={styles.itemInfo}>
      <Text style={[styles.itemName, isHidden && styles.hiddenText]}>
        {item.name}
      </Text>
      {item.description ? (
        <Text style={styles.itemDesc} numberOfLines={1}>
          {item.description}
        </Text>
      ) : null}
    </View>
    <TouchableOpacity
      onPress={() => onToggleVisibility(item.id)}
      style={[styles.toggleBtn, isHidden ? styles.toggleBtnOff : styles.toggleBtnOn]}>
      <Text style={isHidden ? styles.toggleTextOff : styles.toggleTextOn}>
        {isHidden ? 'Hidden' : 'Visible'}
      </Text>
    </TouchableOpacity>
  </View>
);

// Category section with its items
const CategoryBlock = ({
  category,
  items,
  isHidden,
  isExpanded,
  hiddenItems,
  onToggleVisibility,
  onToggleExpand,
  onToggleItemVisibility,
  onReorderItems,
  drag,
  isActive,
}) => {
  const visibleCount = items.filter(i => !hiddenItems.includes(i.id)).length;

  return (
    <ScaleDecorator>
      <View style={[styles.categoryBlock, isActive && styles.categoryActive, isHidden && styles.hiddenRow]}>
        {/* Category Header */}
        <View style={styles.categoryHeader}>
          <TouchableOpacity onLongPress={drag} style={styles.dragHandle}>
            <Text style={styles.dragIcon}>☰</Text>
          </TouchableOpacity>

          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryName, isHidden && styles.hiddenText]}>
              {category.name}
            </Text>
            <Text style={styles.categoryCount}>
              {visibleCount}/{items.length} items
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => onToggleVisibility(category.id)}
            style={[styles.toggleBtn, isHidden ? styles.toggleBtnOff : styles.toggleBtnOn]}>
            <Text style={isHidden ? styles.toggleTextOff : styles.toggleTextOn}>
              {isHidden ? 'Hidden' : 'Visible'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onToggleExpand(category.id)}
            style={styles.expandBtn}>
            <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>
        </View>

        {/* Items List */}
        {isExpanded && (
          <View style={styles.itemsList}>
            {items.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                isHidden={hiddenItems.includes(item.id)}
                onToggleVisibility={onToggleItemVisibility}
              />
            ))}
          </View>
        )}
      </View>
    </ScaleDecorator>
  );
};

const AdminSettingsScreen = () => {
  const { menuData } = useAuth();
  const { settings, saveSettings, skipSettings, clearSettings } = useMenuSettings();

  // Initialize state — pre-load from saved settings if they exist
  const [categoryOrder, setCategoryOrder] = useState(() => {
    if (settings?.categoryOrder?.length) return settings.categoryOrder;
    return menuData.categories.map(c => c.id);
  });
  const [itemsByCategory, setItemsByCategory] = useState(() => {
    const grouped = {};
    menuData.categories.forEach(cat => {
      const items = menuData.menuItems.filter(item => item.category === cat.id);
      if (settings?.itemOrder?.[cat.id]) {
        const order = settings.itemOrder[cat.id];
        items.sort((a, b) => {
          const idxA = order.indexOf(a.id);
          const idxB = order.indexOf(b.id);
          if (idxA === -1 && idxB === -1) return 0;
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });
      }
      grouped[cat.id] = items;
    });
    return grouped;
  });
  const [hiddenCategories, setHiddenCategories] = useState(
    () => settings?.hiddenCategories || [],
  );
  const [hiddenItems, setHiddenItems] = useState(
    () => settings?.hiddenItems || [],
  );
  const [expandedCategories, setExpandedCategories] = useState(
    () => new Set(menuData.categories.map(c => c.id)),
  );

  const categoriesMap = useMemo(() => {
    const map = {};
    menuData.categories.forEach(c => {
      map[c.id] = c;
    });
    return map;
  }, [menuData.categories]);

  // Stats
  const totalItems = menuData.menuItems.length;
  const visibleItems =
    totalItems -
    hiddenItems.length -
    menuData.menuItems.filter(
      i => hiddenCategories.includes(i.category) && !hiddenItems.includes(i.id),
    ).length;

  // Handlers
  const toggleCategoryVisibility = catId => {
    setHiddenCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId],
    );
  };

  const toggleItemVisibility = itemId => {
    setHiddenItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId],
    );
  };

  const toggleExpand = catId => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handleReset = () => {
    setCategoryOrder(menuData.categories.map(c => c.id));
    const grouped = {};
    menuData.categories.forEach(cat => {
      grouped[cat.id] = menuData.menuItems.filter(item => item.category === cat.id);
    });
    setItemsByCategory(grouped);
    setHiddenCategories([]);
    setHiddenItems([]);
    setExpandedCategories(new Set(menuData.categories.map(c => c.id)));
    clearSettings();
  };

  const handleSave = () => {
    const itemOrder = {};
    Object.keys(itemsByCategory).forEach(catId => {
      itemOrder[catId] = itemsByCategory[catId].map(i => i.id);
    });
    saveSettings(categoryOrder, itemOrder, hiddenCategories, hiddenItems);
  };

  const handleSkip = () => {
    skipSettings();
  };

  // Build ordered data for DraggableFlatList
  const orderedCategories = categoryOrder
    .map(id => categoriesMap[id])
    .filter(Boolean);

  const onDragEnd = useCallback(({ data }) => {
    setCategoryOrder(data.map(c => c.id));
  }, []);

  const renderCategory = useCallback(
    ({ item: category, drag, isActive }) => (
      <CategoryBlock
        category={category}
        items={itemsByCategory[category.id] || []}
        isHidden={hiddenCategories.includes(category.id)}
        isExpanded={expandedCategories.has(category.id)}
        hiddenItems={hiddenItems}
        onToggleVisibility={toggleCategoryVisibility}
        onToggleExpand={toggleExpand}
        onToggleItemVisibility={toggleItemVisibility}
        onReorderItems={() => {}}
        drag={drag}
        isActive={isActive}
      />
    ),
    [itemsByCategory, hiddenCategories, expandedCategories, hiddenItems],
  );

  const keyExtractor = useCallback(item => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: LOGO_URL }} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={styles.headerTitle}>MENU SETTINGS</Text>
            <Text style={styles.headerSubtitle}>
              Long-press to reorder, toggle to show/hide
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipBtnText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save & Continue</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Body - Draggable Categories */}
      <DraggableFlatList
        data={orderedCategories}
        renderItem={renderCategory}
        keyExtractor={keyExtractor}
        onDragEnd={onDragEnd}
        containerStyle={styles.listContainer}
        contentContainerStyle={styles.listContent}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
          <Text style={styles.resetBtnText}>Reset to Default</Text>
        </TouchableOpacity>
        <Text style={styles.statsText}>
          {visibleItems} visible / {totalItems} total
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Save & Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.blueDark,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: colors.blueHero,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: spacing.base,
  },
  categoryBlock: {
    marginBottom: 12,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  categoryActive: {
    borderColor: colors.blueHero,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dragHandle: {
    padding: 4,
    marginRight: 8,
  },
  dragIcon: {
    fontSize: 18,
    color: colors.textMuted,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.blueDark,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  categoryCount: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  expandBtn: {
    padding: 8,
    marginLeft: 8,
  },
  expandIcon: {
    fontSize: 12,
    color: colors.textMuted,
  },
  itemsList: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: colors.background,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  hiddenRow: {
    opacity: 0.4,
  },
  hiddenText: {
    textDecorationLine: 'line-through',
  },
  itemImage: {
    width: 36,
    height: 36,
    borderRadius: 4,
    marginRight: 10,
  },
  itemImagePlaceholder: {
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 8,
    color: colors.textMuted,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.blueDark,
    textTransform: 'uppercase',
  },
  itemDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  toggleBtnOn: {
    backgroundColor: 'rgba(98, 181, 229, 0.1)',
  },
  toggleBtnOff: {
    backgroundColor: colors.muted,
  },
  toggleTextOn: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.blueHero,
  },
  toggleTextOff: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  resetBtn: {
    padding: 8,
  },
  resetBtnText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statsText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});

export default AdminSettingsScreen;
