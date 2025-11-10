// src/navigation/LazyScreens.tsx
/**
 * Lazy-loaded screen components for code splitting
 * Reduces initial bundle size and improves app startup time
 */

import React, { Suspense, ComponentType } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Colors, Typography, Spacing } from '../styles';

/**
 * Loading fallback component shown while lazy components load
 */
const LoadingFallback: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={Colors.primary.gold} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

/**
 * Higher-order component that wraps lazy-loaded screens with Suspense
 * @param LazyComponent - The lazy-loaded component
 * @param fallbackMessage - Optional loading message
 */
export function withLazySuspense<P extends object>(
  LazyComponent: React.LazyExoticComponent<ComponentType<P>>,
  fallbackMessage?: string
): ComponentType<P> {
  return (props: P) => (
    <Suspense fallback={<LoadingFallback message={fallbackMessage} />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// Lazy load screens that aren't needed immediately
// These will be bundled separately and loaded on demand

/**
 * Dashboard screens - Loaded immediately on app start
 */
export const DashboardScreen = React.lazy(
  () => import('../screens/dashboard/DashboardScreen')
);

/**
 * Collection screens - Loaded when user navigates to collection
 */
export const CollectionListScreen = React.lazy(
  () => import('../screens/collection/CollectionListScreen')
);

export const AddCoinScreen = React.lazy(
  () => import('../screens/collection/AddCoinScreen')
);

export const CoinDetailScreen = React.lazy(
  () => import('../screens/collection/CoinDetailScreen')
);

export const EditCoinScreen = React.lazy(
  () => import('../screens/collection/EditCoinScreen')
);

/**
 * Analytics screens - Loaded when user navigates to analytics
 */
export const AnalyticsScreen = React.lazy(
  () => import('../screens/analytics/AnalyticsScreen')
);

/**
 * Profile screens - Loaded when user navigates to profile
 */
export const ProfileScreen = React.lazy(
  () => import('../screens/profile/ProfileScreen')
);

/**
 * Camera screens - Loaded when user needs camera
 */
export const CameraScreen = React.lazy(
  () => import('../screens/camera/CameraScreen')
);

/**
 * Map screen - Loaded when user navigates to map
 */
export const MapScreen = React.lazy(
  () => import('../screens/MapScreen')
);

/**
 * Auth screens - Critical path, but can be lazy loaded
 * since they're only needed once
 */
export const SignInScreen = React.lazy(
  () => import('../screens/auth/SignInScreen')
);

export const SignUpScreen = React.lazy(
  () => import('../screens/auth/SignUpScreen')
);

export const ForgotPasswordScreen = React.lazy(
  () => import('../screens/auth/ForgotPasswordScreen')
);

// Wrapped versions with Suspense for easy usage
export const LazyDashboardScreen = withLazySuspense(DashboardScreen, 'Loading Dashboard...');
export const LazyCollectionListScreen = withLazySuspense(CollectionListScreen, 'Loading Collection...');
export const LazyAddCoinScreen = withLazySuspense(AddCoinScreen, 'Loading Form...');
export const LazyCoinDetailScreen = withLazySuspense(CoinDetailScreen, 'Loading Coin Details...');
export const LazyEditCoinScreen = withLazySuspense(EditCoinScreen, 'Loading Editor...');
export const LazyAnalyticsScreen = withLazySuspense(AnalyticsScreen, 'Loading Analytics...');
export const LazyProfileScreen = withLazySuspense(ProfileScreen, 'Loading Profile...');
export const LazyCameraScreen = withLazySuspense(CameraScreen, 'Loading Camera...');
export const LazyMapScreen = withLazySuspense(MapScreen, 'Loading Map...');
export const LazySignInScreen = withLazySuspense(SignInScreen, 'Loading...');
export const LazySignUpScreen = withLazySuspense(SignUpScreen, 'Loading...');
export const LazyForgotPasswordScreen = withLazySuspense(ForgotPasswordScreen, 'Loading...');

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary[0],
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
