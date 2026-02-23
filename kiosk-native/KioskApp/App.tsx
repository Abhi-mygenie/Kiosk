import React from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import KioskScreen from './src/screens/KioskScreen';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return isAuthenticated ? <KioskScreen /> : <LoginScreen />;
};

// Wrapper that provides ThemeProvider inside AuthProvider
const ThemedApp: React.FC = () => {
  const { branding } = useAuth();
  
  return (
    <ThemeProvider>
      <CartProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#F9F8F6" />
        <AppContent />
      </CartProvider>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemedApp />
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
