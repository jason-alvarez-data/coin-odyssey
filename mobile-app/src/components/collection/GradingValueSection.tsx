// src/components/collection/GradingValueSection.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';
import { Input } from '../common';

interface GradingValueSectionProps {
  formData: {
    grade: string;
    faceValue: string;
    purchasePrice: string;
    purchaseDate: string;
  };
  onFieldChange: (field: string, value: string) => void;
}

export const GradingValueSection: React.FC<GradingValueSectionProps> = ({
  formData,
  onFieldChange,
}) => {
  return (
    <BlurView intensity={60} style={styles.formSection}>
      <Text style={styles.sectionTitle}>💎 Grading & Value</Text>

      <Input
        label="Grade"
        placeholder="MS-64, AU-50, etc."
        value={formData.grade}
        onChangeText={(value) => onFieldChange('grade', value)}
        style={styles.input}
        accessibilityLabel="Coin grade"
        accessibilityHint="Enter the professional grading like MS-64 or AU-50"
      />

      <View style={styles.gridRow}>
        <View style={styles.gridInput}>
          <Input
            label="Face Value"
            placeholder="1.00"
            value={formData.faceValue}
            onChangeText={(value) => onFieldChange('faceValue', value)}
            keyboardType="numeric"
            accessibilityLabel="Face value of the coin"
          />
        </View>

        <View style={styles.gridInput}>
          <Input
            label="Purchase Price"
            placeholder="45.00"
            value={formData.purchasePrice}
            onChangeText={(value) => onFieldChange('purchasePrice', value)}
            keyboardType="numeric"
            accessibilityLabel="Amount paid for the coin"
          />
        </View>
      </View>

      <Input
        label="Purchase Date"
        placeholder="YYYY-MM-DD"
        value={formData.purchaseDate}
        onChangeText={(value) => onFieldChange('purchaseDate', value)}
        style={styles.input}
        accessibilityLabel="Date of purchase"
        accessibilityHint="Enter date in year-month-day format"
      />
    </BlurView>
  );
};

const styles = StyleSheet.create({
  formSection: {
    ...GlassmorphismStyles.card,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  input: {
    marginBottom: Spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  gridInput: {
    flex: 1,
  },
});
