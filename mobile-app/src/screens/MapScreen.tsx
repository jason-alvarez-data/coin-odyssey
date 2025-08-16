// src/screens/MapScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing } from '../styles';
import { Card } from '../components/common';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const continents = [
    {
      name: 'North America',
      countries: 3,
      coins: 936,
      icon: '🌎',
      countries_detail: [
        { name: 'United States', flag: '🇺🇸', coins: 847 },
        { name: 'Canada', flag: '🇨🇦', coins: 89 },
      ]
    },
    {
      name: 'Europe',
      countries: 12,
      coins: 298,
      icon: '🌍',
      countries_detail: [
        { name: 'United Kingdom', flag: '🇬🇧', coins: 156 },
        { name: 'Germany', flag: '🇩🇪', coins: 42 },
        { name: 'France', flag: '🇫🇷', coins: 38 },
        { name: 'Italy', flag: '🇮🇹', coins: 24 },
        { name: 'Spain', flag: '🇪🇸', coins: 18 },
        { name: 'Netherlands', flag: '🇳🇱', coins: 12 },
        { name: 'Switzerland', flag: '🇨🇭', coins: 8 },
      ]
    },
    {
      name: 'Asia',
      countries: 8,
      coins: 89,
      icon: '🌏',
      countries_detail: [
        { name: 'Japan', flag: '🇯🇵', coins: 34 },
        { name: 'China', flag: '🇨🇳', coins: 28 },
        { name: 'India', flag: '🇮🇳', coins: 15 },
        { name: 'South Korea', flag: '🇰🇷', coins: 12 },
      ]
    },
    {
      name: 'Oceania',
      countries: 2,
      coins: 24,
      icon: '🌏',
      countries_detail: [
        { name: 'Australia', flag: '🇦🇺', coins: 18 },
        { name: 'New Zealand', flag: '🇳🇿', coins: 6 },
      ]
    }
  ];

  return (
    <LinearGradient colors={Colors.background.primary} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Collection Map</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Map Overview */}
        <Card style={styles.overviewCard}>
          <View style={styles.mapDisplay}>
            <Text style={styles.worldIcon}>🗺️</Text>
            <Text style={styles.mapTitle}>World Collection</Text>
            <Text style={styles.mapStats}>1,347 coins • 47 countries • 5 continents</Text>
          </View>
        </Card>

        {/* Continents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Continent</Text>
          {continents.map((continent, index) => (
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
                <Text style={styles.insightValue}>🇺🇸 United States (847 coins)</Text>
              </View>
            </View>
            
            <View style={[styles.insightItem, styles.insightBorder]}>
              <Text style={styles.insightIcon}>🌟</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Rarest Region</Text>
                <Text style={styles.insightValue}>🌍 Africa (3 countries)</Text>
              </View>
            </View>
            
            <View style={[styles.insightItem, styles.insightBorder]}>
              <Text style={styles.insightIcon}>📈</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Collection Goal</Text>
                <Text style={styles.insightValue}>Target: 50 countries (94% complete)</Text>
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
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.cardBorder,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
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
});