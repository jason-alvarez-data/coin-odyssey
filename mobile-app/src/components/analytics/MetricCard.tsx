// src/components/analytics/MetricCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  change?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  change,
  onPress,
  size = 'medium'
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      // Format large numbers with appropriate suffixes
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      } else {
        return val.toLocaleString();
      }
    }
    return val;
  };

  return (
    <CardComponent
      style={[
        styles.container,
        size === 'small' && styles.smallContainer,
        size === 'large' && styles.largeContainer,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <BlurView intensity={60} style={[styles.card, size === 'large' && styles.largeCard]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            {icon && <Text style={styles.icon}>{icon}</Text>}
            <Text 
              style={[styles.title, size === 'small' && styles.smallTitle]}
              numberOfLines={1}
              adjustsFontSizeToFit={size === 'small'}
              minimumFontScale={0.8}
            >
              {title}
            </Text>
          </View>
          {onPress && (
            <Text style={styles.chevron}>›</Text>
          )}
        </View>

        {/* Main Value */}
        <Text style={[
          styles.value,
          size === 'small' && styles.smallValue,
          size === 'large' && styles.largeValue,
        ]}>
          {formatValue(value)}
        </Text>

        {/* Subtitle */}
        {subtitle && (
          <Text style={[styles.subtitle, size === 'small' && styles.smallSubtitle]}>
            {subtitle}
          </Text>
        )}

        {/* Change Indicator */}
        {change && (
          <View style={styles.changeContainer}>
            <View style={[
              styles.changeIndicator,
              change.isPositive ? styles.positiveChange : styles.negativeChange
            ]}>
              <Text style={styles.changeIcon}>
                {change.isPositive ? '↗' : '↘'}
              </Text>
              <Text style={styles.changeText}>
                {Math.abs(change.value).toFixed(1)}%
              </Text>
            </View>
            <Text style={styles.changePeriod}>{change.period}</Text>
          </View>
        )}
      </BlurView>
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: '45%',
    marginBottom: Spacing.md,
  },
  smallContainer: {
    flex: 1,
    minWidth: '31%',
  },
  largeContainer: {
    minWidth: '100%',
  },
  card: {
    ...GlassmorphismStyles.card,
    padding: Spacing.lg,
    height: 120,
    justifyContent: 'space-between',
  },
  largeCard: {
    height: 140,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
  },
  smallTitle: {
    fontSize: Typography.fontSize.xs,
  },
  chevron: {
    fontSize: 18,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.bold,
  },
  value: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginVertical: Spacing.xs,
  },
  smallValue: {
    fontSize: Typography.fontSize.lg,
  },
  largeValue: {
    fontSize: Typography.fontSize['2xl'],
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.medium,
  },
  smallSubtitle: {
    fontSize: 10,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  positiveChange: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  negativeChange: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  changeIcon: {
    fontSize: Typography.fontSize.sm,
    marginRight: Spacing.xs,
    color: Colors.text.primary,
  },
  changeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  changePeriod: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
});