// Main App Entry Point
import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Providers
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { MenuSettingsProvider } from './src/contexts/MenuSettingsContext';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Theme
import { colors } from './src/theme/colors';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const App = () => {

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
            <MenuSettingsProvider>
              <CartProvider>
                <StatusBar
                  barStyle="dark-content"
                  backgroundColor={colors.background}
                  hidden={true}
                />
                <AppNavigator />
                <Toast />
              </CartProvider>
            </MenuSettingsProvider>
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
