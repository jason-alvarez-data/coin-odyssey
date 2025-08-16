// src/screens/profile/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';
import { Button } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import { CoinService } from '../../services/coinService';

interface ProfileScreenProps {
  navigation: any;
}

interface UserStats {
  totalCoins: number;
  totalValue: number;
  joinDate: string;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const coins = await CoinService.getUserCoins();
      const totalCoins = coins.length;
      const totalValue = coins.reduce((sum, coin) => sum + (coin.purchasePrice || 0), 0);
      const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown';
      
      setUserStats({
        totalCoins,
        totalValue,
        joinDate,
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Navigation will be handled automatically by auth context
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>👤 Profile</Text>
          <Text style={styles.subtitle}>Manage your account and settings</Text>
        </View>

        {/* User Info Card */}
        <BlurView intensity={60} style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {user?.email?.split('@')[0] || 'Coin Collector'}
              </Text>
              <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
              <Text style={styles.joinDate}>
                Member since {userStats?.joinDate || 'Unknown'}
              </Text>
            </View>
          </View>
        </BlurView>

        {/* Collection Stats */}
        {loading ? (
          <BlurView intensity={60} style={styles.statsCard}>
            <ActivityIndicator size="large" color={Colors.primary.gold} />
            <Text style={styles.loadingText}>Loading your stats...</Text>
          </BlurView>
        ) : (
          <BlurView intensity={60} style={styles.statsCard}>
            <Text style={styles.sectionTitle}>📊 Collection Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {userStats?.totalCoins?.toLocaleString() || '0'}
                </Text>
                <Text style={styles.statLabel}>Total Coins</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {userStats?.totalValue ? formatCurrency(userStats.totalValue) : '$0'}
                </Text>
                <Text style={styles.statLabel}>Collection Value</Text>
              </View>
            </View>
          </BlurView>
        )}

        {/* Settings & Actions */}
        <BlurView intensity={60} style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>⚙️ Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>🔔 Notifications</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <View style={styles.settingDivider} />
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>🛡️ Privacy & Security</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <View style={styles.settingDivider} />
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>❓ Help & Support</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </BlurView>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <Button
            title="Sign Out"
            onPress={handleLogout}
            style={styles.logoutButton}
            textStyle={styles.logoutButtonText}
          />
        </View>

        <View style={styles.bottomSpacing} />
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
    alignItems: 'center',
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
    textAlign: 'center',
  },
  userCard: {
    ...GlassmorphismStyles.card,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 40,
    color: '#000',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textTransform: 'capitalize',
  },
  userEmail: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  joinDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  statsCard: {
    ...GlassmorphismStyles.card,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.md,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.background.cardBorder,
    marginHorizontal: Spacing.lg,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  settingsCard: {
    ...GlassmorphismStyles.card,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  settingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  settingArrow: {
    fontSize: Typography.fontSize.xl,
    color: Colors.text.secondary,
  },
  settingDivider: {
    height: 1,
    backgroundColor: Colors.background.cardBorder,
    marginVertical: Spacing.sm,
  },
  logoutSection: {
    marginBottom: Spacing.xl,
  },
  logoutButton: {
    backgroundColor: Colors.text.error,
    borderColor: Colors.text.error,
  },
  logoutButtonText: {
    color: 'white',
  },
  bottomSpacing: {
    height: 40,
  },
});