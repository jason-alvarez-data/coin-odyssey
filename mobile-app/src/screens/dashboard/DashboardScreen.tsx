// src/screens/dashboard/DashboardScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';
import { Card } from '../../components/common';
import { Coin } from '../../types/coin';
import { CoinService } from '../../services/coinService';

interface DashboardScreenProps {
  navigation: any;
}

interface CollectionStats {
  totalCoins: number;
  totalValue: number;
  uniqueCountries: number;
  yearSpan: string;
  recentCoins: Coin[];
}

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const calculateStats = useCallback((coins: Coin[]): CollectionStats => {
    const totalCoins = coins.length;
    const totalValue = coins.reduce((sum, coin) => sum + (coin.purchasePrice || 0), 0);
    
    // Get unique countries
    const countries = new Set(coins.map(coin => coin.country).filter(Boolean));
    const uniqueCountries = countries.size;
    
    // Calculate year span
    const years = coins.map(coin => coin.year).filter(Boolean);
    const yearSpan = years.length > 0 
      ? `${Math.min(...years)} - ${Math.max(...years)}`
      : 'No coins';
    
    // Get recent coins (last 5 added)
    const recentCoins = coins
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalCoins,
      totalValue,
      uniqueCountries,
      yearSpan,
      recentCoins,
    };
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      const coins = await CoinService.getUserCoins();
      const calculatedStats = calculateStats(coins);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set empty stats on error
      setStats({
        totalCoins: 0,
        totalValue: 0,
        uniqueCountries: 0,
        yearSpan: 'No coins',
        recentCoins: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [calculateStats]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Listen for when we return from other screens to refresh
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!loading) {
        loadDashboardData();
      }
    });

    return unsubscribe;
  }, [navigation, loading, loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Add Coin':
        navigation.navigate('AddCoin');
        break;
      case 'View Collection':
        navigation.navigate('Collection');
        break;
      case 'View Analytics':
        navigation.navigate('Analytics');
        break;
      case 'Explore Map':
        // TODO: Add map functionality
        break;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && !stats) {
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
    <LinearGradient 
      colors={Colors.background.primary}
      style={styles.container}
    >
      <ScrollView 
        style={[styles.scrollView, { paddingTop: insets.top }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary.gold}
            colors={[Colors.primary.gold]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.subtitle}>
            {stats?.totalCoins 
              ? `${stats.totalCoins} coin${stats.totalCoins !== 1 ? 's' : ''} in your collection`
              : 'Start building your collection'
            }
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { 
              value: stats?.totalCoins?.toLocaleString() || '0', 
              label: 'Total Coins', 
              icon: '🪙' 
            },
            { 
              value: stats?.totalValue ? formatCurrency(stats.totalValue) : '$0', 
              label: 'Collection Value', 
              icon: '💰' 
            },
            { 
              value: stats?.uniqueCountries?.toString() || '0', 
              label: 'Countries', 
              icon: '🌍' 
            },
            { 
              value: stats?.yearSpan || 'No coins', 
              label: 'Year Span', 
              icon: '📅' 
            },
          ].map((stat) => (
            <BlurView key={stat.label} intensity={60} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </BlurView>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { icon: '➕', label: 'Add Coin' },
              { icon: '🪙', label: 'View Collection' },
              { icon: '📊', label: 'View Analytics' },
              { icon: '🌍', label: 'Explore Map' },
            ].map((action) => (
              <TouchableOpacity 
                key={action.label}
                onPress={() => handleQuickAction(action.label)}
              >
                <BlurView intensity={60} style={styles.actionCard}>
                  <View style={styles.actionIcon}>
                    <Text style={styles.actionEmoji}>{action.icon}</Text>
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        {stats?.recentCoins && stats.recentCoins.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Additions</Text>
            <BlurView intensity={60} style={styles.activityCard}>
              {stats.recentCoins.map((coin, index) => (
                <TouchableOpacity
                  key={coin.id}
                  style={[
                    styles.activityItem,
                    index < stats.recentCoins.length - 1 && styles.activityItemBorder
                  ]}
                  onPress={() => navigation.navigate('Collection', {
                    screen: 'CoinDetail',
                    params: { coin }
                  })}
                >
                  <View style={styles.activityIcon}>
                    <Text style={styles.activityEmoji}>🪙</Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>
                      {coin.year} {coin.denomination}
                    </Text>
                    <Text style={styles.activityDate}>
                      Added {new Date(coin.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {coin.purchasePrice && (
                    <Text style={styles.activityValue}>
                      {formatCurrency(coin.purchasePrice)}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </BlurView>
          </View>
        )}

        {/* Empty State */}
        {stats?.totalCoins === 0 && (
          <BlurView intensity={60} style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📭</Text>
            <Text style={styles.emptyStateTitle}>Start Your Collection</Text>
            <Text style={styles.emptyStateText}>
              Add your first coin to begin tracking your collection!
            </Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('AddCoin')}
            >
              <Text style={styles.emptyStateButtonText}>Add First Coin</Text>
            </TouchableOpacity>
          </BlurView>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 120, // Account for tab bar
  },
  header: {
    paddingVertical: Spacing['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.cardBorder,
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  statCard: {
    ...GlassmorphismStyles.card,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    ...GlassmorphismStyles.card,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  actionIcon: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary.gold,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  // Activity Feed Styles
  activityCard: {
    ...GlassmorphismStyles.card,
    padding: 0,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.cardBorder,
  },
  activityIcon: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary.gold,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityEmoji: {
    fontSize: 20,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  activityDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  activityValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
  },
  // Empty State Styles
  emptyState: {
    ...GlassmorphismStyles.card,
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
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
    marginBottom: Spacing.xl,
  },
  emptyStateButton: {
    backgroundColor: Colors.primary.gold,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#000',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  // Loading Styles
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
    textAlign: 'center',
  },
});