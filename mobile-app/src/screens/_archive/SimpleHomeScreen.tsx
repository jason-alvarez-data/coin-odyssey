// src/screens/SimpleHomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing } from '../styles';
import { Card } from '../components/common';

export default function SimpleHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <LinearGradient 
      colors={Colors.background.primary}
      style={styles.container}
    >
      <ScrollView 
        style={[styles.scrollView, { paddingTop: insets.top }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.subtitle}>Your collection awaits</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { value: '1,247', label: 'Total Coins', icon: '🪙' },
            { value: '$12,450', label: 'Collection Value', icon: '💰' },
            { value: '47', label: 'Countries', icon: '🌍' },
            { value: '156', label: 'Years Span', icon: '📅' },
          ].map((stat, index) => (
            <Card key={stat.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { icon: '📸', label: 'Add Coin', screen: 'Camera' },
              { icon: '🔍', label: 'Scan Barcode', screen: 'Camera' },
              { icon: '📊', label: 'View Analytics', screen: 'Analytics' },
              { icon: '🪙', label: 'Browse Collection', screen: 'Collection' },
            ].map((action, index) => (
              <TouchableOpacity key={action.label} style={styles.actionCard}>
                <Card style={styles.actionCardInner}>
                  <View style={styles.actionIcon}>
                    <Text style={styles.actionEmoji}>{action.icon}</Text>
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Collection Map */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collection Map</Text>
          <Card style={styles.mapCard}>
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapIcon}>🗺️</Text>
              <Text style={styles.mapTitle}>World Collection Overview</Text>
              <Text style={styles.mapSubtitle}>47 countries • 5 continents</Text>
              <View style={styles.mapCountries}>
                <View style={styles.countryTag}>
                  <Text style={styles.countryFlag}>🇺🇸</Text>
                  <Text style={styles.countryName}>USA (847)</Text>
                </View>
                <View style={styles.countryTag}>
                  <Text style={styles.countryFlag}>🇬🇧</Text>
                  <Text style={styles.countryName}>UK (156)</Text>
                </View>
                <View style={styles.countryTag}>
                  <Text style={styles.countryFlag}>🇨🇦</Text>
                  <Text style={styles.countryName}>Canada (89)</Text>
                </View>
                <View style={styles.countryTag}>
                  <Text style={styles.countryFlag}>🇩🇪</Text>
                  <Text style={styles.countryName}>Germany (42)</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.mapButton}
                onPress={() => navigation.navigate('Map' as never)}
              >
                <Text style={styles.mapButtonText}>View Full Map</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Card style={styles.activityCard}>
            <View style={styles.activityItem}>
              <Text style={styles.activityIcon}>🪙</Text>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Added 1921 Morgan Dollar</Text>
                <Text style={styles.activityDate}>2 hours ago</Text>
              </View>
              <Text style={styles.activityValue}>$2,450</Text>
            </View>
            <View style={[styles.activityItem, styles.activityItemBorder]}>
              <Text style={styles.activityIcon}>📈</Text>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Collection value updated</Text>
                <Text style={styles.activityDate}>1 day ago</Text>
              </View>
              <Text style={styles.activityValue}>+$125</Text>
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
    flex: 1,
    minWidth: '45%',
  },
  actionCardInner: {
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
  activityCard: {
    padding: Spacing.lg,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  activityItemBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.background.cardBorder,
  },
  activityIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  activityDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  activityValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.success,
  },
  mapCard: {
    padding: Spacing.lg,
  },
  mapPlaceholder: {
    alignItems: 'center',
  },
  mapIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  mapTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  mapSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  mapCountries: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  countryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.background.cardBorder,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  countryFlag: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  countryName: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  mapButton: {
    backgroundColor: Colors.primary.gold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
  },
  mapButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: '#000',
  },
});