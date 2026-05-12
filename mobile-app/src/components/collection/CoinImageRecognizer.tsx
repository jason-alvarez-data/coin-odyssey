import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';
import { CoinRecognitionResult, RecognitionConfidence } from '../../types/recognition';
import { CoinRecognitionService } from '../../services/coinRecognitionService';

interface CoinImageRecognizerProps {
  /** Called with recognized coin data when user taps "Apply" */
  onRecognitionComplete: (result: CoinRecognitionResult) => void;
  /** Called when user dismisses the recognizer */
  onDismiss?: () => void;
  /** Pre-existing obverse image URI (from the photo section) */
  obverseUri?: string | null;
  /** Pre-existing reverse image URI (from the photo section) */
  reverseUri?: string | null;
}

const confidenceConfig: Record<
  RecognitionConfidence,
  { label: string; color: string; icon: string }
> = {
  high: { label: 'High Confidence', color: Colors.text.success, icon: '✓' },
  medium: { label: 'Medium Confidence', color: '#FBBF24', icon: '~' },
  low: { label: 'Low Confidence', color: '#F97316', icon: '!' },
  unrecognized: { label: 'Unrecognized', color: Colors.text.error, icon: '✗' },
};

export function CoinImageRecognizer({
  onRecognitionComplete,
  onDismiss,
  obverseUri,
  reverseUri,
}: CoinImageRecognizerProps) {
  const [localObverse, setLocalObverse] = useState<string | null>(obverseUri ?? null);
  const [localReverse, setLocalReverse] = useState<string | null>(reverseUri ?? null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CoinRecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async (side: 'obverse' | 'reverse') => {
    setError(null);
    setResult(null);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Photo library access is required.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      const uri = pickerResult.assets[0].uri;
      if (side === 'obverse') setLocalObverse(uri);
      else setLocalReverse(uri);
    }
  };

  const takePhoto = async (side: 'obverse' | 'reverse') => {
    setError(null);
    setResult(null);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setError('Camera access is required to take photos.');
      return;
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      const uri = pickerResult.assets[0].uri;
      if (side === 'obverse') setLocalObverse(uri);
      else setLocalReverse(uri);
    }
  };

  const handleAnalyze = async () => {
    if (!localObverse && !localReverse) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const recognized = await CoinRecognitionService.recognizeCoin(
        localObverse,
        localReverse
      );
      setResult(recognized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (result) onRecognitionComplete(result);
  };

  const handleReset = () => {
    setLocalObverse(obverseUri ?? null);
    setLocalReverse(reverseUri ?? null);
    setResult(null);
    setError(null);
  };

  const confidence = result ? confidenceConfig[result.confidence] : null;
  const hasImages = !!localObverse || !!localReverse;

  return (
    <BlurView intensity={60} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>✨</Text>
          <View>
            <Text style={styles.headerTitle}>AI Coin Recognition</Text>
            <Text style={styles.headerSubtitle}>Photo-identify your coin instantly</Text>
          </View>
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Image Slots */}
      <View style={styles.imageGrid}>
        {(['obverse', 'reverse'] as const).map((side) => {
          const uri = side === 'obverse' ? localObverse : localReverse;
          const label = side === 'obverse' ? 'Front' : 'Back';

          return (
            <View key={side} style={styles.imageSlotContainer}>
              <TouchableOpacity
                style={[styles.imageSlot, uri && styles.imageSlotFilled]}
                onPress={() => pickImage(side)}
                onLongPress={() => takePhoto(side)}
                disabled={isAnalyzing}
                activeOpacity={0.7}
              >
                {uri ? (
                  <Image source={{ uri }} style={styles.slotImage} />
                ) : (
                  <View style={styles.slotPlaceholder}>
                    <Text style={styles.slotIcon}>📷</Text>
                    <Text style={styles.slotLabel}>{label}</Text>
                    <Text style={styles.slotHint}>Tap: gallery</Text>
                    <Text style={styles.slotHint}>Hold: camera</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.slotCaption}>{label} ({side === 'obverse' ? 'Obverse' : 'Reverse'})</Text>
            </View>
          );
        })}
      </View>

      {/* Tip */}
      {!hasImages && (
        <Text style={styles.tip}>
          Adding both sides improves accuracy. Front side alone is usually enough.
        </Text>
      )}

      {/* Analyze Button */}
      {hasImages && !result && (
        <TouchableOpacity
          style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
          onPress={handleAnalyze}
          disabled={isAnalyzing}
          activeOpacity={0.8}
        >
          {isAnalyzing ? (
            <View style={styles.analyzeContent}>
              <ActivityIndicator size="small" color={Colors.background.primary[0]} />
              <Text style={styles.analyzeText}>Analyzing coin...</Text>
            </View>
          ) : (
            <View style={styles.analyzeContent}>
              <Text style={styles.analyzeIcon}>✨</Text>
              <Text style={styles.analyzeText}>
                Identify Coin{localObverse && localReverse ? ' (Both Sides)' : ''}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.errorRetry}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      {result && confidence && (
        <View style={styles.resultsContainer}>
          {/* Confidence Badge */}
          <View style={styles.confidenceRow}>
            <Text style={[styles.confidenceBadge, { color: confidence.color }]}>
              {confidence.icon} {confidence.label}
            </Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.retryLink}>Try different photo</Text>
            </TouchableOpacity>
          </View>

          {/* Recognized Fields */}
          {result.confidence !== 'unrecognized' && (
            <View style={styles.fieldsCard}>
              {[
                { label: 'Denomination', value: result.denomination },
                { label: 'Year', value: result.year?.toString() },
                { label: 'Country', value: result.country },
                { label: 'Currency', value: result.currency },
                { label: 'Mint Mark', value: result.mintMark },
                { label: 'Composition', value: result.composition },
              ]
                .filter((f) => f.value)
                .map(({ label, value }, index) => (
                  <View
                    key={label}
                    style={[styles.fieldRow, index > 0 && styles.fieldRowBorder]}
                  >
                    <Text style={styles.fieldLabel}>{label}</Text>
                    <Text style={styles.fieldValue}>{value}</Text>
                  </View>
                ))}
            </View>
          )}

          {/* Notes */}
          {result.notes && (
            <Text style={styles.notesText}>{result.notes}</Text>
          )}

          {/* Unrecognized */}
          {result.confidence === 'unrecognized' && (
            <Text style={styles.unrecognizedText}>
              Could not identify this coin. Try a clearer, well-lit photo or enter details manually.
            </Text>
          )}

          {/* Action Buttons */}
          {result.confidence !== 'unrecognized' && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApply}
                activeOpacity={0.8}
              >
                <Text style={styles.applyButtonText}>Apply to Form</Text>
              </TouchableOpacity>
              {onDismiss && (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={onDismiss}
                  activeOpacity={0.8}
                >
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...GlassmorphismStyles.card,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  closeText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.tertiary,
  },
  imageGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  imageSlotContainer: {
    flex: 1,
    alignItems: 'center',
  },
  imageSlot: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.background.cardBorder,
    overflow: 'hidden',
    backgroundColor: Colors.background.card,
  },
  imageSlotFilled: {
    borderColor: Colors.primary.darkGold,
    borderStyle: 'solid',
  },
  slotImage: {
    width: '100%',
    height: '100%',
  },
  slotPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  slotIcon: {
    fontSize: 28,
    opacity: 0.4,
    marginBottom: Spacing.xs,
  },
  slotLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  slotHint: {
    fontSize: 10,
    color: Colors.text.tertiary,
  },
  slotCaption: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  tip: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  analyzeButton: {
    backgroundColor: Colors.primary.gold,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
  },
  analyzeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  analyzeIcon: {
    fontSize: 16,
  },
  analyzeText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.background.primary[0],
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: Spacing.md,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.error,
  },
  errorRetry: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(239, 68, 68, 0.7)',
    textDecorationLine: 'underline',
    marginTop: Spacing.xs,
  },
  resultsContainer: {
    gap: Spacing.md,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confidenceBadge: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  retryLink: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  fieldsCard: {
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.background.cardBorder,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  fieldRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.background.cardBorder,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  fieldValue: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  notesText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
    paddingHorizontal: Spacing.xs,
  },
  unrecognizedText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  applyButton: {
    flex: 1,
    backgroundColor: Colors.primary.gold,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.background.primary[0],
  },
  skipButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.background.cardBorder,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
});
