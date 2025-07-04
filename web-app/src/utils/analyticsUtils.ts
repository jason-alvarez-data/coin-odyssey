// Advanced analytics utility functions for coin collection analysis

export interface Coin {
  id: string;
  denomination: string;
  year: number;
  mint_mark?: string;
  grade?: string;
  purchase_price?: number;
  face_value: number;
  current_market_value?: number;
  purchase_date: string;
  notes?: string;
  images?: string[];
  title?: string;
  country?: string;
}

export interface TopPerformer {
  coin: Coin;
  roi: number;
  gain: number;
  percentage: string;
}

export interface CollectionHealthMetrics {
  diversificationScore: number;
  qualityIndex: number;
  averageAge: number;
  modernCoinsPercentage: number;
  vintageCoinsPercentage: number;
  gradedCoinsPercentage: number;
  countryDiversity: number;
}

export interface FinancialInsights {
  totalROI: number;
  totalGainLoss: number;
  averageROI: number;
  bestPerformer: TopPerformer | null;
  worstPerformer: TopPerformer | null;
  topPerformers: TopPerformer[];
  monthlySpending: { month: string; amount: number; count: number }[];
  investmentEfficiency: number;
}

export interface SmartInsight {
  type: 'success' | 'warning' | 'info' | 'neutral';
  title: string;
  message: string;
  icon: string;
}

// Calculate ROI for a single coin
export const calculateCoinROI = (coin: Coin): number => {
  const purchasePrice = coin.purchase_price || 0;
  const currentValue = coin.current_market_value || coin.purchase_price || 0;
  
  if (purchasePrice === 0) return 0;
  return ((currentValue - purchasePrice) / purchasePrice) * 100;
};

// Calculate financial insights
export const calculateFinancialInsights = (coins: Coin[]): FinancialInsights => {
  const coinsWithValues = coins.filter(coin => coin.purchase_price && coin.purchase_price > 0);
  
  const totalInvestment = coins.reduce((sum, coin) => sum + (coin.purchase_price || 0), 0);
  const totalCurrentValue = coins.reduce((sum, coin) => 
    sum + (coin.current_market_value || coin.purchase_price || 0), 0);
  
  const totalGainLoss = totalCurrentValue - totalInvestment;
  const totalROI = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0;
  
  // Calculate individual coin performances
  const performances: TopPerformer[] = coinsWithValues.map(coin => ({
    coin,
    roi: calculateCoinROI(coin),
    gain: (coin.current_market_value || coin.purchase_price || 0) - (coin.purchase_price || 0),
    percentage: `${calculateCoinROI(coin).toFixed(1)}%`
  }));
  
  const averageROI = performances.length > 0 
    ? performances.reduce((sum, p) => sum + p.roi, 0) / performances.length 
    : 0;
  
  // Sort for best/worst performers
  const sortedPerformances = [...performances].sort((a, b) => b.roi - a.roi);
  
  // Calculate monthly spending
  const monthlySpending = calculateMonthlySpending(coins);
  
  // Investment efficiency (average value per dollar spent)
  const investmentEfficiency = totalInvestment > 0 ? totalCurrentValue / totalInvestment : 0;
  
  return {
    totalROI,
    totalGainLoss,
    averageROI,
    bestPerformer: sortedPerformances[0] || null,
    worstPerformer: sortedPerformances[sortedPerformances.length - 1] || null,
    topPerformers: sortedPerformances.slice(0, 5),
    monthlySpending,
    investmentEfficiency
  };
};

// Calculate collection health metrics
export const calculateCollectionHealth = (coins: Coin[]): CollectionHealthMetrics => {
  const currentYear = new Date().getFullYear();
  
  // Calculate diversification score (0-100)
  const uniqueDenominations = new Set(coins.map(c => c.denomination)).size;
  const uniqueCountries = new Set(coins.map(c => c.country || 'Unknown')).size;
  const uniqueDecades = new Set(coins.map(c => Math.floor(c.year / 10))).size;
  const diversificationScore = Math.min(100, (uniqueDenominations * 5) + (uniqueCountries * 3) + (uniqueDecades * 2));
  
  // Calculate quality index (based on graded coins and variety)
  const gradedCoins = coins.filter(c => c.grade && c.grade.trim() !== '').length;
  const gradedCoinsPercentage = coins.length > 0 ? (gradedCoins / coins.length) * 100 : 0;
  const qualityIndex = Math.min(100, gradedCoinsPercentage + (uniqueDenominations * 2));
  
  // Calculate age metrics
  const averageAge = coins.length > 0 
    ? coins.reduce((sum, coin) => sum + (currentYear - coin.year), 0) / coins.length 
    : 0;
  
  const modernCoins = coins.filter(c => currentYear - c.year <= 50).length;
  const vintageCoins = coins.filter(c => currentYear - c.year > 50).length;
  
  const modernCoinsPercentage = coins.length > 0 ? (modernCoins / coins.length) * 100 : 0;
  const vintageCoinsPercentage = coins.length > 0 ? (vintageCoins / coins.length) * 100 : 0;
  
  return {
    diversificationScore,
    qualityIndex,
    averageAge,
    modernCoinsPercentage,
    vintageCoinsPercentage,
    gradedCoinsPercentage,
    countryDiversity: uniqueCountries
  };
};

