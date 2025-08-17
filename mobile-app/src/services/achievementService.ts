// src/services/achievementService.ts
import { supabase } from './supabase';
import { CoinService } from './coinService';
import { GoalsService } from './goalsService';
import { Achievement, UserAchievement, ACHIEVEMENTS } from '../types/achievement';
import { CollectionGoal } from '../types/goal';
import { Coin } from '../types/coin';
import { NotificationService } from './notificationService';

export class AchievementService {
  // Get user's achievement progress
  static async getUserAchievements(userId?: string): Promise<UserAchievement[]> {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        userId = user.id;
      }

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) {
        console.error('Error fetching user achievements:', error);
        return [];
      }

      return data?.map(this.mapSupabaseToUserAchievement) || [];
    } catch (error) {
      console.error('Error in getUserAchievements:', error);
      return [];
    }
  }

  // Get available achievements with progress
  static async getAvailableAchievements(userId?: string): Promise<(Achievement & { progress?: { current: number; required: number } })[]> {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        userId = user.id;
      }

      const userAchievements = await this.getUserAchievements(userId);
      const unlockedIds = new Set(userAchievements.filter(ua => ua.isCompleted).map(ua => ua.achievementId));

      // Calculate progress for each achievement
      const achievementsWithProgress = await Promise.all(
        ACHIEVEMENTS.map(async (achievement) => {
          if (unlockedIds.has(achievement.id)) {
            // Already unlocked
            return { ...achievement, progress: { current: achievement.criteria.requirement, required: achievement.criteria.requirement } };
          }

          const progress = await this.calculateAchievementProgress(achievement, userId);
          return { ...achievement, progress };
        })
      );

      return achievementsWithProgress;
    } catch (error) {
      console.error('Error getting available achievements:', error);
      return [];
    }
  }

  // Calculate progress for a specific achievement
  static async calculateAchievementProgress(achievement: Achievement, userId: string): Promise<{ current: number; required: number }> {
    const required = achievement.criteria.requirement;
    let current = 0;

    try {
      switch (achievement.criteria.type) {
        case 'goal_completion':
          const goals = await GoalsService.getUserGoals(userId);
          if (achievement.criteria.subtype) {
            // Specific goal type completion
            current = goals.filter(goal => 
              goal.isCompleted && this.goalMatchesSubtype(goal, achievement.criteria.subtype!)
            ).length;
          } else {
            // Any goal completion
            current = goals.filter(goal => goal.isCompleted).length;
          }
          break;

        case 'goal_milestone':
          const userGoals = await GoalsService.getUserGoals(userId);
          const milestonesReached = userGoals.filter(goal => {
            const progress = (goal.currentCount / goal.targetCount) * 100;
            return progress >= achievement.criteria.requirement;
          });
          current = milestonesReached.length > 0 ? achievement.criteria.requirement : 0;
          break;

        case 'collection_size':
          const coins = await CoinService.getUserCoins();
          current = coins.length;
          break;

        case 'collection_value':
          const userCoins = await CoinService.getUserCoins();
          current = userCoins.reduce((sum, coin) => sum + (coin.purchasePrice || 0), 0);
          break;

        case 'variety':
          if (achievement.criteria.subtype === 'countries') {
            const allCoins = await CoinService.getUserCoins();
            const countries = new Set(allCoins.map(coin => coin.country).filter(Boolean));
            current = countries.size;
          }
          break;

        case 'speed':
          // This would require tracking goal completion times
          const completedGoals = await GoalsService.getUserGoals(userId);
          const speedGoals = completedGoals.filter(goal => {
            if (!goal.completedAt || !goal.createdAt) return false;
            const createdDate = new Date(goal.createdAt);
            const completedDate = new Date(goal.completedAt);
            const daysDiff = Math.ceil((completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff <= achievement.criteria.requirement;
          });
          current = speedGoals.length > 0 ? 1 : 0;
          break;

        case 'streak':
          // This would require tracking daily activity
          // For now, return 0 - would need additional implementation
          current = 0;
          break;

        default:
          current = 0;
      }
    } catch (error) {
      console.error('Error calculating achievement progress:', error);
      current = 0;
    }

    return { current, required };
  }

  // Check and unlock achievements for a user
  static async checkAndUnlockAchievements(userId: string): Promise<Achievement[]> {
    try {
      const availableAchievements = await this.getAvailableAchievements(userId);
      const newlyUnlocked: Achievement[] = [];

      for (const achievement of availableAchievements) {
        if (achievement.progress && achievement.progress.current >= achievement.progress.required) {
          // Check if already unlocked
          const existing = await this.getUserAchievement(userId, achievement.id);
          if (!existing || !existing.isCompleted) {
            await this.unlockAchievement(userId, achievement.id);
            newlyUnlocked.push(achievement);
            
            // Send notification
            await NotificationService.sendAchievementUnlocked(achievement);
          }
        }
      }

      return newlyUnlocked;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  // Unlock a specific achievement
  static async unlockAchievement(userId: string, achievementId: string): Promise<boolean> {
    try {
      const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
      if (!achievement) return false;

      const progress = await this.calculateAchievementProgress(achievement, userId);

      const achievementData = {
        user_id: userId,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString(),
        progress: progress,
        is_completed: true,
        notification_sent: false,
      };

      const { error } = await supabase
        .from('user_achievements')
        .upsert(achievementData, { onConflict: 'user_id,achievement_id' });

      if (error) {
        console.error('Error unlocking achievement:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in unlockAchievement:', error);
      return false;
    }
  }

  // Get a specific user achievement
  static async getUserAchievement(userId: string, achievementId: string): Promise<UserAchievement | null> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching user achievement:', error);
        return null;
      }

      return data ? this.mapSupabaseToUserAchievement(data) : null;
    } catch (error) {
      console.error('Error in getUserAchievement:', error);
      return null;
    }
  }

  // Update achievement progress
  static async updateAchievementProgress(userId: string, achievementId: string, progress: { current: number; required: number }): Promise<boolean> {
    try {
      const isCompleted = progress.current >= progress.required;

      const achievementData = {
        user_id: userId,
        achievement_id: achievementId,
        progress: progress,
        is_completed: isCompleted,
        unlocked_at: isCompleted ? new Date().toISOString() : null,
        notification_sent: false,
      };

      const { error } = await supabase
        .from('user_achievements')
        .upsert(achievementData, { onConflict: 'user_id,achievement_id' });

      if (error) {
        console.error('Error updating achievement progress:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateAchievementProgress:', error);
      return false;
    }
  }

  // Get user's badges and titles
  static async getUserBadgesAndTitles(userId: string): Promise<{ badges: string[]; titles: string[] }> {
    try {
      const userAchievements = await this.getUserAchievements(userId);
      const completed = userAchievements.filter(ua => ua.isCompleted);
      
      const badges: string[] = [];
      const titles: string[] = [];

      for (const userAchievement of completed) {
        const achievement = ACHIEVEMENTS.find(a => a.id === userAchievement.achievementId);
        if (achievement) {
          if (achievement.reward.type === 'badge') {
            badges.push(achievement.reward.value as string);
          } else if (achievement.reward.type === 'title') {
            titles.push(achievement.reward.value as string);
          }
        }
      }

      return { badges, titles };
    } catch (error) {
      console.error('Error getting user badges and titles:', error);
      return { badges: [], titles: [] };
    }
  }

  // Handle coin addition event for achievement checking
  static async handleCoinAdded(coin: Coin): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check relevant achievements
      await this.checkAndUnlockAchievements(user.id);
    } catch (error) {
      console.error('Error handling coin added for achievements:', error);
    }
  }

  // Handle goal completion event for achievement checking
  static async handleGoalCompleted(goal: CollectionGoal): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check relevant achievements
      await this.checkAndUnlockAchievements(user.id);
    } catch (error) {
      console.error('Error handling goal completed for achievements:', error);
    }
  }

  // Handle goal milestone event for achievement checking
  static async handleGoalMilestone(goal: CollectionGoal, milestonePercentage: number): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check milestone achievements
      const milestoneAchievements = ACHIEVEMENTS.filter(a => 
        a.criteria.type === 'goal_milestone' && 
        a.criteria.requirement <= milestonePercentage
      );

      for (const achievement of milestoneAchievements) {
        const existing = await this.getUserAchievement(user.id, achievement.id);
        if (!existing || !existing.isCompleted) {
          await this.unlockAchievement(user.id, achievement.id);
          await NotificationService.sendAchievementUnlocked(achievement);
        }
      }
    } catch (error) {
      console.error('Error handling goal milestone for achievements:', error);
    }
  }

  // Helper method to check if goal matches subtype
  private static goalMatchesSubtype(goal: CollectionGoal, subtype: string): boolean {
    switch (subtype) {
      case 'quarter':
        return goal.criteria.denomination?.includes('Quarter') || false;
      case 'state_quarters':
        return goal.title.toLowerCase().includes('state quarter');
      case 'us_women_quarters':
        return goal.title.toLowerCase().includes('women quarter');
      default:
        return false;
    }
  }

  // Map Supabase data to UserAchievement
  private static mapSupabaseToUserAchievement(data: any): UserAchievement {
    return {
      id: data.id,
      userId: data.user_id,
      achievementId: data.achievement_id,
      unlockedAt: data.unlocked_at,
      progress: data.progress,
      isCompleted: data.is_completed,
      notificationSent: data.notification_sent,
    };
  }

  // Get achievement statistics for dashboard
  static async getAchievementStats(userId: string): Promise<{
    totalUnlocked: number;
    totalAvailable: number;
    recentUnlocked: Achievement[];
    nearCompletion: Achievement[];
  }> {
    try {
      const userAchievements = await this.getUserAchievements(userId);
      const availableAchievements = await this.getAvailableAchievements(userId);

      const totalUnlocked = userAchievements.filter(ua => ua.isCompleted).length;
      const totalAvailable = ACHIEVEMENTS.length;

      // Recent unlocked (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentIds = userAchievements
        .filter(ua => ua.isCompleted && new Date(ua.unlockedAt) > weekAgo)
        .map(ua => ua.achievementId);
      const recentUnlocked = ACHIEVEMENTS.filter(a => recentIds.includes(a.id));

      // Near completion (>= 75% progress)
      const nearCompletion = availableAchievements.filter(a => 
        a.progress && 
        a.progress.current < a.progress.required && 
        (a.progress.current / a.progress.required) >= 0.75
      );

      return {
        totalUnlocked,
        totalAvailable,
        recentUnlocked,
        nearCompletion,
      };
    } catch (error) {
      console.error('Error getting achievement stats:', error);
      return {
        totalUnlocked: 0,
        totalAvailable: ACHIEVEMENTS.length,
        recentUnlocked: [],
        nearCompletion: [],
      };
    }
  }
}