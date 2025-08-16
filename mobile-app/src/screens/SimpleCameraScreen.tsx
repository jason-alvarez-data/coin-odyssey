// src/screens/SimpleCameraScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '../styles';

export default function SimpleCameraScreen() {
  return (
    <LinearGradient 
      colors={Colors.background.primary}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>📸</Text>
        <Text style={styles.appName}>Camera</Text>
        <Text style={styles.subtitle}>Professional coin photography</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['4xl'],
  },
  title: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  appName: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});