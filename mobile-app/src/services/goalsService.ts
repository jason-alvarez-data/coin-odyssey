// src/services/goalsService.ts
import { supabase } from './supabase';
import { CoinService } from './coinService';
import { Coin } from '../types/coin';
import { CollectionGoal, GoalProgress, GoalCriteria, GoalTemplate, GOAL_TEMPLATES } from '../types/goal';

export class GoalsService {
  static async getUserGoals(userId?: string): Promise<CollectionGoal[]> {
    try {
      // If no userId provided, get current user
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        userId = user.id;
      }

      const { data, error } = await supabase
        .from('collection_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching goals:', error);
        return [];
      }

      return data?.map(this.mapSupabaseToGoal) || [];
    } catch (error) {
      console.error('Error in getUserGoals:', error);
      return [];
    }
  }

  static async createGoal(goal: Omit<CollectionGoal, 'id' | 'createdAt' | 'updatedAt' | 'currentCount' | 'isCompleted'>): Promise<CollectionGoal | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const goalData = {
        user_id: user.id,
        title: goal.title,
        description: goal.description,
        goal_type: goal.goalType,
        criteria: goal.criteria,
        target_count: goal.targetCount,
        current_count: 0,
        is_completed: false,
        priority: goal.priority,
        category: goal.category,
        reward: goal.reward,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('collection_goals')
        .insert(goalData)
        .select()
        .single();

      if (error) {
        console.error('Error creating goal:', error);
        return null;
      }

      const newGoal = this.mapSupabaseToGoal(data);
      
      // Calculate initial progress
      await this.updateGoalProgress(newGoal.id);
      
      return newGoal;
    } catch (error) {
      console.error('Error in createGoal:', error);
      return null;
    }
  }

  static async updateGoal(goalId: string, updates: Partial<CollectionGoal>): Promise<CollectionGoal | null> {
    try {
      const updateData = {
        title: updates.title,
        description: updates.description,
        goal_type: updates.goalType,
        criteria: updates.criteria,
        target_count: updates.targetCount,
        priority: updates.priority,
        category: updates.category,
        reward: updates.reward,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('collection_goals')
        .update(updateData)
        .eq('id', goalId)
        .select()
        .single();

      if (error) {
        console.error('Error updating goal:', error);
        return null;
      }

      return this.mapSupabaseToGoal(data);
    } catch (error) {
      console.error('Error in updateGoal:', error);
      return null;
    }
  }

  static async deleteGoal(goalId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('collection_goals')
        .delete()
        .eq('id', goalId);

      if (error) {
        console.error('Error deleting goal:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteGoal:', error);
      return false;
    }
  }

  static async updateGoalProgress(goalId: string): Promise<GoalProgress | null> {
    try {
      // Get the goal
      const { data: goalData, error: goalError } = await supabase
        .from('collection_goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (goalError || !goalData) {
        console.error('Error fetching goal for progress update:', goalError);
        return null;
      }

      const goal = this.mapSupabaseToGoal(goalData);
      
      // Get user's coins
      const coins = await CoinService.getUserCoins();
      
      // Calculate progress based on goal criteria
      const progress = this.calculateGoalProgress(goal, coins);
      
      // Update the goal's current count and completion status
      const isCompleted = progress.progressPercentage >= 100;
      const updateData = {
        current_count: progress.completedItems.length,
        is_completed: isCompleted,
        completed_at: isCompleted && !goal.isCompleted ? new Date().toISOString() : goal.completedAt,
        updated_at: new Date().toISOString(),
      };

      await supabase
        .from('collection_goals')
        .update(updateData)
        .eq('id', goalId);

      return progress;
    } catch (error) {
      console.error('Error in updateGoalProgress:', error);
      return null;
    }
  }

  static async updateAllGoalsProgress(userId?: string): Promise<void> {
    try {
      const goals = await this.getUserGoals(userId);
      
      // Update progress for all goals
      const updatePromises = goals.map(goal => this.updateGoalProgress(goal.id));
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error updating all goals progress:', error);
    }
  }

  static calculateGoalProgress(goal: CollectionGoal, coins: Coin[]): GoalProgress {
    const completedItems: string[] = [];
    const missingItems: string[] = [];

    // Filter coins based on goal criteria
    const matchingCoins = coins.filter(coin => this.coinMatchesCriteria(coin, goal.criteria));
    
    completedItems.push(...matchingCoins.map(coin => coin.id));

    // For series goals, calculate what's missing
    if (goal.goalType === 'series_complete' && goal.criteria.startYear && goal.criteria.endYear) {
      const expectedItems = this.getExpectedItemsForSeries(goal.criteria);
      const foundItems = new Set(matchingCoins.map(coin => `${coin.year}-${coin.mintMark || 'P'}`));
      
      expectedItems.forEach(item => {
        if (!foundItems.has(item)) {
          missingItems.push(item);
        }
      });
    }

    const progressPercentage = goal.targetCount > 0 
      ? Math.min((completedItems.length / goal.targetCount) * 100, 100)
      : 0;

    return {
      goalId: goal.id,
      completedItems,
      missingItems,
      progressPercentage,
      lastUpdated: new Date().toISOString(),
      milestones: this.calculateMilestones(goal, progressPercentage),
    };
  }

  private static coinMatchesCriteria(coin: Coin, criteria: GoalCriteria): boolean {
    // Check country
    if (criteria.country && coin.country !== criteria.country) {
      return false;
    }

    // Check denomination
    if (criteria.denomination && criteria.denomination.length > 0) {
      if (!criteria.denomination.includes(coin.denomination)) {
        return false;
      }
    }

    // Check year range
    if (criteria.startYear && coin.year && coin.year < criteria.startYear) {
      return false;
    }
    if (criteria.endYear && coin.year && coin.year > criteria.endYear) {
      return false;
    }

    // Check mint mark
    if (criteria.mintMark && criteria.mintMark.length > 0) {
      const coinMintMark = coin.mintMark || 'P'; // Default to P for Philadelphia
      if (!criteria.mintMark.includes(coinMintMark)) {
        return false;
      }
    }

    // Check series
    if (criteria.series && coin.series !== criteria.series) {
      return false;
    }

    // Check grade (simplified - would need more sophisticated grade parsing)
    if (criteria.minGrade && coin.grade) {
      // This is a simplified check - in reality you'd need to parse grades properly
      if (coin.grade < criteria.minGrade) {
        return false;
      }
    }

    // Check value range
    if (criteria.minValue && coin.purchasePrice && coin.purchasePrice < criteria.minValue) {
      return false;
    }
    if (criteria.maxValue && coin.purchasePrice && coin.purchasePrice > criteria.maxValue) {
      return false;
    }

    return true;
  }

  private static getExpectedItemsForSeries(criteria: GoalCriteria): string[] {
    const items: string[] = [];
    
    if (!criteria.startYear || !criteria.endYear) return items;

    // For most series, generate year-mintmark combinations
    const mintMarks = criteria.mintMark || ['P', 'D', 'S']; // Common mint marks
    
    for (let year = criteria.startYear; year <= criteria.endYear; year++) {
      mintMarks.forEach(mintMark => {
        items.push(`${year}-${mintMark}`);
      });
    }

    return items;
  }

  private static calculateMilestones(goal: CollectionGoal, progressPercentage: number) {
    const milestones = [
      { percentage: 25, title: '25% Complete', description: 'Great start!' },
      { percentage: 50, title: 'Halfway There', description: 'You\'re making excellent progress!' },
      { percentage: 75, title: '75% Complete', description: 'Almost there!' },
      { percentage: 100, title: 'Goal Complete!', description: 'Congratulations on completing your goal!' },
    ];

    return milestones.map((milestone, index) => ({
      id: `${goal.id}-milestone-${index}`,
      goalId: goal.id,
      title: milestone.title,
      description: milestone.description,
      targetPercentage: milestone.percentage,
      isCompleted: progressPercentage >= milestone.percentage,
      completedAt: progressPercentage >= milestone.percentage ? new Date().toISOString() : undefined,
    }));
  }

  private static mapSupabaseToGoal(data: any): CollectionGoal {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      goalType: data.goal_type,
      criteria: data.criteria,
      targetCount: data.target_count,
      currentCount: data.current_count,
      isCompleted: data.is_completed,
      completedAt: data.completed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      priority: data.priority,
      category: data.category,
      reward: data.reward,
    };
  }

  static getGoalTemplates(): GoalTemplate[] {
    return GOAL_TEMPLATES;
  }

  static async createGoalFromTemplate(templateId: string): Promise<CollectionGoal | null> {
    const template = GOAL_TEMPLATES.find(t => t.id === templateId);
    if (!template) return null;

    return this.createGoal({
      title: template.title,
      description: template.description,
      goalType: template.goalType,
      criteria: template.criteria,
      targetCount: template.targetCount,
      userId: '', // Will be set in createGoal
      priority: 'medium',
      category: template.category,
    });
  }
}