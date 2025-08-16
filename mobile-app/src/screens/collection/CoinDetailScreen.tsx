// src/screens/collection/CoinDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';
import { Input, Button } from '../../components/common';
import { Coin } from '../../types/coin';
import { CoinService } from '../../services/coinService';

interface CoinDetailScreenProps {
  route: {
    params: {
      coin: Coin;
    };
  };
  navigation: any;
}

export default function CoinDetailScreen({ route, navigation }: CoinDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { coin: initialCoin } = route.params;
  
  const [coin, setCoin] = useState<Coin>(initialCoin);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setSaving] = useState(false);
  
  // Form state for editing
  const [formData, setFormData] = useState({
    name: coin.name || '',
    title: coin.title || '',
    year: coin.year.toString(),
    denomination: coin.denomination,
    country: coin.country || '',
    mintMark: coin.mintMark || '',
    grade: coin.grade || '',
    faceValue: coin.faceValue?.toString() || '',
    purchasePrice: coin.purchasePrice?.toString() || '',
    purchaseDate: coin.purchaseDate || '',
    notes: coin.notes || '',
  });

  const [images, setImages] = useState({
    obverse: coin.obverseImage,
    reverse: coin.reverseImage,
  });

  useEffect(() => {
    navigation.setOptions({
      title: '', // Remove the title since we show coin name in the content
      headerShown: true,
      headerStyle: {
        backgroundColor: 'rgba(15, 15, 35, 0.95)',
        shadowOpacity: 0,
        elevation: 0,
      },
      headerTintColor: Colors.primary.gold,
      headerBackTitleVisible: false,
    });
  }, [coin, navigation]);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission',
        'Camera access is required to take photos of your coins.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const takePicture = async (side: 'obverse' | 'reverse') => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    Alert.alert(
      'Update Photo',
      `Take a new photo of the ${side} side?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Photo',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
            });

            if (!result.canceled && result.assets[0]) {
              setImages(prev => ({
                ...prev,
                [side]: result.assets[0].uri
              }));
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!formData.year.trim() || isNaN(Number(formData.year))) {
      Alert.alert('Validation Error', 'Please enter a valid year');
      return;
    }
    if (!formData.denomination.trim()) {
      Alert.alert('Validation Error', 'Denomination is required');
      return;
    }

    setSaving(true);
    try {
      const updates = {
        name: formData.name,
        title: formData.title || undefined,
        year: parseInt(formData.year),
        denomination: formData.denomination,
        country: formData.country || undefined,
        mintMark: formData.mintMark || undefined,
        grade: formData.grade || undefined,
        faceValue: formData.faceValue ? parseFloat(formData.faceValue) : undefined,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
        purchaseDate: formData.purchaseDate || undefined,
        notes: formData.notes || undefined,
        obverseImage: images.obverse !== coin.obverseImage ? images.obverse : undefined,
        reverseImage: images.reverse !== coin.reverseImage ? images.reverse : undefined,
      };

      const updatedCoin = await CoinService.updateCoin(coin.id, updates);
      setCoin(updatedCoin);
      setImages({
        obverse: updatedCoin.obverseImage,
        reverse: updatedCoin.reverseImage,
      });
      
      setIsEditing(false);
      
      Alert.alert('Success!', 'Coin updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update coin. Please try again.');
      console.error('Update coin error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      name: coin.name || '',
      title: coin.title || '',
      year: coin.year.toString(),
      denomination: coin.denomination,
      country: coin.country || '',
      mintMark: coin.mintMark || '',
      grade: coin.grade || '',
      faceValue: coin.faceValue?.toString() || '',
      purchasePrice: coin.purchasePrice?.toString() || '',
      purchaseDate: coin.purchaseDate || '',
      notes: coin.notes || '',
    });
    setImages({
      obverse: coin.obverseImage,
      reverse: coin.reverseImage,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Coin',
      `Are you sure you want to delete this ${coin.year} ${coin.denomination}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await CoinService.deleteCoin(coin.id);
              Alert.alert('Deleted', 'Coin has been removed from your collection');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete coin');
            }
          }
        }
      ]
    );
  };

  return (
    <LinearGradient colors={Colors.background.primary} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 60 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {coin.year} {coin.denomination}
            </Text>
            {coin.country && (
              <Text style={styles.headerSubtitle}>{coin.country}</Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {!isEditing ? (
              <>
                <Button
                  title="Edit Coin"
                  onPress={() => setIsEditing(true)}
                  style={styles.editButton}
                />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Button
                  title={loading ? "Saving..." : "Save Changes"}
                  onPress={handleSave}
                  disabled={loading}
                  style={styles.saveButton}
                />
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Photo Section */}
          <BlurView intensity={60} style={styles.photoSection}>
            <Text style={styles.sectionTitle}>📸 Coin Photos</Text>
            <View style={styles.photoGrid}>
              <TouchableOpacity 
                style={styles.photoCard}
                onPress={() => isEditing && takePicture('obverse')}
                disabled={!isEditing}
              >
                {images.obverse ? (
                  <Image source={{ uri: images.obverse }} style={styles.coinImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.photoPlaceholderText}>📷</Text>
                    <Text style={styles.photoLabel}>Obverse</Text>
                  </View>
                )}
                {isEditing && (
                  <View style={styles.editOverlay}>
                    <Text style={styles.editOverlayText}>Tap to {images.obverse ? 'Replace' : 'Add'}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.photoCard}
                onPress={() => isEditing && takePicture('reverse')}
                disabled={!isEditing}
              >
                {images.reverse ? (
                  <Image source={{ uri: images.reverse }} style={styles.coinImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.photoPlaceholderText}>📷</Text>
                    <Text style={styles.photoLabel}>Reverse</Text>
                  </View>
                )}
                {isEditing && (
                  <View style={styles.editOverlay}>
                    <Text style={styles.editOverlayText}>Tap to {images.reverse ? 'Replace' : 'Add'}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </BlurView>

          {/* Basic Information */}
          <BlurView intensity={60} style={styles.formSection}>
            <Text style={styles.sectionTitle}>📋 Basic Information</Text>
            
            {isEditing ? (
              <>
                <Input
                  label="Coin Name"
                  value={formData.name}
                  onChangeText={(value) => updateFormData('name', value)}
                  style={styles.input}
                />

                <Input
                  label="Title/Description"
                  value={formData.title}
                  onChangeText={(value) => updateFormData('title', value)}
                  style={styles.input}
                />

                <View style={styles.gridRow}>
                  <View style={styles.gridInput}>
                    <Input
                      label="Year *"
                      value={formData.year}
                      onChangeText={(value) => updateFormData('year', value)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.gridInput}>
                    <Input
                      label="Denomination *"
                      value={formData.denomination}
                      onChangeText={(value) => updateFormData('denomination', value)}
                    />
                  </View>
                </View>

                <View style={styles.gridRow}>
                  <View style={styles.gridInput}>
                    <Input
                      label="Country"
                      value={formData.country}
                      onChangeText={(value) => updateFormData('country', value)}
                    />
                  </View>
                  <View style={styles.gridInput}>
                    <Input
                      label="Mint Mark"
                      value={formData.mintMark}
                      onChangeText={(value) => updateFormData('mintMark', value)}
                    />
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.infoGrid}>
                <InfoItem label="Year" value={coin.year.toString()} />
                <InfoItem label="Denomination" value={coin.denomination} />
                <InfoItem label="Country" value={coin.country || 'Not specified'} />
                <InfoItem label="Mint Mark" value={coin.mintMark || 'None'} />
              </View>
            )}
          </BlurView>

          {/* Grading & Value */}
          <BlurView intensity={60} style={styles.formSection}>
            <Text style={styles.sectionTitle}>💎 Grading & Value</Text>
            
            {isEditing ? (
              <>
                <Input
                  label="Grade"
                  value={formData.grade}
                  onChangeText={(value) => updateFormData('grade', value)}
                  style={styles.input}
                />

                <View style={styles.gridRow}>
                  <View style={styles.gridInput}>
                    <Input
                      label="Face Value"
                      value={formData.faceValue}
                      onChangeText={(value) => updateFormData('faceValue', value)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.gridInput}>
                    <Input
                      label="Purchase Price"
                      value={formData.purchasePrice}
                      onChangeText={(value) => updateFormData('purchasePrice', value)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <Input
                  label="Purchase Date"
                  value={formData.purchaseDate}
                  onChangeText={(value) => updateFormData('purchaseDate', value)}
                  style={styles.input}
                />
              </>
            ) : (
              <View style={styles.infoGrid}>
                <InfoItem label="Grade" value={coin.grade || 'Not graded'} />
                <InfoItem label="Face Value" value={coin.faceValue ? `$${coin.faceValue}` : 'Not specified'} />
                <InfoItem label="Purchase Price" value={coin.purchasePrice ? `$${coin.purchasePrice.toLocaleString()}` : 'Not specified'} />
                <InfoItem label="Purchase Date" value={coin.purchaseDate || 'Not specified'} />
              </View>
            )}
          </BlurView>

          {/* Notes */}
          <BlurView intensity={60} style={styles.formSection}>
            <Text style={styles.sectionTitle}>📝 Notes</Text>
            
            {isEditing ? (
              <Input
                label="Additional Notes"
                value={formData.notes}
                onChangeText={(value) => updateFormData('notes', value)}
                multiline
                numberOfLines={4}
                style={styles.input}
              />
            ) : (
              <Text style={styles.notesText}>
                {coin.notes || 'No additional notes'}
              </Text>
            )}
          </BlurView>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  editButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 0.4,
    backgroundColor: Colors.text.error,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  saveButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 0.4,
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.background.cardBorder,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  photoSection: {
    ...GlassmorphismStyles.card,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
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
    position: 'relative',
  },
  coinImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
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
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  editOverlayText: {
    color: Colors.primary.gold,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  infoGrid: {
    gap: Spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  infoValue: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.semibold,
    flex: 1,
    textAlign: 'right',
  },
  notesText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    lineHeight: 22,
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
  bottomSpacing: {
    height: 120,
  },
});