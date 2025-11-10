// src/components/dashboard/StatsGrid.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';

interface StatCardData {
  value: string;
  label: string;
  icon: string;
}

interface StatsGridProps {
  totalCoins: number;
  totalValue: number;
  uniqueCountries: number;
  yearSpan: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  totalCoins,
  totalValue,
  uniqueCountries,
  yearSpan,
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats: StatCardData[][] = [
    [
      {
        value: totalCoins.toLocaleString(),
        label: 'Total Coins',
        icon: '🪙',
      },
      {
        value: formatCurrency(totalValue),
        label: 'Collection Value',
        icon: '💰',
      },
    ],
    [
      {
        value: uniqueCountries.toString(),
        label: 'Countries',
        icon: '🌍',
      },
      {
        value: yearSpan,
        label: 'Year Span',
        icon: '📅',
      },
    ],
  ];

  return (
    <View style={styles.statsGrid}>
      {stats.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.statsRow}>
          {row.map((stat) => (
            <BlurView
              key={stat.label}
              intensity={60}
              style={styles.statCard}
              accessible={true}
              accessibilityLabel={`${stat.label}: ${stat.value}`}
              accessibilityRole="summary"
            >
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </BlurView>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  statsGrid: {
    marginBottom: Spacing['2xl'],
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    ...GlassmorphismStyles.card,
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
});
