// src/components/common/Card.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, GlassmorphismStyles, Spacing } from '../../styles';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'premium' | 'blur';
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
  blurIntensity?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  padding = 'medium',
  blurIntensity = 60,
}) => {
  const paddingStyle = styles[`padding_${padding}`];

  if (variant === 'blur') {
    return (
      <BlurView 
        intensity={blurIntensity} 
        style={[GlassmorphismStyles.card, paddingStyle, style]}
      >
        {children}
      </BlurView>
    );
  }

  const cardStyle = [
    variant === 'premium' ? GlassmorphismStyles.premiumCard : GlassmorphismStyles.card,
    paddingStyle,
    style,
  ];

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  padding_none: {
    padding: 0,
  },
  padding_small: {
    padding: Spacing.sm,
  },
  padding_medium: {
    padding: Spacing.lg,
  },
  padding_large: {
    padding: Spacing.xl,
  },
});