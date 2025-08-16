// src/screens/collection/AddCoinScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';
import { Input, Button } from '../../components/common';
import { Coin } from '../../types/coin';
import { CoinService } from '../../services/coinService';

export default function AddCoinScreen() {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    year: '',
    denomination: '',
    country: '',
    mintMark: '',
    grade: '',
    faceValue: '',
    purchasePrice: '',
    purchaseDate: '',
    notes: '',
  });

  const [images, setImages] = useState<{
    obverse: string | null;
    reverse: string | null;
  }>({
    obverse: null,
    reverse: null,
  });

  const [loading, setLoading] = useState(false);

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
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Coin name is required');
      return false;
    }
    if (!formData.year.trim() || isNaN(Number(formData.year))) {
      Alert.alert('Validation Error', 'Please enter a valid year');
      return false;
    }
    if (!formData.denomination.trim()) {
      Alert.alert('Validation Error', 'Denomination is required');
      return false;
    }
    return true;
  };

  const handleSaveCoin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Prepare coin data for service
      const coinData = {
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
        obverseImage: images.obverse || undefined,
        reverseImage: images.reverse || undefined,
      };

      // Save coin to Supabase
      const newCoin = await CoinService.createCoin(coinData);
      
      Alert.alert('Success!', `${formData.name} has been added to your collection!`, [
        {
          text: 'Add Another',
          onPress: () => {
            setFormData({
              name: '',
              title: '',
              year: '',
              denomination: '',
              country: '',
              mintMark: '',
              grade: '',
              faceValue: '',
              purchasePrice: '',
              purchaseDate: '',
              notes: '',
            });
            setImages({ obverse: null, reverse: null });
          }
        },
        { text: 'View Collection', style: 'default' }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save coin. Please try again.');
      console.error('Save coin error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient 
      colors={Colors.background.primary}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add New Coin</Text>
            <Text style={styles.headerSubtitle}>Build your collection</Text>
          </View>

          {/* Photo Section */}
          <BlurView intensity={60} style={styles.photoSection}>
            <Text style={styles.sectionTitle}>📸 Coin Photos</Text>
            <View style={styles.photoGrid}>
              <TouchableOpacity 
                style={styles.photoCard}
                onPress={() => takePicture('obverse')}
              >
                {images.obverse ? (
                  <Image source={{ uri: images.obverse }} style={styles.coinImage} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoPlaceholderText}>📷</Text>
                    <Text style={styles.photoLabel}>Obverse</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.photoCard}
                onPress={() => takePicture('reverse')}
              >
                {images.reverse ? (
                  <Image source={{ uri: images.reverse }} style={styles.coinImage} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoPlaceholderText}>📷</Text>
                    <Text style={styles.photoLabel}>Reverse</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </BlurView>

          {/* Basic Information */}
          <BlurView intensity={60} style={styles.formSection}>
            <Text style={styles.sectionTitle}>📋 Basic Information</Text>
            
            <Input
              label="Coin Name *"
              placeholder="e.g. Morgan Silver Dollar"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              style={styles.input}
            />

            <Input
              label="Title/Description"
              placeholder="e.g. Lady Liberty Head"
              value={formData.title}
              onChangeText={(value) => updateFormData('title', value)}
              style={styles.input}
            />

            <View style={styles.gridRow}>
              <View style={styles.gridInput}>
                <Input
                  label="Year *"
                  placeholder="1921"
                  value={formData.year}
                  onChangeText={(value) => updateFormData('year', value)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.gridInput}>
                <Input
                  label="Denomination *"
                  placeholder="Dollar"
                  value={formData.denomination}
                  onChangeText={(value) => updateFormData('denomination', value)}
                />
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.gridInput}>
                <Input
                  label="Country"
                  placeholder="United States"
                  value={formData.country}
                  onChangeText={(value) => updateFormData('country', value)}
                />
              </View>

              <View style={styles.gridInput}>
                <Input
                  label="Mint Mark"
                  placeholder="S, D, O, etc."
                  value={formData.mintMark}
                  onChangeText={(value) => updateFormData('mintMark', value)}
                />
              </View>
            </View>
          </BlurView>

          {/* Grading & Value */}
          <BlurView intensity={60} style={styles.formSection}>
            <Text style={styles.sectionTitle}>💎 Grading & Value</Text>
            
            <Input
              label="Grade"
              placeholder="MS-64, AU-50, etc."
              value={formData.grade}
              onChangeText={(value) => updateFormData('grade', value)}
              style={styles.input}
            />

            <View style={styles.gridRow}>
              <View style={styles.gridInput}>
                <Input
                  label="Face Value"
                  placeholder="1.00"
                  value={formData.faceValue}
                  onChangeText={(value) => updateFormData('faceValue', value)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.gridInput}>
                <Input
                  label="Purchase Price"
                  placeholder="45.00"
                  value={formData.purchasePrice}
                  onChangeText={(value) => updateFormData('purchasePrice', value)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Input
              label="Purchase Date"
              placeholder="YYYY-MM-DD"
              value={formData.purchaseDate}
              onChangeText={(value) => updateFormData('purchaseDate', value)}
              style={styles.input}
            />
          </BlurView>

          {/* Notes */}
          <BlurView intensity={60} style={styles.formSection}>
            <Text style={styles.sectionTitle}>📝 Notes</Text>
            
            <Input
              label="Additional Notes"
              placeholder="Any special details, history, or observations..."
              value={formData.notes}
              onChangeText={(value) => updateFormData('notes', value)}
              multiline
              numberOfLines={4}
              style={styles.input}
            />
          </BlurView>

          {/* Save Button */}
          <Button
            title={loading ? "Saving Coin..." : "Add to Collection"}
            onPress={handleSaveCoin}
            disabled={loading}
            style={styles.saveButton}
          />

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

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
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  headerTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
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
  input: {
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
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
  halfWidth: {
    flex: 1,
  },
  saveButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  bottomSpacing: {
    height: 100, // Extra space for tab bar
  },
});