// Header Component
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const Header = ({ tableNumber, onTablePress, onLogoutPress, onMenuSettingsPress, onTimingPress }) => {
  return (
    <View style={styles.header}>
      <Image
        source={{
          uri: 'https://customer-assets.emergentagent.com/job_aba4da0b-91ee-4a40-b348-36daa43480a8/artifacts/zyial4es_piyush_hyatt_logo_1.png',
        }}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.rightSection}>
        {tableNumber && (
          <TouchableOpacity style={styles.tableIndicator} onPress={onTablePress}>
            <Text style={styles.tableLabel}>Table</Text>
            <Text style={styles.tableNumber}>{tableNumber}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.settingsButton} onPress={onMenuSettingsPress}>
          <Text style={styles.settingsIcon}>&#9881;</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsButton} onPress={onTimingPress}>
          <Text style={styles.settingsIcon}>&#128339;</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogoutPress}>
          <Text style={styles.logoutText}>&#8592;</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    width: 120,
    height: 40,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tableIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: `${colors.blueHero}15`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${colors.blueHero}30`,
    gap: spacing.xs,
  },
  tableLabel: {
    fontSize: 12,
    color: colors.blueHero,
    fontWeight: '500',
  },
  tableNumber: {
    fontSize: 14,
    color: colors.blueHero,
    fontWeight: 'bold',
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 18,
    color: colors.error,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 16,
  },
});

export default Header;
