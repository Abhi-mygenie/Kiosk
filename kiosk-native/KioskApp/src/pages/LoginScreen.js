// Login Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import LoginProgressOverlay from '../components/LoginProgressOverlay';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginProgress } = useAuth();

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(username, password);
      // Navigation happens automatically via AuthContext
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading Overlay */}
      {loginProgress.isLoggingIn && <LoginProgressOverlay loginProgress={loginProgress} />}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={{
                uri: 'https://customer-assets.emergentagent.com/job_660831f3-d103-4fb3-ae20-d0fe3dd0af53/artifacts/4li3nr0o_hya.png',
              }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>SELF-ORDERING KIOSK</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.title}>WELCOME BACK</Text>

            {/* Username Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your username"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="login-username"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="login-password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}>
                  <Text style={styles.eyeText}>{showPassword ? '○' : '●'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              testID="login-submit">
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Image
              source={{
                uri: 'https://customer-assets.emergentagent.com/job_f69ca03e-7b5d-4a09-a9a8-bcdd3f3dcbc1/artifacts/c544c78k_mygenie_logo.svg',
              }}
              style={styles.footerLogo}
              resizeMode="contain"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.base,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: spacing.base,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 4,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.xl,
    color: colors.blueDark,
    letterSpacing: 2,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.sm,
    color: colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.muted,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  eyeButton: {
    padding: spacing.md,
  },
  eyeText: {
    fontSize: 18,
    color: colors.textMuted,
  },
  button: {
    backgroundColor: colors.blueHero,
    borderRadius: 8,
    paddingVertical: spacing.base,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing['2xl'],
  },
  footerLogo: {
    width: 100,
    height: 32,
    opacity: 0.6,
  },
});

export default LoginScreen;
