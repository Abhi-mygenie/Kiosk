// Navigation Configuration
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { useMenuSettings } from '../contexts/MenuSettingsContext';

// Screens
import LoginScreen from '../pages/LoginScreen';
import KioskScreen from '../pages/KioskScreen';
import AdminSettingsScreen from '../pages/AdminSettingsScreen';
import TimingSettingsScreen from '../pages/TimingSettingsScreen';
import LoadingScreen from '../pages/LoadingScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { settingsComplete } = useMenuSettings();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !settingsComplete ? (
          <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
        ) : (
          <>
            <Stack.Screen name="Kiosk" component={KioskScreen} />
            <Stack.Screen name="MenuSettings" component={AdminSettingsScreen} />
            <Stack.Screen name="TimingSettings" component={TimingSettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
