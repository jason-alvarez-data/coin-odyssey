// src/components/dashboard/QuickActions.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';

interface ActionItem {
  icon: string;
  label: string;
}

interface QuickActionsProps {
  onActionPress: (action: string) => void;
}

const ACTIONS: ActionItem[] = [
  { icon: '➕', label: 'Add Coin' },
  { icon: '📊', label: 'View Analytics' },
  { icon: '🌍', label: 'Explore Map' },
];

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionPress }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        {ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.actionCardContainer}
            onPress={() => onActionPress(action.label)}
            accessibilityLabel={action.label}
            accessibilityRole="button"
            accessibilityHint={`Navigate to ${action.label}`}
          >
            <BlurView intensity={60} style={styles.actionCard}>
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>{action.icon}</Text>
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </BlurView>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionCardContainer: {
    flex: 1,
  },
  actionCard: {
    ...GlassmorphismStyles.card,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  actionIcon: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary.gold,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
});
