// src/screens/collection/CollectionListScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CardBlur } from '../../components/common/OptimizedBlurView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';
import { Input } from '../../components/common';
import { Coin } from '../../types/coin';
import { CoinService } from '../../services/coinService';
import { EnhancedCoinCard } from '../../components/collection/EnhancedCoinCard';
import { CoinPricingService } from '../../services/coinPricingService';
import { useCollectionImagePreloader } from '../../hooks/useImagePreloader';
import { CoinCollectionList } from '../../components/common/VirtualizedList';
import { MemoryService } from '../../services/memoryService';
import { useDeviceInfo } from '../../utils/deviceUtils';

interface CollectionListScreenProps {
  navigation: any;
}

// Enhanced coin card is now imported and used below

export default function CollectionListScreen({ navigation }: CollectionListScreenProps) {
  const insets = useSafeAreaInsets();
  const deviceInfo = useDeviceInfo();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [filteredCoins, setFilteredCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [collectionValue, setCollectionValue] = useState<number>(0);

  // Image preloading for better performance
  const imagePreloader = useCollectionImagePreloader(filteredCoins, !loading);
  
  // Memory management for large collections
  const memoryService = MemoryService.getInstance();
  const shouldOptimize = memoryService.shouldOptimizeForLargeCollection(filteredCoins.length);
  const collectionRecommendations = memoryService.getCollectionSizeRecommendations(filteredCoins.length);

  const filters = ['All', 'Recent', 'US Coins', 'High Value', 'Graded'];

  const loadCoins = useCallback(async () => {
    try {
      const userCoins = await CoinService.getUserCoins();
      setCoins(userCoins);
      setFilteredCoins(userCoins);
      
      // Calculate total collection value
      if (userCoins.length > 0) {
        const insights = await CoinPricingService.getCollectionInsights(userCoins);
        setCollectionValue(insights.totalValue);
      }
    } catch (error) {
      console.error('Error loading coins:', error);
      Alert.alert('Error', 'Failed to load your collection');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCoins();
  }, [loadCoins]);

  useEffect(() => {
    filterCoins();
  }, [searchQuery, activeFilter, coins]);

  const filterCoins = () => {
    let filtered = [...coins];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(coin =>
        coin.denomination.toLowerCase().includes(query) ||
        coin.year.toString().includes(query) ||
        coin.country?.toLowerCase().includes(query) ||
        coin.mintMark?.toLowerCase().includes(query) ||
        coin.grade?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    switch (activeFilter) {
      case 'Recent':
        filtered = filtered.slice(0, 20); // Show last 20 added
        break;
      case 'US Coins':
        filtered = filtered.filter(coin => 
          coin.country?.toLowerCase().includes('united states') || 
          coin.country?.toLowerCase().includes('usa')
        );
        break;
      case 'High Value':
        filtered = filtered.filter(coin => 
          coin.purchasePrice && coin.purchasePrice > 100
        );
        break;
      case 'Graded':
        filtered = filtered.filter(coin => coin.grade);
        break;
    }

    setFilteredCoins(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCoins();
  };

  const handleCoinPress = (coin: Coin) => {
    navigation.navigate('CoinDetail', { coin });
  };

  // Listen for when we return from CoinDetail to refresh the list
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Refresh coins when returning to this screen
      if (!loading) {
        loadCoins();
      }
    });

    return unsubscribe;
  }, [navigation, loading, loadCoins]);

  const renderCoinCard = ({ item }: { item: Coin }) => (
    <EnhancedCoinCard 
      coin={item} 
      onPress={() => handleCoinPress(item)}
      compact={false}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📭</Text>
      <Text style={styles.emptyStateTitle}>No Coins Found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery || activeFilter !== 'All' 
          ? 'Try adjusting your search or filters'
          : 'Start building your collection by adding your first coin!'
        }
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>My Collection</Text>
      <Text style={styles.subtitle}>
        {filteredCoins.length} coin{filteredCoins.length !== 1 ? 's' : ''}
      </Text>
      {collectionValue > 0 && (
        <CardBlur style={styles.valueCard}>
          <Text style={styles.valueLabel}>Estimated Collection Value</Text>
          <Text style={styles.valueAmount}>
            ${collectionValue.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}
          </Text>
          <Text style={styles.valueNote}>
            Based on current market data
          </Text>
        </CardBlur>
      )}
      
      {/* Image preloading progress */}
      {imagePreloader.isPreloading && (
        <CardBlur style={styles.progressCard}>
          <View style={styles.progressRow}>
            <ActivityIndicator size="small" color={Colors.primary.gold} />
            <Text style={styles.progressText}>
              Loading images ({imagePreloader.preloaded}/{imagePreloader.total})
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${imagePreloader.progress * 100}%` }
              ]} 
            />
          </View>
        </CardBlur>
      )}
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={styles.searchSection}>
      {/* Search Bar */}
      <CardBlur style={styles.searchContainer}>
        <Input
          placeholder="Search coins..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </CardBlur>

      {/* Filter Chips */}
      <FlatList
        horizontal
        data={filters}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === item && styles.filterChipActive
            ]}
            onPress={() => setActiveFilter(item)}
          >
            <Text style={[
              styles.filterText,
              activeFilter === item && styles.filterTextActive
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={Colors.background.primary} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.gold} />
          <Text style={styles.loadingText}>Loading your collection...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Colors.background.primary} style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top + 20 }]}>
        {renderHeader()}
        {renderSearchAndFilters()}
      </View>
      
      {filteredCoins.length === 0 ? (
        renderEmptyState()
      ) : shouldOptimize ? (
        <CoinCollectionList
          coins={filteredCoins}
          renderCoin={renderCoinCard}
          numColumns={deviceInfo.responsive.gridColumns}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      ) : (
        <FlatList
          data={filteredCoins}
          renderItem={renderCoinCard}
          numColumns={deviceInfo.responsive.gridColumns}
          contentContainerStyle={[
            styles.listContainer,
            { paddingHorizontal: deviceInfo.responsive.containerPadding }
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary.gold}
              colors={[Colors.primary.gold]}
            />
          }
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={deviceInfo.responsive.gridColumns > 1 ? styles.row : undefined}
          key={`${deviceInfo.responsive.gridColumns}-${deviceInfo.orientation}`}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: Spacing.md,
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.md,
    marginTop: Spacing.md,
  },
  listContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 120, // Space for tab bar
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  valueCard: {
    ...GlassmorphismStyles.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    width: '100%',
    marginTop: Spacing.sm,
  },
  valueLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  valueAmount: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.xs,
  },
  valueNote: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  progressCard: {
    ...GlassmorphismStyles.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    width: '100%',
    marginTop: Spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.background.cardBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.gold,
    borderRadius: 2,
  },
  searchSection: {
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    ...GlassmorphismStyles.card,
    marginBottom: Spacing.md,
  },
  searchInput: {
    margin: 0,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.xs,
  },
  filterChip: {
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.background.cardBorder,
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary.gold,
    borderColor: Colors.primary.gold,
  },
  filterText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  filterTextActive: {
    color: '#000',
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});