// Success Overlay - Order confirmation
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const SuccessOverlay = ({ orderId, tableNumber, onNewOrder, prepTime }) => {
  const [countdown, setCountdown] = useState(15);
  const tokenNumber = orderId ? String(orderId).slice(-3) : '---';

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onNewOrder();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onNewOrder]);

  return (
    <Modal visible={true} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>✓</Text>
          </View>

          <Text style={styles.title}>ORDER CONFIRMED!</Text>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>
              We are <Text style={styles.preparingText}>Preparing</Text> your order
            </Text>
            {prepTime && (
              <Text style={styles.prepTimeText}>Estimated prep time: ~{prepTime} minutes</Text>
            )}
            {tableNumber ? (
              <Text style={styles.infoSubtitle}>
                Please proceed to <Text style={styles.highlightText}>Table {tableNumber}</Text>
              </Text>
            ) : (
              <Text style={styles.infoSubtitle} testID="token-number">
                Your token number: <Text style={styles.tokenText}>{tokenNumber}</Text>
              </Text>
            )}
          </View>

          {/* Countdown */}
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownLabel}>Redirecting in</Text>
            <Text style={styles.countdownValue}>{countdown}</Text>
          </View>

          {/* New Order Button */}
          <TouchableOpacity style={styles.newOrderButton} onPress={onNewOrder}>
            <Text style={styles.newOrderButtonText}>Start New Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: `${colors.white}F5`,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.blueMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  icon: {
    fontSize: 50,
    color: colors.white,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.blueDark,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.xl,
  },
  infoBox: {
    backgroundColor: `${colors.blueLight}20`,
    borderWidth: 1,
    borderColor: `${colors.blueHero}30`,
    borderRadius: 8,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  preparingText: {
    color: colors.blueHero,
    fontWeight: 'bold',
  },
  prepTimeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.blueHero,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  infoSubtitle: {
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    textAlign: 'center',
    fontWeight: '500',
  },
  highlightText: {
    color: colors.blueHero,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tokenText: {
    color: colors.blueHero,
    fontWeight: 'bold',
    fontSize: 24,
  },
  countdownContainer: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  countdownLabel: {
    fontSize: 16,
    color: colors.textMuted,
  },
  countdownValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.blueHero,
  },
  newOrderButton: {
    backgroundColor: colors.blueHero,
    borderRadius: 8,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing['2xl'],
  },
  newOrderButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
});

export default SuccessOverlay;
