// src/navigation/AppNavigator.tsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import { RootStackParamList } from '../types/navigation';
import { palette, fontFamily } from '../theme';
import { Logger } from '../services/logger';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  Logger.debug('AppNavigator render', {
    hasUser: !!user,
    userEmail: user?.email,
    loading
  });

  if (loading) {
    Logger.debug('AppNavigator: Still loading auth state');
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingTitle}>Coin Odyssey</Text>
        <ActivityIndicator size="large" color={palette.gold} style={styles.loadingSpinner} />
      </View>
    );
  }

  const navTheme = {
    ...DefaultTheme,
    dark: true,
    colors: {
      ...DefaultTheme.colors,
      background: palette.bg,
      card: palette.bg2,
      text: palette.fg,
      border: palette.line as string,
      primary: palette.gold,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          cardStyle: { backgroundColor: palette.bg },
        }}
      >
        {user ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.bg,
  },
  loadingTitle: {
    fontFamily: fontFamily.display,
    fontSize: 32,
    color: palette.gold,
    letterSpacing: -0.6,
    marginBottom: 24,
  },
  loadingSpinner: {
    marginTop: 8,
  },
});