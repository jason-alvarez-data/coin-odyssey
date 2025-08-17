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
import { DashboardStackScreenProps } from '../../types/navigation';
import { GeographicService, GeographicData } from '../../services/geographicService';
import { GoalsService } from '../../services/goalsService';
import { CollectionGoal } from '../../types/goal';

type DashboardScreenProps = DashboardStackScreenProps<'DashboardHome'>;

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
  const [geographicData, setGeographicData] = useState<GeographicData | null>(null);
  const [goals, setGoals] = useState<CollectionGoal[]>([]);
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
      // Load all data in parallel for better performance
      const [coins, geoData, userGoals] = await Promise.all([
        CoinService.getUserCoins(),
        GeographicService.getGeographicData(),
        GoalsService.getUserGoals(),
      ]);

      const calculatedStats = calculateStats(coins);
      setStats(calculatedStats);
      setGeographicData(geoData);
      setGoals(userGoals);

      // Update goals progress (don't await to avoid blocking UI)
      GoalsService.updateAllGoalsProgress().catch(console.error);
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
      setGeographicData(null);
      setGoals([]);
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
        // Navigate to Collection tab, then to AddCoin screen
        navigation.getParent()?.navigate('Collection', { screen: 'AddCoin' });
        break;
      case 'View Collection':
        // Navigate to Collection tab
        navigation.getParent()?.navigate('Collection');
        break;
      case 'View Analytics':
        // Navigate to Analytics tab
        navigation.getParent()?.navigate('Analytics');
        break;
      case 'Explore Map':
        // Navigate within the same stack to Map
        navigation.navigate('Map');
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
          <View style={styles.statsRow}>
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
            ].map((stat) => (
              <BlurView key={stat.label} intensity={60} style={styles.statCard}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </BlurView>
            ))}
          </View>
          <View style={styles.statsRow}>
            {[
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
        </View>

        {/* Quick Actions - Streamlined */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {[
              { icon: '➕', label: 'Add Coin' },
              { icon: '📊', label: 'View Analytics' },
              { icon: '🌍', label: 'Explore Map' },
            ].map((action) => (
              <TouchableOpacity 
                key={action.label}
                style={styles.actionCardContainer}
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

        {/* Collection Goals - Separate Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 Collection Goals</Text>
            <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profile')}>
              <Text style={styles.sectionAction}>Manage Goals</Text>
            </TouchableOpacity>
          </View>
          {goals.length === 0 ? (
            <BlurView intensity={60} style={styles.emptyGoalsCard}>
              <Text style={styles.emptyGoalsIcon}>🎯</Text>
              <Text style={styles.emptyGoalsTitle}>Set Your First Goal</Text>
              <Text style={styles.emptyGoalsText}>
                Create collection goals to track your progress and stay motivated!
              </Text>
              <TouchableOpacity 
                style={styles.createGoalButton}
                onPress={() => navigation.getParent()?.navigate('Profile')}
              >
                <Text style={styles.createGoalButtonText}>Create Goal</Text>
              </TouchableOpacity>
            </BlurView>
          ) : (
            <View style={styles.goalsContainer}>
              {goals.slice(0, 2).map((goal) => (
                <BlurView key={goal.id} intensity={60} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalTitle} numberOfLines={1}>
                      {goal.title}
                    </Text>
                    <Text style={styles.goalProgress}>
                      {goal.currentCount}/{goal.targetCount}
                    </Text>
                  </View>
                  <View style={styles.goalProgressBar}>
                    <View 
                      style={[
                        styles.goalProgressFill, 
                        { width: `${Math.min((goal.currentCount / goal.targetCount) * 100, 100)}%` }
                      ]} 
                    />
                  </View>
                  <View style={styles.goalFooter}>
                    <Text style={styles.goalCategory}>{goal.category.replace('_', ' ')}</Text>
                    <Text style={styles.goalPercentage}>
                      {Math.round((goal.currentCount / goal.targetCount) * 100)}%
                    </Text>
                  </View>
                </BlurView>
              ))}
            </View>
          )}
        </View>

        {/* Geographic Summary */}
        {geographicData && geographicData.totalCountries > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Geographic Overview</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Map')}>
                <Text style={styles.sectionAction}>View Map</Text>
              </TouchableOpacity>
            </View>
            <BlurView intensity={60} style={styles.geoCard}>
              <View style={styles.geoHeader}>
                <Text style={styles.geoIcon}>🗺️</Text>
                <View>
                  <Text style={styles.geoTitle}>World Collection</Text>
                  <Text style={styles.geoSubtitle}>
                    {geographicData.totalCountries} countries • {geographicData.totalContinents} continents
                  </Text>
                </View>
              </View>
              <View style={styles.geoCountries}>
                {geographicData.continents.slice(0, 3).map((continent) => (
                  <View key={continent.name} style={styles.geoCountryItem}>
                    <Text style={styles.geoCountryFlag}>{continent.icon}</Text>
                    <View>
                      <Text style={styles.geoCountryName}>{continent.name}</Text>
                      <Text style={styles.geoCountryCount}>{continent.coins} coins</Text>
                    </View>
                  </View>
                ))}
              </View>
              {geographicData.insights.collectionGoal && (
                <View style={styles.geoGoal}>
                  <Text style={styles.geoGoalText}>
                    Collection Goal: {geographicData.insights.collectionGoal.current}/{geographicData.insights.collectionGoal.target} countries
                  </Text>
                  <View style={styles.geoGoalBar}>
                    <View 
                      style={[
                        styles.geoGoalFill, 
                        { width: `${geographicData.insights.collectionGoal.percentage}%` }
                      ]} 
                    />
                  </View>
                </View>
              )}
            </BlurView>
          </View>
        )}

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
                  onPress={() => navigation.getParent()?.navigate('Collection', {
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
              onPress={() => navigation.getParent()?.navigate('Collection', { screen: 'AddCoin' })}
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
    marginBottom: Spacing['2xl'],
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    ...GlassmorphismStyles.card,
    flex: 1,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionAction: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.gold,
    fontWeight: Typography.fontWeight.semibold,
  },
  actionsGrid: {
    // Container for action rows
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  actionCardContainer: {
    flex: 1,
  },
  actionCard: {
    ...GlassmorphismStyles.card,
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
  // Collection Goals Styles
  goalsContainer: {
    gap: Spacing.md,
  },
  goalCard: {
    ...GlassmorphismStyles.card,
    padding: Spacing.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  goalTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  goalProgress: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
  },
  goalProgressBar: {
    height: 6,
    backgroundColor: Colors.background.cardBorder,
    borderRadius: 3,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary.gold,
    borderRadius: 3,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalCategory: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
  goalPercentage: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  emptyGoalsCard: {
    ...GlassmorphismStyles.card,
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyGoalsIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  emptyGoalsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyGoalsText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  createGoalButton: {
    backgroundColor: Colors.primary.gold,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  createGoalButtonText: {
    color: '#000',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  // Geographic Summary Styles
  geoCard: {
    ...GlassmorphismStyles.card,
    padding: Spacing.lg,
  },
  geoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  geoIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  geoTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  geoSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  geoCountries: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  geoCountryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  geoCountryFlag: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  geoCountryName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  geoCountryCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  geoGoal: {
    borderTopWidth: 1,
    borderTopColor: Colors.background.cardBorder,
    paddingTop: Spacing.md,
  },
  geoGoalText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  geoGoalBar: {
    height: 4,
    backgroundColor: Colors.background.cardBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  geoGoalFill: {
    height: '100%',
    backgroundColor: Colors.primary.gold,
    borderRadius: 2,
  },
});