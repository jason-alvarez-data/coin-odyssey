// src/types/achievement.ts

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'goal' | 'collection' | 'milestone' | 'special';
  criteria: {
    type: 'goal_completion' | 'goal_milestone' | 'collection_size' | 'collection_value' | 'streak' | 'speed' | 'variety';
    requirement: number;
    timeframe?: string; // e.g., 'week', 'month', 'year'
    subtype?: string; // Additional classification
  };
  reward: {
    type: 'badge' | 'title' | 'feature' | 'points';
    value: string | number;
  };
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  progress?: {
    current: number;
    required: number;
  };
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
  progress: {
    current: number;
    required: number;
  };
  isCompleted: boolean;
  notificationSent: boolean;
}

// Predefined achievements
export const ACHIEVEMENTS: Achievement[] = [
  // Goal-based achievements
  {
    id: 'first_goal_complete',
    title: 'Goal Getter',
    description: 'Complete your first collection goal',
    icon: '🎯',
    category: 'goal',
    criteria: { type: 'goal_completion', requirement: 1 },
    reward: { type: 'badge', value: 'Goal Getter' },
    rarity: 'common',
  },
  {
    id: 'goal_master',
    title: 'Goal Master',
    description: 'Complete 5 collection goals',
    icon: '🏆',
    category: 'goal',
    criteria: { type: 'goal_completion', requirement: 5 },
    reward: { type: 'title', value: 'Goal Master' },
    rarity: 'rare',
  },
  {
    id: 'goal_legend',
    title: 'Goal Legend',
    description: 'Complete 10 collection goals',
    icon: '👑',
    category: 'goal',
    criteria: { type: 'goal_completion', requirement: 10 },
    reward: { type: 'title', value: 'Goal Legend' },
    rarity: 'epic',
  },

  // Quarter-specific achievements
  {
    id: 'quarter_master',
    title: 'Quarter Master',
    description: 'Complete any quarter-based collection goal',
    icon: '🪙',
    category: 'goal',
    criteria: { type: 'goal_completion', requirement: 1, subtype: 'quarter' },
    reward: { type: 'badge', value: 'Quarter Master' },
    rarity: 'uncommon',
  },
  {
    id: 'state_quarter_hero',
    title: 'State Quarter Hero',
    description: 'Complete the State Quarters collection goal',
    icon: '🇺🇸',
    category: 'goal',
    criteria: { type: 'goal_completion', requirement: 1, subtype: 'state_quarters' },
    reward: { type: 'badge', value: 'State Quarter Hero' },
    rarity: 'rare',
  },
  {
    id: 'women_quarter_champion',
    title: 'Women Quarter Champion',
    description: 'Complete the American Women Quarters collection goal',
    icon: '👩',
    category: 'goal',
    criteria: { type: 'goal_completion', requirement: 1, subtype: 'us_women_quarters' },
    reward: { type: 'badge', value: 'Women Quarter Champion' },
    rarity: 'rare',
  },

  // Collection size achievements
  {
    id: 'coin_collector',
    title: 'Coin Collector',
    description: 'Add 10 coins to your collection',
    icon: '📦',
    category: 'collection',
    criteria: { type: 'collection_size', requirement: 10 },
    reward: { type: 'badge', value: 'Coin Collector' },
    rarity: 'common',
  },
  {
    id: 'serious_collector',
    title: 'Serious Collector',
    description: 'Build a collection of 50 coins',
    icon: '🏛️',
    category: 'collection',
    criteria: { type: 'collection_size', requirement: 50 },
    reward: { type: 'badge', value: 'Serious Collector' },
    rarity: 'uncommon',
  },
  {
    id: 'numismatist',
    title: 'Numismatist',
    description: 'Accumulate 100 coins in your collection',
    icon: '🎓',
    category: 'collection',
    criteria: { type: 'collection_size', requirement: 100 },
    reward: { type: 'title', value: 'Numismatist' },
    rarity: 'rare',
  },
  {
    id: 'master_collector',
    title: 'Master Collector',
    description: 'Reach 500 coins in your collection',
    icon: '💎',
    category: 'collection',
    criteria: { type: 'collection_size', requirement: 500 },
    reward: { type: 'title', value: 'Master Collector' },
    rarity: 'epic',
  },

  // Collection value achievements
  {
    id: 'valuable_collector',
    title: 'Valuable Collector',
    description: 'Build a collection worth $1,000',
    icon: '💰',
    category: 'collection',
    criteria: { type: 'collection_value', requirement: 1000 },
    reward: { type: 'badge', value: 'Valuable Collector' },
    rarity: 'uncommon',
  },
  {
    id: 'high_roller',
    title: 'High Roller',
    description: 'Accumulate $10,000 in collection value',
    icon: '💸',
    category: 'collection',
    criteria: { type: 'collection_value', requirement: 10000 },
    reward: { type: 'badge', value: 'High Roller' },
    rarity: 'rare',
  },
  {
    id: 'coin_mogul',
    title: 'Coin Mogul',
    description: 'Reach $50,000 in total collection value',
    icon: '🏦',
    category: 'collection',
    criteria: { type: 'collection_value', requirement: 50000 },
    reward: { type: 'title', value: 'Coin Mogul' },
    rarity: 'epic',
  },

  // Milestone achievements
  {
    id: 'milestone_enthusiast',
    title: 'Milestone Enthusiast',
    description: 'Reach 25% progress on any goal',
    icon: '⭐',
    category: 'milestone',
    criteria: { type: 'goal_milestone', requirement: 25 },
    reward: { type: 'badge', value: 'Milestone Enthusiast' },
    rarity: 'common',
  },
  {
    id: 'halfway_hero',
    title: 'Halfway Hero',
    description: 'Reach 50% progress on any goal',
    icon: '🌟',
    category: 'milestone',
    criteria: { type: 'goal_milestone', requirement: 50 },
    reward: { type: 'badge', value: 'Halfway Hero' },
    rarity: 'common',
  },
  {
    id: 'almost_there',
    title: 'Almost There',
    description: 'Reach 75% progress on any goal',
    icon: '🔥',
    category: 'milestone',
    criteria: { type: 'goal_milestone', requirement: 75 },
    reward: { type: 'badge', value: 'Almost There' },
    rarity: 'uncommon',
  },

  // Speed achievements
  {
    id: 'quick_starter',
    title: 'Quick Starter',
    description: 'Complete a goal within 30 days of creation',
    icon: '⚡',
    category: 'special',
    criteria: { type: 'speed', requirement: 30, timeframe: 'days' },
    reward: { type: 'badge', value: 'Quick Starter' },
    rarity: 'uncommon',
  },
  {
    id: 'lightning_collector',
    title: 'Lightning Collector',
    description: 'Complete a goal within 7 days of creation',
    icon: '⚡⚡',
    category: 'special',
    criteria: { type: 'speed', requirement: 7, timeframe: 'days' },
    reward: { type: 'badge', value: 'Lightning Collector' },
    rarity: 'rare',
  },

  // Variety achievements
  {
    id: 'world_traveler',
    title: 'World Traveler',
    description: 'Collect coins from 10 different countries',
    icon: '🌍',
    category: 'collection',
    criteria: { type: 'variety', requirement: 10, subtype: 'countries' },
    reward: { type: 'badge', value: 'World Traveler' },
    rarity: 'uncommon',
  },
  {
    id: 'globe_trotter',
    title: 'Globe Trotter',
    description: 'Collect coins from 25 different countries',
    icon: '🌎',
    category: 'collection',
    criteria: { type: 'variety', requirement: 25, subtype: 'countries' },
    reward: { type: 'title', value: 'Globe Trotter' },
    rarity: 'rare',
  },
  {
    id: 'international_collector',
    title: 'International Collector',
    description: 'Collect coins from 50 different countries',
    icon: '🌏',
    category: 'collection',
    criteria: { type: 'variety', requirement: 50, subtype: 'countries' },
    reward: { type: 'title', value: 'International Collector' },
    rarity: 'epic',
  },

  // Special achievements
  {
    id: 'early_adopter',
    title: 'Early Adopter',
    description: 'One of the first 100 users to join Coin Odyssey',
    icon: '🚀',
    category: 'special',
    criteria: { type: 'special', requirement: 100 },
    reward: { type: 'badge', value: 'Early Adopter' },
    rarity: 'legendary',
  },
  {
    id: 'dedication_streak',
    title: 'Dedication Streak',
    description: 'Add coins for 7 consecutive days',
    icon: '🔥',
    category: 'special',
    criteria: { type: 'streak', requirement: 7, timeframe: 'days' },
    reward: { type: 'badge', value: 'Dedication Streak' },
    rarity: 'uncommon',
  },
  {
    id: 'commitment_champion',
    title: 'Commitment Champion',
    description: 'Add coins for 30 consecutive days',
    icon: '💪',
    category: 'special',
    criteria: { type: 'streak', requirement: 30, timeframe: 'days' },
    reward: { type: 'title', value: 'Commitment Champion' },
    rarity: 'epic',
  },
];

export const RARITY_COLORS = {
  common: '#9CA3AF',      // Gray
  uncommon: '#10B981',    // Green
  rare: '#3B82F6',       // Blue
  epic: '#8B5CF6',       // Purple
  legendary: '#F59E0B',   // Gold
};

export const RARITY_LABELS = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};