// src/screens/profile/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  TextInput,
  Modal 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, GlassmorphismStyles } from '../../styles';
import { Button } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import { CoinService } from '../../services/coinService';
import { GoalsService } from '../../services/goalsService';
import { CollectionGoal, GOAL_TEMPLATES, GoalTemplate, GoalType, GoalCategory } from '../../types/goal';

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
  const [goals, setGoals] = useState<CollectionGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [showGoalTemplates, setShowGoalTemplates] = useState(false);
  const [showCustomGoalForm, setShowCustomGoalForm] = useState(false);
  const [customGoal, setCustomGoal] = useState({
    title: '',
    description: '',
    goalType: 'custom' as GoalType,
    category: 'general' as GoalCategory,
    targetCount: 1,
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [coins, userGoals] = await Promise.all([
        CoinService.getUserCoins(),
        GoalsService.getUserGoals(),
      ]);

      const totalCoins = coins.length;
      const totalValue = coins.reduce((sum, coin) => sum + (coin.purchasePrice || 0), 0);
      const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown';
      
      setUserStats({
        totalCoins,
        totalValue,
        joinDate,
      });
      setGoals(userGoals);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoalFromTemplate = async (template: GoalTemplate) => {
    setGoalsLoading(true);
    try {
      const newGoal = await GoalsService.createGoalFromTemplate(template.id);
      if (newGoal) {
        setGoals(prev => [newGoal, ...prev]);
        setShowGoalTemplates(false);
        Alert.alert('Goal Created!', `Your "${template.title}" goal has been created.`);
      } else {
        Alert.alert('Error', 'Failed to create goal. Please try again.');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      Alert.alert('Error', 'Failed to create goal. Please try again.');
    } finally {
      setGoalsLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: string, goalTitle: string) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goalTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await GoalsService.deleteGoal(goalId);
            if (success) {
              setGoals(prev => prev.filter(g => g.id !== goalId));
            } else {
              Alert.alert('Error', 'Failed to delete goal. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCreateCustomGoal = async () => {
    if (!customGoal.title.trim()) {
      Alert.alert('Error', 'Please enter a goal title.');
      return;
    }

    setGoalsLoading(true);
    try {
      const newGoal = await GoalsService.createGoal({
        title: customGoal.title,
        description: customGoal.description,
        goalType: customGoal.goalType,
        criteria: {}, // Empty criteria for custom goals - user can customize later
        targetCount: customGoal.targetCount,
        userId: '', // Will be set in GoalsService
        priority: customGoal.priority,
        category: customGoal.category,
      });

      if (newGoal) {
        setGoals(prev => [newGoal, ...prev]);
        setShowCustomGoalForm(false);
        setCustomGoal({
          title: '',
          description: '',
          goalType: 'custom',
          category: 'general',
          targetCount: 1,
          priority: 'medium',
        });
        Alert.alert('Goal Created!', `Your custom goal "${customGoal.title}" has been created.`);
      } else {
        Alert.alert('Error', 'Failed to create goal. Please try again.');
      }
    } catch (error) {
      console.error('Error creating custom goal:', error);
      Alert.alert('Error', 'Failed to create goal. Please try again.');
    } finally {
      setGoalsLoading(false);
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

        {/* Goals Management */}
        <BlurView intensity={60} style={styles.goalsCard}>
          <Text style={styles.sectionTitle}>🎯 Collection Goals</Text>
          <View style={styles.goalsActionButtons}>
            <TouchableOpacity 
              style={[styles.addGoalButton, styles.customGoalButton]}
              onPress={() => setShowCustomGoalForm(true)}
            >
              <Text style={styles.addGoalButtonText}>✏️ Custom</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addGoalButton}
              onPress={() => setShowGoalTemplates(!showGoalTemplates)}
            >
              <Text style={styles.addGoalButtonText}>
                {showGoalTemplates ? '✕' : '📋 Templates'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Goal Templates */}
          {showGoalTemplates && (
            <View style={styles.templatesSection}>
              <Text style={styles.templatesTitle}>Choose a Goal Template:</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.templatesScrollContainer}
                style={styles.templatesScroll}
              >
                {GOAL_TEMPLATES.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={styles.templateItem}
                    onPress={() => handleCreateGoalFromTemplate(template)}
                    disabled={goalsLoading}
                  >
                    <View style={styles.templateHeader}>
                      <Text style={styles.templateTitle}>{template.title}</Text>
                      <View style={styles.templateDifficulty}>
                        <Text style={styles.templateDifficultyText}>
                          {template.estimatedDifficulty}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.templateDescription} numberOfLines={3}>
                      {template.description}
                    </Text>
                    <View style={styles.templateFooter}>
                      <Text style={styles.templateTarget}>
                        Target: {template.targetCount} items
                      </Text>
                      <Text style={styles.templateTime}>
                        ~{template.estimatedTimeframe}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Current Goals */}
          {goals.length === 0 ? (
            <View style={styles.emptyGoals}>
              <Text style={styles.emptyGoalsIcon}>🎯</Text>
              <Text style={styles.emptyGoalsText}>
                No goals yet. Create your first goal to start tracking your collecting progress!
              </Text>
            </View>
          ) : (
            <View style={styles.goalsList}>
              {goals.map((goal) => (
                <View key={goal.id} style={styles.goalItem}>
                  <View style={styles.goalItemHeader}>
                    <Text style={styles.goalItemTitle} numberOfLines={1}>
                      {goal.title}
                    </Text>
                    <TouchableOpacity
                      style={styles.deleteGoalButton}
                      onPress={() => handleDeleteGoal(goal.id, goal.title)}
                    >
                      <Text style={styles.deleteGoalText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.goalItemDescription} numberOfLines={2}>
                    {goal.description}
                  </Text>
                  
                  <View style={styles.goalItemProgress}>
                    <Text style={styles.goalItemProgressText}>
                      {goal.currentCount} / {goal.targetCount} completed
                    </Text>
                    <Text style={styles.goalItemPercentage}>
                      {Math.round((goal.currentCount / goal.targetCount) * 100)}%
                    </Text>
                  </View>
                  
                  <View style={styles.goalItemProgressBar}>
                    <View 
                      style={[
                        styles.goalItemProgressFill,
                        { width: `${Math.min((goal.currentCount / goal.targetCount) * 100, 100)}%` }
                      ]}
                    />
                  </View>

                  <View style={styles.goalItemFooter}>
                    <Text style={styles.goalItemCategory}>
                      {goal.category.replace('_', ' ')}
                    </Text>
                    <Text style={styles.goalItemPriority}>
                      {goal.priority} priority
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {goalsLoading && (
            <View style={styles.goalsLoading}>
              <ActivityIndicator size="small" color={Colors.primary.gold} />
              <Text style={styles.goalsLoadingText}>Creating goal...</Text>
            </View>
          )}
        </BlurView>

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
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Custom Goal Creation Modal */}
      <Modal
        visible={showCustomGoalForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCustomGoalForm(false)}
      >
        <LinearGradient 
          colors={Colors.background.primary}
          style={styles.modalContainer}
        >
          <ScrollView 
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Custom Goal</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowCustomGoalForm(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <BlurView intensity={60} style={styles.customGoalForm}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Goal Title *</Text>
                <TextInput
                  style={styles.formInput}
                  value={customGoal.title}
                  onChangeText={(text) => setCustomGoal(prev => ({ ...prev, title: text }))}
                  placeholder="Enter your goal title..."
                  placeholderTextColor={Colors.text.tertiary}
                  maxLength={100}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={customGoal.description}
                  onChangeText={(text) => setCustomGoal(prev => ({ ...prev, description: text }))}
                  placeholder="Describe your goal..."
                  placeholderTextColor={Colors.text.tertiary}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Target Count *</Text>
                <TextInput
                  style={styles.formInput}
                  value={customGoal.targetCount.toString()}
                  onChangeText={(text) => {
                    const count = parseInt(text) || 1;
                    setCustomGoal(prev => ({ ...prev, targetCount: Math.max(1, count) }));
                  }}
                  placeholder="1"
                  placeholderTextColor={Colors.text.tertiary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
                  {[
                    { key: 'general', label: '🔄 General' },
                    { key: 'us_coins', label: '🇺🇸 US Coins' },
                    { key: 'world_coins', label: '🌍 World Coins' },
                    { key: 'ancient_coins', label: '🏛️ Ancient' },
                    { key: 'modern_coins', label: '✨ Modern' },
                    { key: 'commemoratives', label: '🏆 Commemorative' },
                    { key: 'precious_metals', label: '🥇 Precious Metals' },
                  ].map((category) => (
                    <TouchableOpacity
                      key={category.key}
                      style={[
                        styles.categoryOption,
                        customGoal.category === category.key && styles.categoryOptionSelected
                      ]}
                      onPress={() => setCustomGoal(prev => ({ ...prev, category: category.key as GoalCategory }))}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        customGoal.category === category.key && styles.categoryOptionTextSelected
                      ]}>
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Priority</Text>
                <View style={styles.prioritySelector}>
                  {[
                    { key: 'low', label: '🟢 Low', color: '#10B981' },
                    { key: 'medium', label: '🟡 Medium', color: '#F59E0B' },
                    { key: 'high', label: '🔴 High', color: '#EF4444' },
                  ].map((priority) => (
                    <TouchableOpacity
                      key={priority.key}
                      style={[
                        styles.priorityOption,
                        customGoal.priority === priority.key && styles.priorityOptionSelected,
                        { borderColor: priority.color }
                      ]}
                      onPress={() => setCustomGoal(prev => ({ ...prev, priority: priority.key as 'low' | 'medium' | 'high' }))}
                    >
                      <Text style={[
                        styles.priorityOptionText,
                        customGoal.priority === priority.key && styles.priorityOptionTextSelected
                      ]}>
                        {priority.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowCustomGoalForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.createButton, !customGoal.title.trim() && styles.createButtonDisabled]}
                  onPress={handleCreateCustomGoal}
                  disabled={!customGoal.title.trim() || goalsLoading}
                >
                  {goalsLoading ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.createButtonText}>Create Goal</Text>
                  )}
                </TouchableOpacity>
              </View>
            </BlurView>
          </ScrollView>
        </LinearGradient>
      </Modal>
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
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  bottomSpacing: {
    height: 40,
  },
  // Goals Management Styles
  goalsCard: {
    ...GlassmorphismStyles.card,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  goalsActionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    justifyContent: 'center',
  },
  customGoalButton: {
    backgroundColor: Colors.text.secondary,
  },
  addGoalButton: {
    backgroundColor: Colors.primary.gold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  addGoalButtonText: {
    color: '#000',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  templatesSection: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.background.cardBorder,
  },
  templatesScroll: {
    maxHeight: 300,
  },
  templatesScrollContainer: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  templatesTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  templateItem: {
    backgroundColor: Colors.background.card,
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.background.cardBorder,
    width: 280,
    minHeight: 160,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  templateTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  templateDifficulty: {
    backgroundColor: Colors.primary.gold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  templateDifficultyText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: '#000',
    textTransform: 'capitalize',
  },
  templateDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateTarget: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.medium,
  },
  templateTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary.gold,
    fontWeight: Typography.fontWeight.medium,
  },
  emptyGoals: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyGoalsIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  emptyGoalsText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  goalsList: {
    gap: Spacing.lg,
  },
  goalItem: {
    backgroundColor: Colors.background.card,
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.background.cardBorder,
  },
  goalItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  goalItemTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  deleteGoalButton: {
    padding: Spacing.xs,
  },
  deleteGoalText: {
    fontSize: 16,
  },
  goalItemDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  goalItemProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  goalItemProgressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  goalItemPercentage: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
  },
  goalItemProgressBar: {
    height: 6,
    backgroundColor: Colors.background.cardBorder,
    borderRadius: 3,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  goalItemProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary.gold,
    borderRadius: 3,
  },
  goalItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalItemCategory: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textTransform: 'capitalize',
  },
  goalItemPriority: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
  goalsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  goalsLoadingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  // Custom Goal Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    padding: Spacing.xl,
    paddingTop: Spacing['3xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
  },
  modalCloseButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.background.card,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.bold,
  },
  customGoalForm: {
    ...GlassmorphismStyles.card,
    padding: Spacing.xl,
  },
  formField: {
    marginBottom: Spacing.xl,
  },
  formLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  formInput: {
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.background.cardBorder,
    borderRadius: 12,
    padding: Spacing.lg,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    minHeight: 48,
  },
  formTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categorySelector: {
    maxHeight: 60,
  },
  categoryOption: {
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.background.cardBorder,
    borderRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    minWidth: 120,
    alignItems: 'center',
  },
  categoryOptionSelected: {
    backgroundColor: Colors.primary.gold,
    borderColor: Colors.primary.gold,
  },
  categoryOptionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  categoryOptionTextSelected: {
    color: '#000',
    fontWeight: Typography.fontWeight.bold,
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityOption: {
    flex: 1,
    backgroundColor: Colors.background.card,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  priorityOptionSelected: {
    backgroundColor: Colors.background.secondary,
  },
  priorityOptionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  priorityOptionTextSelected: {
    fontWeight: Typography.fontWeight.bold,
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.background.cardBorder,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  createButton: {
    flex: 1,
    backgroundColor: Colors.primary.gold,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: Colors.text.tertiary,
  },
  createButtonText: {
    fontSize: Typography.fontSize.md,
    color: '#000',
    fontWeight: Typography.fontWeight.bold,
  },
});