// src/screens/collection/EditCoinScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';
import { Input, Button } from '../../components/common';
import { CoinService } from '../../services/coinService';
import { supabase } from '../../services/supabase';
import { CoinSeries, SpecificCoin, getSeriesByCountryAndDenomination, getSeriesById } from '@coin-collecting/shared';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { CollectionStackParamList } from '../../types/navigation';
import { useDeviceInfo } from '../../utils/deviceUtils';
import { Logger } from '../../services/logger';
import { ErrorService } from '../../services/errorService';

type EditCoinRouteProp = RouteProp<CollectionStackParamList, 'EditCoin'>;

export default function EditCoinScreen() {
  const navigation = useNavigation();
  const route = useRoute<EditCoinRouteProp>();
  const { coinId } = route.params;
  const deviceInfo = useDeviceInfo();

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    series: '',
    seriesId: '',
    specificCoinId: '',
    specificCoinName: '',
    designer: '',
    theme: '',
    honoree: '',
    releaseDate: '',
    certificationNumber: '',
    gradingService: '',
  });

  const [images, setImages] = useState<{
    obverse: string | null;
    reverse: string | null;
  }>({
    obverse: null,
    reverse: null,
  });

  const [availableSeries, setAvailableSeries] = useState<CoinSeries[]>([]);
  const [availableSpecificCoins, setAvailableSpecificCoins] = useState<SpecificCoin[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<CoinSeries | null>(null);
  const [showSeriesDropdown, setShowSeriesDropdown] = useState(false);
  const [showSpecificCoinDropdown, setShowSpecificCoinDropdown] = useState(false);

  // Load existing coin data
  useEffect(() => {
    loadCoinData();
  }, [coinId]);

  const loadCoinData = async () => {
    try {
      const { data, error } = await supabase
        .from('coins')
        .select('*')
        .eq('id', coinId)
        .single();

      if (error) throw error;

      const coin = CoinService.mapSupabaseToCoin(data);

      setFormData({
        name: coin.name || '',
        title: coin.title || '',
        year: coin.year?.toString() || '',
        denomination: coin.denomination || '',
        country: coin.country || '',
        mintMark: coin.mintMark || '',
        grade: coin.grade || '',
        faceValue: coin.faceValue?.toString() || '',
        purchasePrice: coin.purchasePrice?.toString() || '',
        purchaseDate: coin.purchaseDate || '',
        notes: coin.notes || '',
        series: coin.series || '',
        seriesId: coin.seriesId || '',
        specificCoinId: coin.specificCoinId || '',
        specificCoinName: coin.specificCoinName || '',
        designer: coin.designer || '',
        theme: coin.theme || '',
        honoree: coin.honoree || '',
        releaseDate: coin.releaseDate || '',
        certificationNumber: coin.certificationNumber || '',
        gradingService: coin.gradingService || '',
      });

      setImages({
        obverse: coin.obverseImage || null,
        reverse: coin.reverseImage || null,
      });

      // Load available series if country and denomination are set
      if (coin.country && coin.denomination) {
        const series = getSeriesByCountryAndDenomination(coin.country, coin.denomination);
        setAvailableSeries(series);

        // If coin has a seriesId, load the specific coins for that series
        if (coin.seriesId) {
          const coinSeries = getSeriesById(coin.seriesId);
          if (coinSeries) {
            setSelectedSeries(coinSeries);
            setAvailableSpecificCoins(coinSeries.specificCoins);
          }
        }
      }
    } catch (error) {
      Logger.error('Failed to load coin data', error);
      Alert.alert('Error', 'Failed to load coin data.', [
        { text: 'Go Back', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setInitialLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => {
      const newFormData = { ...prev, [field]: value };

      if (field === 'country' || field === 'denomination') {
        if (newFormData.country && newFormData.denomination) {
          const series = getSeriesByCountryAndDenomination(newFormData.country, newFormData.denomination);
          setAvailableSeries(series);
        } else {
          setAvailableSeries([]);
        }
        setSelectedSeries(null);
        setAvailableSpecificCoins([]);
        newFormData.series = '';
        newFormData.seriesId = '';
        newFormData.specificCoinId = '';
        newFormData.specificCoinName = '';
      }

      return newFormData;
    });
  };

  const handleSeriesSelection = (series: CoinSeries) => {
    setSelectedSeries(series);
    setAvailableSpecificCoins(series.specificCoins);
    setFormData(prev => ({
      ...prev,
      series: series.name,
      seriesId: series.id,
      specificCoinId: '',
      specificCoinName: '',
      country: series.country,
      denomination: series.denomination,
    }));
    setShowSeriesDropdown(false);
  };

  const handleSpecificCoinSelection = (specificCoin: SpecificCoin) => {
    setFormData(prev => ({
      ...prev,
      specificCoinId: specificCoin.id,
      specificCoinName: specificCoin.name,
      year: specificCoin.year.toString(),
      designer: specificCoin.designer || '',
      theme: specificCoin.theme || '',
      honoree: specificCoin.honoree || '',
      releaseDate: specificCoin.releaseDate || '',
      name: prev.name || specificCoin.name,
    }));
    setShowSpecificCoinDropdown(false);
  };

  const takePicture = async (side: 'obverse' | 'reverse') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Permission', 'Camera access is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled && result.assets[0]) {
      setImages(prev => ({ ...prev, [side]: result.assets[0].uri }));
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

  const handleSave = async () => {
    if (!validateForm()) return;

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
        series: formData.series || undefined,
        seriesId: formData.seriesId || undefined,
        specificCoinId: formData.specificCoinId || undefined,
        specificCoinName: formData.specificCoinName || undefined,
        designer: formData.designer || undefined,
        theme: formData.theme || undefined,
        honoree: formData.honoree || undefined,
        releaseDate: formData.releaseDate || undefined,
        certificationNumber: formData.certificationNumber || undefined,
        gradingService: formData.gradingService || undefined,
      };

      await CoinService.updateCoin(coinId, updates);

      Logger.info('Coin updated successfully', { coinId, name: formData.name });

      Alert.alert('Success', `${formData.name} has been updated.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Logger.error('Failed to update coin', error);
      ErrorService.showError(error, 'updating your coin');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Coin',
      `Are you sure you want to delete "${formData.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await CoinService.deleteCoin(coinId);
              Logger.info('Coin deleted', { coinId });
              navigation.goBack();
            } catch (error) {
              Logger.error('Failed to delete coin', error);
              ErrorService.showError(error, 'deleting your coin');
            }
          },
        },
      ]
    );
  };

  if (initialLoading) {
    return (
      <LinearGradient colors={Colors.background.primary} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.gold} />
          <Text style={styles.loadingText}>Loading coin data...</Text>
        </View>
      </LinearGradient>
    );
  }

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
            { paddingHorizontal: deviceInfo.responsive.containerPadding },
          ]}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => {
            setShowSeriesDropdown(false);
            setShowSpecificCoinDropdown(false);
          }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Text style={styles.backButtonText}>{'<'} Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.headerTitle}>Edit Coin</Text>
            <Text style={styles.headerSubtitle}>Update your coin details</Text>
          </View>

          {/* Photo Section */}
          <BlurView intensity={60} style={styles.photoSection}>
            <Text style={styles.sectionTitle}>Coin Photos</Text>
            <View style={styles.photoGrid}>
              <TouchableOpacity style={styles.photoCard} onPress={() => takePicture('obverse')}>
                {images.obverse ? (
                  <Image source={{ uri: images.obverse }} style={styles.coinImage} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoPlaceholderEmoji}>+</Text>
                    <Text style={styles.photoLabel}>Obverse</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoCard} onPress={() => takePicture('reverse')}>
                {images.reverse ? (
                  <Image source={{ uri: images.reverse }} style={styles.coinImage} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoPlaceholderEmoji}>+</Text>
                    <Text style={styles.photoLabel}>Reverse</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </BlurView>

          {/* Basic Information */}
          <BlurView intensity={60} style={styles.formSection}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <Input
              label="Coin Name *"
              placeholder="e.g. Morgan Dollar"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              style={styles.input}
            />

            <Input
              label="Title/Description"
              placeholder="e.g. Sally Ride, Peace Design"
              value={formData.title}
              onChangeText={(value) => updateFormData('title', value)}
              style={styles.input}
            />

            <View style={styles.gridRow}>
              <View style={styles.gridInput}>
                <Input
                  label="Year *"
                  placeholder="e.g. 2022"
                  value={formData.year}
                  onChangeText={(value) => updateFormData('year', value)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.gridInput}>
                <Input
                  label="Denomination *"
                  placeholder="e.g. Quarter"
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

          {/* Series Selection */}
          <BlurView
            intensity={60}
            style={[
              styles.formSection,
              (showSeriesDropdown || showSpecificCoinDropdown) && styles.expandedSection,
            ]}
          >
            <Text style={styles.sectionTitle}>Series Information</Text>

            {!formData.country || !formData.denomination ? (
              <View style={styles.helpCard}>
                <Text style={styles.helpText}>
                  Enter country and denomination above to see available series
                </Text>
              </View>
            ) : availableSeries.length === 0 ? (
              <View style={styles.helpCard}>
                <Text style={styles.helpText}>
                  No predefined series for {formData.country} {formData.denomination}
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.dropdownContainer,
                  showSeriesDropdown && styles.dropdownContainerExpanded,
                ]}
              >
                <Text style={styles.inputLabel}>
                  Coin Series - {availableSeries.length} available
                </Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => {
                    setShowSpecificCoinDropdown(false);
                    setShowSeriesDropdown(!showSeriesDropdown);
                  }}
                >
                  <Text style={styles.dropdownText}>
                    {selectedSeries ? selectedSeries.name : 'Select a series...'}
                  </Text>
                  <Text style={styles.dropdownArrow}>
                    {showSeriesDropdown ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {showSeriesDropdown && (
                  <BlurView intensity={80} style={styles.dropdownMenu}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                      {availableSeries.map((series) => (
                        <TouchableOpacity
                          key={series.id}
                          style={styles.dropdownItem}
                          onPress={() => handleSeriesSelection(series)}
                        >
                          <Text style={styles.dropdownItemText}>{series.name}</Text>
                          <Text style={styles.dropdownItemSubtext}>
                            {series.startYear}-{series.endYear} - {series.specificCoins.length} coins
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </BlurView>
                )}
              </View>
            )}

            {availableSpecificCoins.length > 0 && (
              <View
                style={[
                  styles.dropdownContainer,
                  showSpecificCoinDropdown && styles.dropdownContainerExpanded,
                ]}
              >
                <Text style={styles.inputLabel}>Specific Coin</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => {
                    setShowSeriesDropdown(false);
                    setShowSpecificCoinDropdown(!showSpecificCoinDropdown);
                  }}
                >
                  <Text style={styles.dropdownText}>
                    {formData.specificCoinName || 'Select specific coin...'}
                  </Text>
                  <Text style={styles.dropdownArrow}>
                    {showSpecificCoinDropdown ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {showSpecificCoinDropdown && (
                  <BlurView intensity={80} style={styles.dropdownMenu}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                      {availableSpecificCoins.map((coin) => (
                        <TouchableOpacity
                          key={coin.id}
                          style={styles.dropdownItem}
                          onPress={() => handleSpecificCoinSelection(coin)}
                        >
                          <Text style={styles.dropdownItemText}>{coin.name}</Text>
                          {coin.honoree && (
                            <Text style={styles.dropdownItemSubtext}>
                              Honoring {coin.honoree}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </BlurView>
                )}
              </View>
            )}

            {formData.honoree ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Honoree:</Text>
                <Text style={styles.infoValue}>{formData.honoree}</Text>
              </View>
            ) : null}
            {formData.designer ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Designer:</Text>
                <Text style={styles.infoValue}>{formData.designer}</Text>
              </View>
            ) : null}
          </BlurView>

          {/* Grading & Value */}
          <BlurView intensity={60} style={styles.formSection}>
            <Text style={styles.sectionTitle}>Grading & Value</Text>

            <View style={styles.gridRow}>
              <View style={styles.gridInput}>
                <Input
                  label="Grade"
                  placeholder="MS-64, AU-50, etc."
                  value={formData.grade}
                  onChangeText={(value) => updateFormData('grade', value)}
                />
              </View>
              <View style={styles.gridInput}>
                <Input
                  label="Grading Service"
                  placeholder="PCGS, NGC, etc."
                  value={formData.gradingService}
                  onChangeText={(value) => updateFormData('gradingService', value)}
                />
              </View>
            </View>

            <Input
              label="Certification Number"
              placeholder="Cert #"
              value={formData.certificationNumber}
              onChangeText={(value) => updateFormData('certificationNumber', value)}
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
            <Text style={styles.sectionTitle}>Notes</Text>
            <Input
              label="Additional Notes"
              placeholder="Any special details..."
              value={formData.notes}
              onChangeText={(value) => updateFormData('notes', value)}
              multiline
              numberOfLines={4}
              style={styles.input}
            />
          </BlurView>

          {/* Save Button */}
          <Button
            title={saving ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            disabled={saving}
            style={{
              ...styles.saveButton,
              height: deviceInfo.adaptiveStyles.form.buttonHeight,
            }}
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
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.md,
    marginTop: Spacing.md,
  },
  header: {
    marginBottom: Spacing['2xl'],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  backButton: {
    padding: Spacing.sm,
  },
  backButtonText: {
    color: Colors.primary.gold,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  deleteButtonText: {
    color: Colors.text.error,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  headerTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
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
  photoPlaceholderEmoji: {
    fontSize: 32,
    color: Colors.text.secondary,
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
  gridRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  gridInput: {
    flex: 1,
  },
  saveButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  bottomSpacing: {
    height: 100,
  },
  dropdownContainer: {
    marginBottom: Spacing.lg,
    position: 'relative',
    zIndex: 100,
  },
  dropdownContainerExpanded: {
    marginBottom: 280,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  dropdown: {
    ...GlassmorphismStyles.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  dropdownText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.gold,
    marginLeft: Spacing.sm,
  },
  dropdownMenu: {
    ...GlassmorphismStyles.card,
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    maxHeight: 250,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: Colors.primary.gold,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dropdownScroll: {
    maxHeight: 230,
    flexGrow: 0,
  },
  dropdownItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.cardBorder,
  },
  dropdownItemText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  dropdownItemSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  infoCard: {
    ...GlassmorphismStyles.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary.gold,
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.gold,
    marginRight: Spacing.sm,
    minWidth: 80,
  },
  infoValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    flex: 1,
  },
  helpCard: {
    ...GlassmorphismStyles.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.text.secondary,
    borderStyle: 'dashed',
  },
  helpText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium,
  },
  expandedSection: {
    marginBottom: Spacing['3xl'],
    paddingBottom: Spacing['2xl'],
  },
});
