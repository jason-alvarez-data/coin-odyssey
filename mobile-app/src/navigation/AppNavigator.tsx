// src/navigation/AppNavigator.tsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import { RootStackParamList } from '../types/navigation';
import { Colors, Typography, Spacing } from '../styles';
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
      <LinearGradient colors={Colors.background.primary} style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>🪙</Text>
        <Text style={styles.loadingTitle}>Coin Odyssey</Text>
        <ActivityIndicator size="large" color={Colors.primary.gold} style={styles.loadingSpinner} />
      </LinearGradient>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          cardStyle: { backgroundColor: 'transparent' },
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
  },
  loadingEmoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  loadingTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.xl,
  },
  loadingSpinner: {
    marginTop: Spacing.lg,
  },
});