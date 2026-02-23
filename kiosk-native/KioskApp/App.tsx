import React from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import LoginScreen from './src/screens/LoginScreen';
import KioskScreen from './src/screens/KioskScreen';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#177DAA" />
      </View>
    );
  }

  return isAuthenticated ? <KioskScreen /> : <LoginScreen />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#F9F8F6" />
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F8F6',
  },
});

export default App;
