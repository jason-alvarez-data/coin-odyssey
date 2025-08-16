// src/screens/collection/CollectionListScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../styles';
import { Card } from '../../components/common';

export default function CollectionListScreen() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient 
      colors={Colors.background.primary}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top }]}>
        <Text style={styles.title}>🪙 My Collection</Text>
        <Card style={styles.card}>
          <Text style={styles.cardText}>
            Collection management screen coming soon...
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
    paddingBottom: 120,
  },
  title: {
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