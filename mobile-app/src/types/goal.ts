// src/types/goal.ts

export interface CollectionGoal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  goalType: GoalType;
  criteria: GoalCriteria;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  priority: 'low' | 'medium' | 'high';
  category: GoalCategory;
  reward?: string; // Optional reward description
}

export type GoalType = 
  | 'series_complete'     // Complete a specific series (e.g., US Women's Quarters)
  | 'year_range'          // Collect all coins from a year range
  | 'country_complete'    // Collect from a specific country
  | 'denomination_set'    // Collect all denominations from a country
  | 'mint_mark_set'       // Collect all mint marks for a specific coin
  | 'grade_achievement'   // Achieve certain grades (e.g., all MS-65+)
  | 'value_target'        // Reach a total collection value
  | 'quantity_target'     // Reach a total number of coins
  | 'geographic_spread'   // Collect from X countries/continents
  | 'custom';             // User-defined criteria

export type GoalCategory = 
  | 'us_coins'
  | 'world_coins' 
  | 'ancient_coins'
  | 'modern_coins'
  | 'commemoratives'
  | 'precious_metals'
  | 'paper_money'
  | 'general';

export interface GoalCriteria {
  // Series/Set criteria
  series?: string;          // e.g., "American Women Quarters"
  startYear?: number;
  endYear?: number;
  country?: string;
  denomination?: string[];  // e.g., ["Quarter", "Dime"]
  mintMark?: string[];      // e.g., ["D", "S", "P"]
  
  // Quality criteria
  minGrade?: string;        // e.g., "MS-65"
  maxGrade?: string;
  gradingService?: string[]; // e.g., ["PCGS", "NGC"]
  
  // Value criteria
  minValue?: number;
  maxValue?: number;
  
  // Geographic criteria
  countries?: string[];
  continents?: string[];
  
  // Custom criteria for advanced goals
  customFilters?: {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
    value: any;
  }[];
}

export interface GoalProgress {
  goalId: string;
  completedItems: string[]; // Array of coin IDs that match the goal
  missingItems: string[];   // Array of items still needed (for series goals)
  progressPercentage: number;
  lastUpdated: string;
  milestones: GoalMilestone[];
}

export interface GoalMilestone {
  id: string;
  goalId: string;
  title: string;
  description: string;
  targetPercentage: number; // e.g., 25, 50, 75, 100
  isCompleted: boolean;
  completedAt?: string;
  reward?: string;
}

// Pre-defined goal templates for common collecting goals
export interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  goalType: GoalType;
  category: GoalCategory;
  criteria: GoalCriteria;
  targetCount: number;
  estimatedDifficulty: 'easy' | 'medium' | 'hard' | 'expert';
  estimatedTimeframe: string; // e.g., "6 months", "2-3 years"
  tags: string[];
}

// Popular goal templates
export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: 'us_women_quarters',
    title: 'American Women Quarters Collection',
    description: 'Collect all coins from the American Women Quarters series (2022-2025)',
    goalType: 'series_complete',
    category: 'us_coins',
    criteria: {
      series: 'American Women Quarters',
      startYear: 2022,
      endYear: 2025,
      country: 'United States',
      denomination: ['Quarter']
    },
    targetCount: 20, // 5 per year × 4 years
    estimatedDifficulty: 'easy',
    estimatedTimeframe: '2-3 years',
    tags: ['quarters', 'modern', 'commemorative', 'women']
  },
  {
    id: 'state_quarters',
    title: 'Complete State Quarters Collection',
    description: 'Collect all 50 State Quarters plus DC and territories',
    goalType: 'series_complete',
    category: 'us_coins',
    criteria: {
      series: 'State Quarters',
      startYear: 1999,
      endYear: 2008,
      country: 'United States',
      denomination: ['Quarter']
    },
    targetCount: 56,
    estimatedDifficulty: 'medium',
    estimatedTimeframe: '1-2 years',
    tags: ['quarters', 'states', 'commemorative']
  },
  {
    id: 'morgan_dollars',
    title: 'Morgan Silver Dollar Collection',
    description: 'Collect Morgan Silver Dollars from the classic era',
    goalType: 'series_complete',
    category: 'us_coins',
    criteria: {
      series: 'Morgan Dollar',
      startYear: 1878,
      endYear: 1921,
      country: 'United States',
      denomination: ['Dollar']
    },
    targetCount: 96, // Estimated based on mintages and mint marks
    estimatedDifficulty: 'hard',
    estimatedTimeframe: '5+ years',
    tags: ['dollars', 'silver', 'classic', 'expensive']
  },
  {
    id: 'world_tour',
    title: 'World Tour Collection',
    description: 'Collect at least one coin from 50 different countries',
    goalType: 'geographic_spread',
    category: 'world_coins',
    criteria: {
      countries: [], // Will be filled as user collects
    },
    targetCount: 50,
    estimatedDifficulty: 'medium',
    estimatedTimeframe: '2-4 years',
    tags: ['world', 'countries', 'geographic', 'diverse']
  },
  {
    id: 'graded_collection',
    title: 'Premium Graded Collection',
    description: 'Build a collection of 25 coins graded MS-65 or higher',
    goalType: 'grade_achievement',
    category: 'general',
    criteria: {
      minGrade: 'MS-65',
      gradingService: ['PCGS', 'NGC']
    },
    targetCount: 25,
    estimatedDifficulty: 'hard',
    estimatedTimeframe: '3-5 years',
    tags: ['graded', 'quality', 'premium', 'investment']
  }
];