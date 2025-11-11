// src/services/goalsService.ts
import { supabase } from '@/lib/supabase';
import { CoinService } from './coinService';
import { Coin } from '@/types/coin';
import { CollectionGoal, GoalProgress, GoalCriteria, GoalTemplate, GOAL_TEMPLATES } from '@/types/goal';

export class GoalsService {
  private static activeSubscriptions = new Map<string, any>();
  private static progressListeners = new Map<string, (progress: GoalProgress) => void>();

  // Real-time goal progress monitoring
  static async startGoalProgressMonitoring(userId: string): Promise<void> {
    try {
      // Unsubscribe existing subscription if any
      this.stopGoalProgressMonitoring(userId);

      // Get user's collections
      const { data: collections } = await supabase
        .from('collections')
        .select('id')
        .eq('user_id', userId);

      if (!collections?.length) return;

      const collectionIds = collections.map(c => c.id);

      // Subscribe to coin changes for this user's collections
      const subscription = supabase
        .channel(`goals_${userId}`)
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'coins',
            filter: `collection_id=in.(${collectionIds.join(',')})`
          },
          async (payload) => {
            await this.handleCoinChange(payload, userId);
          }
        )
        .subscribe();

      this.activeSubscriptions.set(userId, subscription);
    } catch (error) {
      console.error('Error starting goal progress monitoring:', error);
    }
  }

  static stopGoalProgressMonitoring(userId: string): void {
    const subscription = this.activeSubscriptions.get(userId);
    if (subscription) {
      subscription.unsubscribe();
      this.activeSubscriptions.delete(userId);
    }
    this.progressListeners.delete(userId);
  }

  static setProgressListener(userId: string, listener: (progress: GoalProgress) => void): void {
    this.progressListeners.set(userId, listener);
  }

  // Handle real-time coin changes
  private static async handleCoinChange(payload: any, userId: string): Promise<void> {
    try {
      const userGoals = await this.getUserGoals(userId);
      const changedCoin = payload.new || payload.old;

      if (!changedCoin) return;

      // Find goals that might be affected by this coin change
      const affectedGoals = userGoals.filter(goal =>
        this.coinMatchesCriteria(changedCoin, goal.criteria)
      );

      // Update progress for affected goals
      for (const goal of affectedGoals) {
        const progress = await this.updateGoalProgress(goal.id);
        if (progress) {
          // Notify progress listener if set
          const listener = this.progressListeners.get(userId);
          if (listener) {
            listener(progress);
          }
        }
      }
    } catch (error) {
      console.error('Error handling coin change:', error);
    }
  }

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
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.goalType !== undefined) updateData.goal_type = updates.goalType;
      if (updates.criteria !== undefined) updateData.criteria = updates.criteria;
      if (updates.targetCount !== undefined) updateData.target_count = updates.targetCount;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.reward !== undefined) updateData.reward = updates.reward;

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

    // Debug logging
    console.log('=== Goal Progress Calculation Debug ===');
    console.log('Goal:', goal.title);
    console.log('Goal Criteria:', goal.criteria);
    console.log('Total coins to check:', coins.length);
    console.log('First coin sample (if exists):', coins[0] ? {
      title: coins[0].title,
      year: coins[0].year,
      denomination: coins[0].denomination,
      country: coins[0].country,
      series: coins[0].series,
      // Check raw fields in case of camelCase issue
      rawCoin: coins[0]
    } : 'No coins');

    // Filter coins based on goal criteria
    const matchingCoins = coins.filter(coin => {
      const matches = this.coinMatchesCriteria(coin, goal.criteria);
      // Log each coin check for debugging
      if (goal.criteria.series && goal.criteria.series.toLowerCase().includes('women')) {
        console.log('Checking coin:', {
          title: coin.title,
          year: coin.year,
          denomination: coin.denomination,
          country: coin.country,
          series: coin.series,
          matches: matches,
          // Show what the series check is looking for
          criteriaSeriesLower: goal.criteria.series.toLowerCase(),
          coinSeriesLower: (coin.series || '').toLowerCase()
        });
      }
      return matches;
    });

    console.log('Matching coins found:', matchingCoins.length);
    completedItems.push(...matchingCoins.map(coin => coin.id));

    // For series goals, calculate what's missing
    if (goal.goalType === 'series_complete' && goal.criteria.startYear && goal.criteria.endYear) {
      const expectedItems = this.getExpectedItemsForSeries(goal.criteria);
      const foundItems = new Set(matchingCoins.map(coin => `${coin.year}-${coin.mint_mark || 'P'}`));

      expectedItems.forEach(item => {
        if (!foundItems.has(item)) {
          missingItems.push(item);
        }
      });
    }

    const progressPercentage = goal.targetCount > 0
      ? Math.min((completedItems.length / goal.targetCount) * 100, 100)
      : 0;

    console.log('Progress:', {
      completedItems: completedItems.length,
      targetCount: goal.targetCount,
      progressPercentage: progressPercentage
    });
    console.log('=== End Debug ===');

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
    // Enhanced country matching with flexible variations
    if (criteria.country) {
      const normalizedCriteriaCountry = criteria.country.toLowerCase();
      const normalizedCoinCountry = (coin.country || '').toLowerCase();

      // Handle common country variations
      const countryMatches = (
        normalizedCoinCountry === normalizedCriteriaCountry ||
        this.areCountryVariations(normalizedCoinCountry, normalizedCriteriaCountry)
      );

      if (!countryMatches) {
        return false;
      }
    }

    // Enhanced denomination matching with case-insensitive and variations
    if (criteria.denomination && criteria.denomination.length > 0) {
      const normalizedCoinDenom = (coin.denomination || '').toLowerCase();
      const matchesAnyDenomination = criteria.denomination.some(denom => {
        const normalizedCriteriaDenom = denom.toLowerCase();
        return (
          normalizedCoinDenom === normalizedCriteriaDenom ||
          this.areDenominationVariations(normalizedCoinDenom, normalizedCriteriaDenom)
        );
      });

      if (!matchesAnyDenomination) {
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

    // Enhanced mint mark matching
    if (criteria.mintMark && criteria.mintMark.length > 0) {
      const coinMintMark = (coin.mintMark || 'P').toUpperCase(); // Default to P for Philadelphia
      const normalizedCriteriaMintMarks = criteria.mintMark.map(mm => mm.toUpperCase());
      if (!normalizedCriteriaMintMarks.includes(coinMintMark)) {
        return false;
      }
    }

    // Enhanced series matching with multiple fallback strategies
    if (criteria.series) {
      const seriesMatches = this.coinMatchesSeries(coin, criteria);
      if (!seriesMatches) {
        return false;
      }
    }

    // Enhanced grade matching
    if (criteria.minGrade && coin.grade) {
      if (!this.gradeMatches(coin.grade, criteria.minGrade)) {
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

  // Enhanced series matching with multiple strategies
  private static coinMatchesSeries(coin: Coin, criteria: GoalCriteria): boolean {
    const normalizedCriteriaSeries = criteria.series!.toLowerCase();

    // Strategy 0: Direct series field match (PRIORITY)
    const coinSeries = (coin.series || '').toLowerCase();
    if (coinSeries) {
      // Check if the coin's series field matches the criteria
      if (coinSeries.includes(normalizedCriteriaSeries) ||
          normalizedCriteriaSeries.includes(coinSeries)) {
        return true;
      }
    }

    // Strategy 1: Pattern matching based on year and characteristics
    if (normalizedCriteriaSeries.includes('american women quarters') ||
        normalizedCriteriaSeries.includes('women quarters')) {
      return this.isAmericanWomenQuarter(coin);
    }

    if (normalizedCriteriaSeries.includes('state quarters')) {
      return this.isStateQuarter(coin);
    }

    if (normalizedCriteriaSeries.includes('morgan')) {
      return this.isMorganDollar(coin);
    }

    // Strategy 2: Fall back to partial name matching in title/notes
    const coinTitle = (coin.title || '').toLowerCase();
    const coinNotes = (coin.notes || '').toLowerCase();

    return (
      coinTitle.includes(normalizedCriteriaSeries) ||
      coinNotes.includes(normalizedCriteriaSeries) ||
      normalizedCriteriaSeries.includes(coinTitle)
    );
  }

  // Helper methods for pattern matching
  private static isAmericanWomenQuarter(coin: Coin): boolean {
    const year = coin.year;
    const denomination = (coin.denomination || '').toLowerCase();
    const country = (coin.country || '').toLowerCase();
    const title = (coin.title || '').toLowerCase();

    // Check if year and country match
    const yearMatches = year >= 2022 && year <= 2025;
    const countryMatches = country.includes('united states') || country.includes('usa') || country.includes('us');

    if (!yearMatches || !countryMatches) {
      return false;
    }

    // Check denomination (accept "quarter" or "commemorative" for these special quarters)
    const denominationMatches = denomination.includes('quarter') ||
                                 denomination.includes('commemorative') ||
                                 denomination.includes('25 cent');

    // Also check if title contains known American Women Quarter honorees
    const womenHonorees = [
      'maya angelou', 'sally ride', 'wilma mankiller', 'nina otero-warren', 'anna may wong',
      'bessie coleman', 'eleanor roosevelt', 'jovita idár', 'maria tallchief', 'adelina otero-warren',
      'edith kanaka', 'patsy takemoto mink', 'zitkála-šá', 'dr. mary edwards walker', 'celia cruz',
      'harriet tubman', 'mamie till-mobley', 'reverdy johnson', 'pauli murray', 'dr. anna julia cooper'
    ];

    const titleMatchesWomen = womenHonorees.some(name => title.includes(name));

    return denominationMatches || titleMatchesWomen;
  }

  private static isStateQuarter(coin: Coin): boolean {
    const year = coin.year;
    const denomination = (coin.denomination || '').toLowerCase();
    const country = (coin.country || '').toLowerCase();

    return (
      denomination.includes('quarter') &&
      (country.includes('united states') || country.includes('usa') || country.includes('us')) &&
      year >= 1999 && year <= 2008
    );
  }

  private static isMorganDollar(coin: Coin): boolean {
    const denomination = (coin.denomination || '').toLowerCase();
    const coinTitle = (coin.title || '').toLowerCase();
    const country = (coin.country || '').toLowerCase();

    return (
      denomination.includes('dollar') &&
      (country.includes('united states') || country.includes('usa') || country.includes('us')) &&
      coinTitle.includes('morgan')
    );
  }

  // Helper methods for country and denomination variations
  private static areCountryVariations(country1: string, country2: string): boolean {
    const usVariations = ['united states', 'usa', 'us', 'america', 'united states of america'];

    if (usVariations.includes(country1) && usVariations.includes(country2)) {
      return true;
    }

    return false;
  }

  private static areDenominationVariations(denom1: string, denom2: string): boolean {
    const denominationMap: { [key: string]: string[] } = {
      'quarter': ['quarter', '25 cents', '0.25', 'quarters'],
      'dollar': ['dollar', '$1', '1 dollar', 'dollars'],
      'half dollar': ['half dollar', '50 cents', '0.50', 'half dollars'],
      'dime': ['dime', '10 cents', '0.10', 'dimes'],
      'nickel': ['nickel', '5 cents', '0.05', 'nickels'],
      'penny': ['penny', 'cent', '1 cent', '0.01', 'pennies', 'cents'],
    };

    for (const [standard, variations] of Object.entries(denominationMap)) {
      if (variations.includes(denom1) && variations.includes(denom2)) {
        return true;
      }
    }

    return false;
  }

  private static gradeMatches(coinGrade: string, minGrade: string): boolean {
    // This is a simplified grade comparison
    const gradeValues: { [key: string]: number } = {
      'PR-70': 70, 'PR-69': 69, 'PR-68': 68, 'PR-67': 67,
      'MS-70': 70, 'MS-69': 69, 'MS-68': 68, 'MS-67': 67, 'MS-66': 66, 'MS-65': 65,
      'MS-64': 64, 'MS-63': 63, 'MS-62': 62, 'MS-61': 61, 'MS-60': 60,
      'AU-58': 58, 'AU-55': 55, 'AU-53': 53, 'AU-50': 50,
      'XF-45': 45, 'XF-40': 40,
      'VF-35': 35, 'VF-30': 30, 'VF-25': 25, 'VF-20': 20,
    };

    const coinGradeValue = gradeValues[coinGrade.toUpperCase()] || 0;
    const minGradeValue = gradeValues[minGrade.toUpperCase()] || 0;

    return coinGradeValue >= minGradeValue;
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
