// src/screens/auth/SignUpScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '../../styles';
import { Card } from '../../components/common';

export default function SignUpScreen() {
  return (
    <LinearGradient 
      colors={Colors.background.primary}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>🪙</Text>
        <Text style={styles.appName}>Sign Up</Text>
        <Card style={styles.card}>
          <Text style={styles.cardText}>
            Registration screen coming soon...
          </Text>
        </Card>
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
    marginBottom: Spacing['2xl'],
  },
  card: {
    width: '100%',
  },
  cardText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.md,
    textAlign: 'center',
  },
});