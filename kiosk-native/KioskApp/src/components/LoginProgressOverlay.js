// Login Progress Overlay
import React from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const LoginProgressOverlay = ({ loginProgress }) => {
  const steps = [
    { key: 'Authenticating', label: 'Authenticating' },
    { key: 'Loading Theme', label: 'Loading Theme' },
    { key: 'Loading Categories', label: 'Loading Categories' },
    { key: 'Loading Menu Items', label: 'Loading Menu Items' },
    { key: 'Loading Tables', label: 'Loading Tables' },
    { key: 'Finalizing', label: 'Finalizing Setup' },
  ];

  const getStepStatus = stepKey => {
    const step = loginProgress.steps.find(s => s.step === stepKey);
    return step?.status || 'pending';
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        {/* Logo */}
        <Image
          source={{
            uri: 'https://customer-assets.emergentagent.com/job_660831f3-d103-4fb3-ae20-d0fe3dd0af53/artifacts/4li3nr0o_hya.png',
          }}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Progress Card */}
        <View style={styles.card}>
          <Text style={styles.title}>SETTING UP KIOSK</Text>

          <View style={styles.stepsContainer}>
            {steps.map((step, index) => {
              const status = getStepStatus(step.key);
              const isActive = loginProgress.currentStep === step.key || status === 'loading';
              const isDone = status === 'done';

              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepIndicator}>
                    {isDone ? (
                      <View style={styles.checkCircle}>
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                    ) : isActive ? (
                      <ActivityIndicator size="small" color={colors.blueHero} />
                    ) : (
                      <View style={styles.pendingDot} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      isDone && styles.stepLabelDone,
                      isActive && styles.stepLabelActive,
                    ]}>
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Powered by */}
        <Image
          source={{
            uri: 'https://customer-assets.emergentagent.com/job_f69ca03e-7b5d-4a09-a9a8-bcdd3f3dcbc1/artifacts/c544c78k_mygenie_logo.svg',
          }}
          style={styles.footerLogo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  logo: {
    width: 180,
    height: 64,
    marginBottom: spacing['2xl'],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.xl,
    minWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.xl,
    color: colors.blueDark,
    letterSpacing: 2,
  },
  stepsContainer: {
    gap: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.blueHero,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  stepLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  stepLabelDone: {
    color: colors.blueHero,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: colors.blueDark,
    fontWeight: '500',
  },
  footerLogo: {
    width: 80,
    height: 32,
    marginTop: spacing['2xl'],
    opacity: 0.5,
  },
});

export default LoginProgressOverlay;
