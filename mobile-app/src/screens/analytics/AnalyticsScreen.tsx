// src/screens/analytics/AnalyticsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';
import { AnalyticsService, AnalyticsData } from '../../services/analyticsService';
import { ValueChart } from '../../components/analytics/ValueChart';
import { CountryDistributionChart } from '../../components/analytics/CountryDistributionChart';
import { TimelineChart } from '../../components/analytics/TimelineChart';
import { MetricCard } from '../../components/analytics/MetricCard';

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1M' | '3M' | '6M' | '1Y'>('3M');

  const loadAnalyticsData = useCallback(async () => {
    try {
      const data = await AnalyticsService.getAnalyticsData();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalyticsData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && !analyticsData) {
    return (
      <LinearGradient colors={Colors.background.primary} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.gold} />
          <Text style={styles.loadingText}>Analyzing your collection...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!analyticsData || analyticsData.overview.totalCoins === 0) {
    return (
      <LinearGradient colors={Colors.background.primary} style={styles.container}>
        <View style={[styles.content, { paddingTop: insets.top }]}>
          <Text style={styles.title}>📊 Analytics</Text>
          <BlurView intensity={60} style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📈</Text>
            <Text style={styles.emptyTitle}>No Analytics Yet</Text>
            <Text style={styles.emptyText}>
              Add some coins to your collection to see detailed analytics and insights.
            </Text>
          </BlurView>
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
          <Text style={styles.title}>📊 Analytics</Text>
          <Text style={styles.subtitle}>
            Insights into your {analyticsData.overview.totalCoins} coin collection
          </Text>
        </View>

        {/* Key Metrics Grid */}
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total Value"
            value={formatCurrency(analyticsData.overview.totalValue)}
            subtitle="Collection worth"
            icon="💰"
            size="large"
          />
          
          <View style={styles.metricsRow}>
            <MetricCard
              title="Coins"
              value={analyticsData.overview.totalCoins}
              subtitle="Total pieces"
              icon="🪙"
              size="small"
            />
            <MetricCard
              title="Countries"
              value={analyticsData.overview.uniqueCountries}
              subtitle="Global reach"
              icon="🌍"
              size="small"
            />
            <MetricCard
              title="Avg Value"
              value={formatCurrency(analyticsData.overview.averageValue)}
              subtitle="Per coin"
              icon="📊"
              size="small"
            />
          </View>
          
          <View style={styles.metricsRow}>
            <MetricCard
              title="Recent"
              value={analyticsData.overview.recentlyAdded}
              subtitle="Last 30 days"
              icon="📅"
              change={{
                value: analyticsData.overview.recentlyAdded > 0 ? 15 : 0,
                isPositive: true,
                period: 'vs last month'
              }}
            />
            <MetricCard
              title="Time Span"
              value={analyticsData.overview.yearSpan}
              subtitle="Historical range"
              icon="⏰"
            />
          </View>
        </View>

        {/* Collection Value Progression */}
        {analyticsData.valueProgression.length > 0 && (
          <ValueChart
            data={analyticsData.valueProgression}
            title="Collection Value Growth"
            subtitle="Cumulative value over time"
          />
        )}

        {/* Acquisition Timeline */}
        {analyticsData.acquisitionTimeline.length > 0 && (
          <TimelineChart
            data={analyticsData.acquisitionTimeline}
            title="Acquisition Timeline"
            type="acquisitions"
          />
        )}

        {/* Country Distribution */}
        {analyticsData.countryDistribution.length > 0 && (
          <CountryDistributionChart
            data={analyticsData.countryDistribution}
            title="Country Distribution"
          />
        )}

        {/* Insights */}
        {analyticsData.insights.length > 0 && (
          <BlurView intensity={60} style={styles.insightsContainer}>
            <Text style={styles.sectionTitle}>💡 Collection Insights</Text>
            {analyticsData.insights.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  {insight.metric && (
                    <Text style={styles.insightMetric}>{insight.metric}</Text>
                  )}
                </View>
                <Text style={styles.insightDescription}>{insight.description}</Text>
              </View>
            ))}
          </BlurView>
        )}

        {/* Top Performers */}
        {analyticsData.topPerformers.length > 0 && (
          <BlurView intensity={60} style={styles.topPerformersContainer}>
            <Text style={styles.sectionTitle}>🏆 Most Valuable Coins</Text>
            {analyticsData.topPerformers.slice(0, 5).map((performer, index) => (
              <View key={performer.coin.id} style={styles.performerItem}>
                <View style={styles.performerRank}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.performerInfo}>
                  <Text style={styles.performerName}>
                    {performer.coin.year} {performer.coin.denomination}
                  </Text>
                  <Text style={styles.performerDetails}>
                    {performer.coin.country} • {performer.coin.mintMark || 'No mint mark'}
                  </Text>
                </View>
                <Text style={styles.performerValue}>
                  {formatCurrency(performer.value)}
                </Text>
              </View>
            ))}
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
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
  },
  metricsGrid: {
    marginBottom: Spacing['2xl'],
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  insightsContainer: {
    ...GlassmorphismStyles.card,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  insightItem: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.cardBorder,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  insightTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  insightMetric: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
  },
  insightDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  topPerformersContainer: {
    ...GlassmorphismStyles.card,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  performerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.cardBorder,
  },
  performerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  rankNumber: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: '#000',
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  performerDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  performerValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
  },
  // Loading and Empty States
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
  emptyCard: {
    ...GlassmorphismStyles.card,
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
    width: '100%',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});