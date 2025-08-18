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
import { Input, Button, CoinNameSuggestions } from '../../components/common';
import { Coin } from '../../types/coin';
import { CoinService } from '../../services/coinService';
import { CoinSeries, SpecificCoin, COIN_SERIES, getSeriesByCountryAndDenomination, getSeriesById } from '../../types/series';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useDeviceInfo } from '../../utils/deviceUtils';

export default function AddCoinScreen() {
  const navigation = useNavigation();
  const deviceInfo = useDeviceInfo();
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
    // New series-related fields
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

  const [loading, setLoading] = useState(false);
  
  // Series selection state
  const [availableSeries, setAvailableSeries] = useState<CoinSeries[]>([]);
  const [availableSpecificCoins, setAvailableSpecificCoins] = useState<SpecificCoin[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<CoinSeries | null>(null);
  const [showSeriesDropdown, setShowSeriesDropdown] = useState(false);
  const [showSpecificCoinDropdown, setShowSpecificCoinDropdown] = useState(false);
  
  // Coin name suggestions state
  const [showCoinSuggestions, setShowCoinSuggestions] = useState(false);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => {
      const newFormData = { ...prev, [field]: value };
      
      // Show coin suggestions when typing in the name field
      if (field === 'name') {
        setShowCoinSuggestions(value.length >= 2);
      }
      
      // When country or denomination changes, update available series
      if (field === 'country' || field === 'denomination') {
        if (newFormData.country && newFormData.denomination) {
          const series = getSeriesByCountryAndDenomination(newFormData.country, newFormData.denomination);
          setAvailableSeries(series);
          console.log(`Found ${series.length} series for ${newFormData.country} ${newFormData.denomination}:`, series.map(s => s.name));
        } else {
          setAvailableSeries([]);
        }
        // Clear series selection when filtering criteria change
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
      // Auto-fill some fields based on series
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
      // Auto-fill additional metadata
      designer: specificCoin.designer || '',
      theme: specificCoin.theme || '',
      honoree: specificCoin.honoree || '',
      releaseDate: specificCoin.releaseDate || '',
      // Suggest name if not already filled
      name: prev.name || specificCoin.name,
    }));
    setShowSpecificCoinDropdown(false);
  };

  const handleCoinSuggestionSelect = (suggestion: any) => {
    setFormData(prev => ({
      ...prev,
      name: suggestion.name,
      // Set country to United States for most PCGS-supported coins
      country: prev.country || 'United States',
    }));
    setShowCoinSuggestions(false);
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
        // Series information
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
              // Reset series fields
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
            // Reset series state
            setAvailableSeries([]);
            setAvailableSpecificCoins([]);
            setSelectedSeries(null);
            setShowSeriesDropdown(false);
            setShowSpecificCoinDropdown(false);
            setImages({ obverse: null, reverse: null });
          }
        },
        { 
          text: 'View Collection', 
          style: 'default',
          onPress: () => {
            // Navigate to the Collection tab using CommonActions
            try {
              navigation.dispatch(
                CommonActions.navigate({
                  name: 'Collection',
                })
              );
              // Clear the form after successful navigation
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
                // Reset series fields
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
              // Reset series state
              setAvailableSeries([]);
              setAvailableSpecificCoins([]);
              setSelectedSeries(null);
              setShowSeriesDropdown(false);
              setShowSpecificCoinDropdown(false);
              setImages({ obverse: null, reverse: null });
            } catch (error) {
              console.log('Navigation error:', error);
              Alert.alert('Success!', 'Coin added successfully! You can view it in the Collection tab.');
            }
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save coin. Please try again.');
      console.error('Save coin error:', error);
    } finally {
      setLoading(false);
    }
  };

  const hideAllDropdowns = () => {
    setShowCoinSuggestions(false);
    setShowSeriesDropdown(false);
    setShowSpecificCoinDropdown(false);
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
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: deviceInfo.responsive.containerPadding }
          ]}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={hideAllDropdowns}
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
            
            <View style={styles.helpCard}>
              <Text style={styles.helpText}>
                💡 Tip: Use specific coin names for accurate PCGS pricing data
              </Text>
              <Text style={styles.helpSubtext}>
                Examples: "Morgan Dollar", "Peace Dollar", "American Women Quarter", "Walking Liberty Half"
                {'\n'}Avoid generic terms like "Commemorative" - be specific about the design or series
              </Text>
            </View>
            
            <View style={styles.inputWithSuggestions}>
              <Input
                label="Coin Name *"
                placeholder="e.g. American Women Quarter, Morgan Dollar, Walking Liberty Half"
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                style={styles.input}
              />
              <CoinNameSuggestions
                query={formData.name}
                onSuggestionSelect={handleCoinSuggestionSelect}
                visible={showCoinSuggestions}
              />
            </View>

            <Input
              label="Title/Description"
              placeholder="e.g. Sally Ride, Peace Design, 1916-D Key Date"
              value={formData.title}
              onChangeText={(value) => updateFormData('title', value)}
              style={styles.input}
            />

            <View style={styles.gridRow}>
              <View style={styles.gridInput}>
                <Input
                  label="Year *"
                  placeholder="e.g. 2022 (just the year)"
                  value={formData.year}
                  onChangeText={(value) => updateFormData('year', value)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.gridInput}>
                <Input
                  label="Denomination *"
                  placeholder="e.g. Quarter, Dollar, Cent"
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
          <BlurView intensity={60} style={[
            styles.formSection,
            (showSeriesDropdown || showSpecificCoinDropdown) && styles.expandedSection
          ]}>
            <Text style={styles.sectionTitle}>🎯 Series Information</Text>
            
            {/* Help text when no series available */}
            {!formData.country || !formData.denomination ? (
              <View style={styles.helpCard}>
                <Text style={styles.helpText}>
                  💡 Enter country and denomination above to see available coin series
                </Text>
              </View>
            ) : availableSeries.length === 0 ? (
              <View style={styles.helpCard}>
                <Text style={styles.helpText}>
                  No predefined series found for {formData.country} {formData.denomination}
                </Text>
                <Text style={styles.helpSubtext}>
                  You can still add your coin manually - series selection is optional
                </Text>
              </View>
            ) : (
              /* Series Dropdown */
              <View style={[
                styles.dropdownContainer,
                showSeriesDropdown && styles.dropdownContainerExpanded
              ]}>
                <Text style={styles.inputLabel}>
                  Coin Series (Optional) - {availableSeries.length} available
                </Text>
                <TouchableOpacity 
                  style={styles.dropdown}
                  onPress={() => {
                    setShowCoinSuggestions(false);
                    setShowSpecificCoinDropdown(false);
                    setShowSeriesDropdown(!showSeriesDropdown);
                  }}
                >
                  <Text style={styles.dropdownText}>
                    {selectedSeries ? selectedSeries.name : 'Select a series...'}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
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
                            {series.startYear}-{series.endYear} • {series.specificCoins.length} coins
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </BlurView>
                )}
              </View>
            )}

            {/* Specific Coin Selection */}
            {availableSpecificCoins.length > 0 && (
              <View style={[
                styles.dropdownContainer,
                showSpecificCoinDropdown && styles.dropdownContainerExpanded
              ]}>
                <Text style={styles.inputLabel}>Specific Coin</Text>
                <TouchableOpacity 
                  style={styles.dropdown}
                  onPress={() => {
                    setShowCoinSuggestions(false);
                    setShowSeriesDropdown(false);
                    setShowSpecificCoinDropdown(!showSpecificCoinDropdown);
                  }}
                >
                  <Text style={styles.dropdownText}>
                    {formData.specificCoinName || 'Select specific coin...'}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
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
                          {coin.description && (
                            <Text style={styles.dropdownItemSubtext}>
                              {coin.description}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </BlurView>
                )}
              </View>
            )}

            {/* Additional Series Info (Auto-filled) */}
            {formData.honoree && (
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Honoree:</Text>
                <Text style={styles.infoValue}>{formData.honoree}</Text>
              </View>
            )}
            
            {formData.designer && (
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Designer:</Text>
                <Text style={styles.infoValue}>{formData.designer}</Text>
              </View>
            )}

            {formData.releaseDate && (
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Release Date:</Text>
                <Text style={styles.infoValue}>{new Date(formData.releaseDate).toLocaleDateString()}</Text>
              </View>
            )}
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
            style={[
              styles.saveButton,
              { height: deviceInfo.adaptiveStyles.form.buttonHeight }
            ]}
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
  // Series selection styles
  dropdownContainer: {
    marginBottom: Spacing.lg,
    position: 'relative',
    zIndex: 100,
  },
  dropdownContainerExpanded: {
    marginBottom: 280, // Extra space when dropdown is open
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
    elevation: 10, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
    lineHeight: 16,
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
  helpSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  expandedSection: {
    marginBottom: Spacing['3xl'], // Extra space when dropdowns are open
    paddingBottom: Spacing['2xl'],
  },
  inputWithSuggestions: {
    position: 'relative',
    zIndex: 200, // Higher than dropdown containers
    marginBottom: Spacing.md,
  },
});