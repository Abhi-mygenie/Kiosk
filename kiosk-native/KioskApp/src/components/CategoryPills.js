// Category Pills Component
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const CategoryPills = ({ categories, activeCategory, onCategoryPress }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* ALL pill */}
        <TouchableOpacity
          style={[styles.pill, activeCategory === 'all' && styles.pillActive]}
          onPress={() => onCategoryPress('all')}
          testID="category-pill-all">
          <Text style={[styles.pillText, activeCategory === 'all' && styles.pillTextActive]}>
            ALL
          </Text>
        </TouchableOpacity>

        {/* Category pills */}
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[styles.pill, activeCategory === category.id && styles.pillActive]}
            onPress={() => onCategoryPress(category.id)}
            testID={`category-pill-${category.id}`}>
            <Text
              style={[
                styles.pillText,
                activeCategory === category.id && styles.pillTextActive,
              ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.muted,
    marginRight: spacing.sm,
  },
  pillActive: {
    backgroundColor: colors.blueHero,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillTextActive: {
    color: colors.white,
  },
});

export default CategoryPills;