// Calculate monthly spending patterns
export const calculateMonthlySpending = (coins: Coin[]): { month: string; amount: number; count: number }[] => {
  const monthlyData: { [key: string]: { amount: number; count: number } } = {};
  
  coins.forEach(coin => {
    if (coin.purchase_date && coin.purchase_price) {
      const date = new Date(coin.purchase_date);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { amount: 0, count: 0 };
      }
      
      monthlyData[monthKey].amount += coin.purchase_price;
      monthlyData[monthKey].count += 1;
    }
  });
  
  return Object.entries(monthlyData)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
    .slice(-12); // Last 12 months
};

// Generate smart insights
export const generateSmartInsights = (coins: Coin[], financialInsights: FinancialInsights, healthMetrics: CollectionHealthMetrics): SmartInsight[] => {
  const insights: SmartInsight[] = [];
  const currentYear = new Date().getFullYear();
  
  // ROI insights
  if (financialInsights.totalROI > 20) {
    insights.push({
      type: 'success',
      title: 'Excellent Performance!',
      message: `Your collection has gained ${financialInsights.totalROI.toFixed(1)}% in value. You're a savvy collector!`,
      icon: '📈'
    });
  } else if (financialInsights.totalROI < -10) {
    insights.push({
      type: 'warning',
      title: 'Performance Review',
      message: `Your collection is down ${Math.abs(financialInsights.totalROI).toFixed(1)}%. Consider focusing on higher-quality pieces.`,
      icon: '⚠️'
    });
  }
  
  // Diversification insights
  if (healthMetrics.diversificationScore < 30) {
    insights.push({
      type: 'info',
      title: 'Diversification Opportunity',
      message: 'Consider expanding into different denominations or time periods to reduce risk.',
      icon: '🔄'
    });
  } else if (healthMetrics.diversificationScore > 80) {
    insights.push({
      type: 'success',
      title: 'Well Diversified!',
      message: 'Your collection spans multiple eras and types. Great risk management!',
      icon: '🎯'
    });
  }
  
  // Quality insights
  if (healthMetrics.gradedCoinsPercentage < 20) {
    insights.push({
      type: 'info',
      title: 'Grading Opportunity',
      message: 'Consider getting more coins professionally graded to increase their market value.',
      icon: '⭐'
    });
  }
  
  // Recent activity insights
  const recentCoins = coins.filter(coin => {
    const purchaseDate = new Date(coin.purchase_date);
    const monthsAgo = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsAgo <= 3;
  });
  
  if (recentCoins.length > 5) {
    insights.push({
      type: 'neutral',
      title: 'Active Collector',
      message: `You've added ${recentCoins.length} coins in the last 3 months. You're on fire!`,
      icon: '🔥'
    });
  }
  
  // Milestone insights
  if (coins.length >= 100 && coins.length < 110) {
    insights.push({
      type: 'success',
      title: 'Century Club!',
      message: 'Congratulations on reaching 100+ coins in your collection!',
      icon: '🏆'
    });
  }
  
  return insights.slice(0, 4); // Limit to 4 insights
};

// Calculate value distribution for advanced charts
export const calculateValueDistribution = (coins: Coin[]): { range: string; count: number; totalValue: number }[] => {
  const ranges = [
    { min: 0, max: 10, label: '$0-$10' },
    { min: 10, max: 50, label: '$10-$50' },
    { min: 50, max: 100, label: '$50-$100' },
    { min: 100, max: 500, label: '$100-$500' },
    { min: 500, max: 1000, label: '$500-$1K' },
    { min: 1000, max: Infinity, label: '$1K+' }
  ];
  
  return ranges.map(range => {
    const coinsInRange = coins.filter(coin => {
      const value = coin.current_market_value || coin.purchase_price || 0;
      return value >= range.min && value < range.max;
    });
    
    const totalValue = coinsInRange.reduce((sum, coin) => 
      sum + (coin.current_market_value || coin.purchase_price || 0), 0);
    
    return {
      range: range.label,
      count: coinsInRange.length,
      totalValue
    };
  });
};

// Get recent activity summary
export const getRecentActivity = (coins: Coin[]): { 
  recentCoins: Coin[]; 
  totalSpent: number; 
  averageValue: number;
  daysActive: number;
} => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentCoins = coins.filter(coin => 
    new Date(coin.purchase_date) >= thirtyDaysAgo
  );
  
  const totalSpent = recentCoins.reduce((sum, coin) => sum + (coin.purchase_price || 0), 0);
  const averageValue = recentCoins.length > 0 ? totalSpent / recentCoins.length : 0;
  
  // Calculate days with activity
  const activeDays = new Set(recentCoins.map(coin => 
    new Date(coin.purchase_date).toDateString()
  )).size;
  
  return {
    recentCoins,
    totalSpent,
    averageValue,
    daysActive: activeDays
  };
}; 