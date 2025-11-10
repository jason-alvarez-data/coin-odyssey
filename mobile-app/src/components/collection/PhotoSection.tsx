// src/components/collection/PhotoSection.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';

interface PhotoSectionProps {
  obverseImage: string | null;
  reverseImage: string | null;
  onTakePicture: (side: 'obverse' | 'reverse') => void;
}

export const PhotoSection: React.FC<PhotoSectionProps> = ({
  obverseImage,
  reverseImage,
  onTakePicture,
}) => {
  return (
    <BlurView intensity={60} style={styles.photoSection}>
      <Text style={styles.sectionTitle}>📸 Coin Photos</Text>
      <View style={styles.photoGrid}>
        <TouchableOpacity
          style={styles.photoCard}
          onPress={() => onTakePicture('obverse')}
          accessibilityLabel="Take photo of coin obverse"
          accessibilityRole="button"
          accessibilityHint="Opens camera to photograph the front of the coin"
        >
          {obverseImage ? (
            <Image source={{ uri: obverseImage }} style={styles.coinImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>📷</Text>
              <Text style={styles.photoLabel}>Obverse</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.photoCard}
          onPress={() => onTakePicture('reverse')}
          accessibilityLabel="Take photo of coin reverse"
          accessibilityRole="button"
          accessibilityHint="Opens camera to photograph the back of the coin"
        >
          {reverseImage ? (
            <Image source={{ uri: reverseImage }} style={styles.coinImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>📷</Text>
              <Text style={styles.photoLabel}>Reverse</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  photoSection: {
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
  photoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  photoCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.background.cardBorder,
  },
  coinImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  photoLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
});
