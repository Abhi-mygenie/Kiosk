// Main App Entry Point
import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SplashScreen from 'react-native-splash-screen';

// Providers
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import { ThemeProvider } from './src/contexts/ThemeContext';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Theme
import { colors } from './src/theme/colors';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const App = () => {
  useEffect(() => {
    // Hide splash screen after app is ready
    const timer = setTimeout(() => {
      SplashScreen.hide();
    }, 1000); // 1 second delay for smooth transition

    return () => clearTimeout(timer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
            <CartProvider>
              <StatusBar
                barStyle="dark-content"
                backgroundColor={colors.background}
                hidden={true}
              />
              <AppNavigator />
              <Toast />
            </CartProvider>
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
