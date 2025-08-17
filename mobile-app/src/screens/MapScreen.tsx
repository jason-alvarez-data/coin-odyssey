// src/screens/MapScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing } from '../styles';
import { Card } from '../components/common';
import { GeographicService, GeographicData } from '../services/geographicService';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [geographicData, setGeographicData] = useState<GeographicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGeographicData = useCallback(async () => {
    try {
      const data = await GeographicService.getGeographicData();
      setGeographicData(data);
    } catch (error) {
      console.error('Error loading geographic data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadGeographicData();
  }, [loadGeographicData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadGeographicData();
  };

  if (loading && !geographicData) {
    return (
      <LinearGradient colors={Colors.background.primary as any} style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Collection Map</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.gold} />
          <Text style={styles.loadingText}>Loading your collection map...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!geographicData || geographicData.totalCoins === 0) {
    return (
      <LinearGradient colors={Colors.background.primary as any} style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Collection Map</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyTitle}>No Geographic Data</Text>
          <Text style={styles.emptyText}>
            Add coins with country information to see your collection map.
          </Text>
        </View>
      </LinearGradient>
    );
  }


  return (
    <LinearGradient colors={Colors.background.primary as any} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Collection Map</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
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
        {/* Map Overview */}
        <Card style={styles.overviewCard}>
          <View style={styles.mapDisplay}>
            <Text style={styles.worldIcon}>🗺️</Text>
            <Text style={styles.mapTitle}>World Collection</Text>
            <Text style={styles.mapStats}>
              {geographicData.totalCoins} coins • {geographicData.totalCountries} countries • {geographicData.totalContinents} continents
            </Text>
          </View>
        </Card>

        {/* Continents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Continent</Text>
          {geographicData.continents.map((continent, index) => (
            <Card key={continent.name} style={styles.continentCard}>
              <View style={styles.continentHeader}>
                <View style={styles.continentInfo}>
                  <Text style={styles.continentIcon}>{continent.icon}</Text>
                  <View>
                    <Text style={styles.continentName}>{continent.name}</Text>
                    <Text style={styles.continentStats}>
                      {continent.countries} countries • {continent.coins} coins
                    </Text>
                  </View>
                </View>
                <Text style={styles.continentValue}>{continent.coins}</Text>
              </View>
              
              {/* Countries in continent */}
              <View style={styles.countriesGrid}>
                {continent.countries_detail.map((country, countryIndex) => (
                  <TouchableOpacity key={country.name} style={styles.countryItem}>
                    <Text style={styles.countryFlag}>{country.flag}</Text>
                    <View style={styles.countryInfo}>
                      <Text style={styles.countryName}>{country.name}</Text>
                      <Text style={styles.countryCoins}>{country.coins} coins</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          ))}
        </View>

        {/* Collection Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Geographic Insights</Text>
          <Card style={styles.insightsCard}>
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>🏆</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Most Collected Country</Text>
                <Text style={styles.insightValue}>
                  {geographicData.insights.mostCollectedCountry 
                    ? `${geographicData.insights.mostCollectedCountry.flag} ${geographicData.insights.mostCollectedCountry.name} (${geographicData.insights.mostCollectedCountry.coins} coins)`
                    : 'No data available'
                  }
                </Text>
              </View>
            </View>
            
            <View style={[styles.insightItem, styles.insightBorder]}>
              <Text style={styles.insightIcon}>🌟</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Least Represented Region</Text>
                <Text style={styles.insightValue}>{geographicData.insights.rarestRegion}</Text>
              </View>
            </View>
            
            <View style={[styles.insightItem, styles.insightBorder]}>
              <Text style={styles.insightIcon}>📈</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Collection Goal</Text>
                <Text style={styles.insightValue}>
                  Target: {geographicData.insights.collectionGoal.target} countries 
                  ({geographicData.insights.collectionGoal.percentage}% complete)
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.cardBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.background.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: Colors.primary.gold,
    fontWeight: Typography.fontWeight.bold,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40, // Same width as back button for centering
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  overviewCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.xl,
  },
  mapDisplay: {
    alignItems: 'center',
  },
  worldIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  mapTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.sm,
  },
  mapStats: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.lg,
  },
  continentCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  continentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  continentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  continentIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  continentName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  continentStats: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  continentValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
  },
  countriesGrid: {
    gap: Spacing.sm,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.background.cardBorder,
  },
  countryFlag: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  countryCoins: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  insightsCard: {
    padding: Spacing.lg,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  insightBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.background.cardBorder,
  },
  insightIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  insightValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
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