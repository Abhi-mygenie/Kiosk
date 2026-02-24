import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const isLargeScreen = width > 1200;

// Loading step item component
const LoadingStepItem: React.FC<{
  label: string;
  status: 'pending' | 'loading' | 'done';
  colors: any;
}> = ({ label, status, colors }) => {
  return (
    <View style={styles.stepItem}>
      <View style={styles.stepIconContainer}>
        {status === 'done' ? (
          <View style={[styles.stepIconDone, { backgroundColor: colors.primary }]}>
            <Text style={styles.stepIconCheck}>✓</Text>
          </View>
        ) : status === 'loading' ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <View style={styles.stepIconPending} />
        )}
      </View>
      <Text style={[
        styles.stepLabel,
        status === 'done' && { color: colors.primary },
        status === 'loading' && { color: colors.text, fontWeight: '600' },
      ]}>
        {label}
      </Text>
    </View>
  );
};

// Loading Overlay Component
const LoadingOverlay: React.FC<{
  loginProgress: any;
  colors: any;
}> = ({ loginProgress, colors }) => {
  const steps = [
    { key: 'Authenticating', label: 'Authenticating' },
    { key: 'Loading Theme', label: 'Loading Theme' },
    { key: 'Loading Categories', label: 'Loading Categories' },
    { key: 'Loading Menu Items', label: 'Loading Menu Items' },
    { key: 'Loading Tables', label: 'Loading Tables' },
    { key: 'Finalizing', label: 'Finalizing Setup' },
  ];

  const getStepStatus = (stepKey: string): 'pending' | 'loading' | 'done' => {
    const step = loginProgress.steps.find((s: any) => s.step === stepKey);
    return step?.status || 'pending';
  };

  return (
    <Modal visible={loginProgress.isLoggingIn} transparent animationType="fade">
      <View style={[styles.overlayContainer, { backgroundColor: colors.background }]}>
        <View style={styles.overlayContent}>
          {/* Logo */}
          <View style={styles.overlayLogoBox}>
            <Text style={styles.overlayLogoText}>HYATT</Text>
            <Text style={styles.overlayLogoSubtext}>CENTRIC</Text>
          </View>

          {/* Progress Card */}
          <View style={styles.overlayCard}>
            <Text style={[styles.overlayTitle, { color: colors.text }]}>
              SETTING UP KIOSK
            </Text>

            <View style={styles.stepsContainer}>
              {steps.map((step) => (
                <LoadingStepItem
                  key={step.key}
                  label={step.label}
                  status={getStepStatus(step.key)}
                  colors={colors}
                />
              ))}
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.overlayFooter}>mygenie</Text>
        </View>
      </View>
    </Modal>
  );
};

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, loginProgress } = useAuth();
  const { colors } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error?.response?.data?.detail || 'Invalid email or password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Loading Overlay */}
      <LoadingOverlay loginProgress={loginProgress} colors={colors} />

      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Text style={[styles.logoText, { color: colors.text }]}>HYATT</Text>
              <Text style={[styles.logoSubtext, { color: colors.text }]}>CENTRIC</Text>
            </View>
            <Text style={styles.kioskTitle}>SELF-ORDERING KIOSK</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={[styles.welcomeText, { color: colors.text }]}>WELCOME BACK</Text>

            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.primary }]}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your username"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.primary }]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[
                styles.signInButton, 
                { backgroundColor: colors.primary },
                loading && styles.signInButtonDisabled
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.signInIcon}>→</Text>
                  <Text style={styles.signInText}>Sign In</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.success }]}>mygenie</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoText: {
    fontSize: isLargeScreen ? 32 : 24,
    fontWeight: 'bold',
  },
  logoSubtext: {
    fontSize: isLargeScreen ? 24 : 18,
  },
  kioskTitle: {
    marginTop: 16,
    fontSize: isLargeScreen ? 18 : 14,
    letterSpacing: 4,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: isLargeScreen ? 48 : 32,
    width: isLargeScreen ? 500 : '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  welcomeText: {
    fontSize: isLargeScreen ? 28 : 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: isLargeScreen ? 16 : 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  inputIcon: {
    paddingLeft: 16,
    fontSize: 18,
  },
  input: {
    flex: 1,
    padding: isLargeScreen ? 16 : 14,
    fontSize: isLargeScreen ? 18 : 16,
  },
  eyeButton: {
    padding: 16,
  },
  eyeIcon: {
    fontSize: 18,
  },
  signInButton: {
    borderRadius: 8,
    padding: isLargeScreen ? 18 : 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInIcon: {
    color: '#fff',
    fontSize: 20,
    marginRight: 8,
  },
  signInText: {
    color: '#fff',
    fontSize: isLargeScreen ? 20 : 18,
    fontWeight: '600',
  },
  footer: {
    marginTop: 40,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '500',
  },

  // Loading Overlay Styles
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    alignItems: 'center',
  },
  overlayLogoBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overlayLogoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  overlayLogoSubtext: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  overlayCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    minWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  stepsContainer: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepIconDone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconCheck: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepIconPending: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  stepLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  overlayFooter: {
    marginTop: 32,
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
    opacity: 0.5,
  },
});

export default LoginScreen;
