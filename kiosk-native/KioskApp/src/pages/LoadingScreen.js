// Loading Screen - Shown while checking auth
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { colors } from '../theme/colors';

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: 'https://customer-assets.emergentagent.com/job_aba4da0b-91ee-4a40-b348-36daa43480a8/artifacts/zyial4es_piyush_hyatt_logo_1.png',
        }}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color={colors.blueHero} style={styles.spinner} />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: 32,
  },
  spinner: {
    marginBottom: 16,
  },
  text: {
    fontSize: 18,
    color: colors.textSecondary,
  },
});

export default LoadingScreen;
