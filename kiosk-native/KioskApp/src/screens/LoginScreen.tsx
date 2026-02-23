import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');
const isLargeScreen = width > 1200;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>HYATT</Text>
            <Text style={styles.logoSubtext}>CENTRIC</Text>
          </View>
          <Text style={styles.kioskTitle}>SELF-ORDERING KIOSK</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.welcomeText}>WELCOME BACK</Text>

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
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
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
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
            style={[styles.signInButton, loading && styles.signInButtonDisabled]}
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
          <Text style={styles.footerText}>mygenie</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F8F6',
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
    color: '#1a1a1a',
  },
  logoSubtext: {
    fontSize: isLargeScreen ? 24 : 18,
    color: '#1a1a1a',
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
    color: '#1a1a1a',
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
    borderColor: '#177DAA',
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
    color: '#1a1a1a',
  },
  eyeButton: {
    padding: 16,
  },
  eyeIcon: {
    fontSize: 18,
  },
  signInButton: {
    backgroundColor: '#177DAA',
    borderRadius: 8,
    padding: isLargeScreen ? 18 : 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  signInButtonDisabled: {
    backgroundColor: '#93C5DA',
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
    color: '#10B981',
    fontWeight: '500',
  },
});

export default LoginScreen;
