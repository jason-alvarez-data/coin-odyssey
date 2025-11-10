// src/components/collection/NotesSection.tsx
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';
import { Input } from '../common';

interface NotesSectionProps {
  notes: string;
  onNotesChange: (value: string) => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({
  notes,
  onNotesChange,
}) => {
  return (
    <BlurView intensity={60} style={styles.formSection}>
      <Text style={styles.sectionTitle}>📝 Notes</Text>

      <Input
        label="Additional Notes"
        placeholder="Any special details, history, or observations..."
        value={notes}
        onChangeText={onNotesChange}
        multiline
        numberOfLines={4}
        style={styles.input}
        accessibilityLabel="Additional notes about the coin"
        accessibilityHint="Enter any special details or observations"
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
});
