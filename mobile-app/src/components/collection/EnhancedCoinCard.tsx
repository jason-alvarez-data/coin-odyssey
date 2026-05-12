// src/components/collection/EnhancedCoinCard.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  DimensionValue,
} from 'react-native';
import { ListItemBlur } from '../common/OptimizedBlurView';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';
import { Coin } from '../../types/coin';
import { ListOptimizedImage } from '../common/OptimizedImage';
import { CoinPricingService, CoinPricing } from '../../services/coinPricingService';
import { useDeviceInfo } from '../../utils/deviceUtils';
import { Logger } from '../../services/logger';

interface EnhancedCoinCardProps {
  coin: Coin;
  onPress: () => void;
  compact?: boolean;
  showPricing?: boolean;
  pricing?: CoinPricing | null;
}

export const EnhancedCoinCard = ({
  coin,
  onPress,
  compact = false,
  showPricing = true,
  pricing: externalPricing,
}: EnhancedCoinCardProps) => {
  const [pricing, setPricing] = useState<CoinPricing | null>(externalPricing ?? null);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const deviceInfo = useDeviceInfo();

  useEffect(() => {
    // If pricing was provided externally, use it directly
    if (externalPricing !== undefined) {
      setPricing(externalPricing);
      return;
    }
    // Otherwise fetch pricing ourselves (fallback for screens that don't batch-prefetch)
    if (showPricing) {
      loadPricing();
    }
  }, [coin.id, showPricing, externalPricing]);

  const loadPricing = async () => {
    setLoadingPricing(true);
    try {
      const pricingData = await CoinPricingService.getCoinPricing(coin);
      setPricing(pricingData);
    } catch (error) {
      Logger.error('Error loading pricing', error);
    } finally {
      setLoadingPricing(false);
    }
  };

  const formatPrice = (price: number): string => {
    if (price < 1000) return `$${price.toFixed(0)}`;
    if (price < 1000000) return `$${(price / 1000).toFixed(1)}K`;
    return `$${(price / 1000000).toFixed(1)}M`;
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const renderPricingInfo = () => {
    if (!showPricing) return null;

    if (loadingPricing) {
      return (
        <View style={styles.pricingContainer}>
          <ActivityIndicator size="small" color={Colors.primary.gold} />
          <Text style={styles.pricingLabel}>Loading PCGS data...</Text>
        </View>
      );
    }

    if (!pricing) return null;

    const currentValue = pricing.currentValue || 
      (pricing.priceRange.low + pricing.priceRange.high) / 2;

    return (
      <View style={styles.pricingContainer}>
        <View style={styles.priceRow}>
          <Text style={styles.currentPrice}>
            {formatPrice(currentValue)}
          </Text>
          <View style={styles.sourceInfo}>
            <Text style={styles.trendIcon}>
              {getTrendIcon(pricing.marketTrend)}
            </Text>
            <Text style={styles.sourceText}>
              {pricing.source.toUpperCase()}
            </Text>
          </View>
        </View>
        
        {!compact && pricing.source === 'pcgs' && (
          <Text style={styles.pcgsNote}>
            PCGS Certified Pricing
          </Text>
        )}
      </View>
    );
  };

  const getCertificationBadgeColor = (grade?: string): string => {
    if (!grade) return Colors.primary.gold;
    if (grade.includes('MS') && parseInt(grade.replace(/\D/g, '')) >= 65) {
      return Colors.status.premium; // Gold for high MS grades
    }
    if (grade.includes('PR')) {
      return Colors.status.certified; // Blue for Proof
    }
    return Colors.primary.gold;
  };

  const renderCertificationBadge = () => {
    if (!coin.grade && !coin.certificationNumber) return null;

    return (
      <View style={[
        styles.certificationBadge,
        { backgroundColor: getCertificationBadgeColor(coin.grade ?? undefined) }
      ]}>
        {coin.grade && (
          <Text style={styles.gradeText}>{coin.grade}</Text>
        )}
        {coin.gradingService && (
          <Text style={styles.certServiceText}>
            {coin.gradingService}
          </Text>
        )}
      </View>
    );
  };

  // Pricing info removed - showing basic information only

  const renderBasicInformation = () => {
    return (
      <View style={styles.basicInfoContainer}>
        {/* Coin Name (e.g., "American Women Quarter") */}
        {coin.name && (
          <Text style={responsiveStyles.coinName} numberOfLines={1}>
            {coin.name}
          </Text>
        )}
        
        {/* Title/Description (e.g., "Sally Ride") - only if different from name */}
        {coin.title && coin.title !== coin.name && (
          <Text style={responsiveStyles.coinTitle} numberOfLines={1}>
            {coin.title}
          </Text>
        )}
        
        {/* Year and Denomination */}
        <Text style={responsiveStyles.primaryInfo}>
          {coin.year} • {coin.denomination}
        </Text>
        
        {/* Country */}
        {coin.country && (
          <Text style={styles.countryInfo} numberOfLines={1}>
            {coin.country}
          </Text>
        )}
        
        {/* Mint Mark */}
        {coin.mintMark && (
          <Text style={styles.mintInfo} numberOfLines={1}>
            Mint Mark: {coin.mintMark}
          </Text>
        )}
      </View>
    );
  };

  // Metadata section removed - showing basic information only

  // Create responsive styles
  const responsiveStyles = {
    coinCard: {
      ...styles.coinCard,
      width: deviceInfo.adaptiveStyles.coinCard.width as DimensionValue,
      marginBottom: deviceInfo.adaptiveStyles.coinCard.marginBottom,
      minHeight: deviceInfo.adaptiveStyles.coinCard.minHeight,
    },
    imageContainer: {
      ...styles.imageContainer,
      height: deviceInfo.adaptiveStyles.coinImage.height,
    },
    coinName: {
      ...styles.coinName,
      fontSize: deviceInfo.adaptiveStyles.text.fontSize.lg,
    },
    primaryInfo: {
      ...styles.primaryInfo,
      fontSize: deviceInfo.adaptiveStyles.text.fontSize.md,
    },
    coinTitle: {
      ...styles.coinTitle,
      fontSize: deviceInfo.adaptiveStyles.text.fontSize.sm,
    },
    cardInfo: {
      ...styles.cardInfo,
      padding: deviceInfo.adaptiveStyles.spacing.md,
    },
  };

  return (
    <TouchableOpacity 
      style={[
        responsiveStyles.coinCard, 
        compact && styles.coinCardCompact
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <ListItemBlur style={styles.cardContainer}>
        {/* Coin Image Section */}
        <View style={[
          responsiveStyles.imageContainer, 
          compact && styles.imageContainerCompact
        ]}>
          <ListOptimizedImage
            uri={coin.obverseImage || ''}
            style={styles.coinImage}
            placeholder={
              <LinearGradient
                colors={['rgba(255, 215, 0, 0.1)', 'rgba(255, 215, 0, 0.05)']}
                style={styles.imagePlaceholder}
              >
                <Text style={styles.coinEmoji}>🪙</Text>
              </LinearGradient>
            }
            resizeMode="cover"
            lazy={false}
            priority="normal"
          />
          
          {renderCertificationBadge()}
          
          {/* Trend indicators removed for simplicity */}
        </View>

        {/* Coin Information */}
        <View style={responsiveStyles.cardInfo}>
          {/* Basic Information */}
          {renderBasicInformation()}
          
          {/* PCGS Pricing Information */}
          {renderPricingInfo()}
        </View>
      </ListItemBlur>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  coinCard: {
    width: '48%',
    marginBottom: Spacing.md,
  },
  coinCardCompact: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  cardContainer: {
    ...GlassmorphismStyles.card,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 120,
    position: 'relative',
  },
  imageContainerCompact: {
    height: 80,
  },
  coinImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinEmoji: {
    fontSize: 48,
  },
  certificationBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  gradeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: '#000',
  },
  certServiceText: {
    fontSize: 8,
    fontWeight: Typography.fontWeight.medium,
    color: '#000',
    marginTop: 1,
  },
  trendBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  trendBadgeText: {
    fontSize: 12,
  },
  cardInfo: {
    padding: Spacing.md,
  },
  basicInfoContainer: {
    marginBottom: Spacing.sm,
  },
  coinName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.xs,
  },
  coinTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  primaryInfo: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  countryInfo: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  mintInfo: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.medium,
  },
  pricingContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.background.cardBorder,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  sourceText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.medium,
  },
  pricingLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  pcgsNote: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary.gold,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default EnhancedCoinCard;