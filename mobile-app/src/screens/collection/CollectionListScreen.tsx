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
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';
import { Input } from '../../components/common';
import { Coin } from '../../types/coin';
import { CoinService } from '../../services/coinService';

interface CollectionListScreenProps {
  navigation: any;
}

interface CoinCardProps {
  coin: Coin;
  onPress: () => void;
}

const CoinCard = ({ coin, onPress }: CoinCardProps) => (
  <TouchableOpacity style={styles.coinCard} onPress={onPress}>
    <BlurView intensity={60} style={styles.cardContainer}>
      {/* Coin Image */}
      <View style={styles.imageContainer}>
        {coin.obverseImage ? (
          <Image source={{ uri: coin.obverseImage }} style={styles.coinImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.coinEmoji}>🪙</Text>
          </View>
        )}
        {coin.grade && (
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeText}>{coin.grade}</Text>
          </View>
        )}
      </View>

      {/* Coin Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.coinTitle} numberOfLines={1}>
          {coin.year} {coin.denomination}
        </Text>
        
        {coin.country && (
          <Text style={styles.coinCountry} numberOfLines={1}>
            {coin.country}
          </Text>
        )}

        {coin.mintMark && (
          <Text style={styles.mintMark}>
            Mint: {coin.mintMark}
          </Text>
        )}

        {coin.purchasePrice && (
          <Text style={styles.coinValue}>
            ${coin.purchasePrice.toLocaleString()}
          </Text>
        )}
      </View>
    </BlurView>
  </TouchableOpacity>
);

export default function CollectionListScreen({ navigation }: CollectionListScreenProps) {
  const insets = useSafeAreaInsets();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [filteredCoins, setFilteredCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Recent', 'US Coins', 'High Value', 'Graded'];

  const loadCoins = useCallback(async () => {
    try {
      const userCoins = await CoinService.getUserCoins();
      setCoins(userCoins);
      setFilteredCoins(userCoins);
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
    <CoinCard coin={item} onPress={() => handleCoinPress(item)} />
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
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={styles.searchSection}>
      {/* Search Bar */}
      <BlurView intensity={60} style={styles.searchContainer}>
        <Input
          placeholder="Search coins..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </BlurView>

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
      <FlatList
        data={filteredCoins}
        renderItem={renderCoinCard}
        numColumns={2}
        contentContainerStyle={[
          styles.listContainer,
          { paddingTop: insets.top + 20 }
        ]}
        ListHeaderComponent={
          <View>
            {renderHeader()}
            {renderSearchAndFilters()}
          </View>
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary.gold}
            colors={[Colors.primary.gold]}
          />
        }
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  coinCard: {
    width: '48%',
    marginBottom: Spacing.md,
  },
  cardContainer: {
    ...GlassmorphismStyles.card,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 120,
    position: 'relative',
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
    backgroundColor: Colors.background.card,
  },
  coinEmoji: {
    fontSize: 48,
  },
  gradeBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primary.gold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gradeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: '#000',
  },
  cardInfo: {
    padding: Spacing.md,
  },
  coinTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  coinCountry: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  mintMark: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  coinValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.gold,
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