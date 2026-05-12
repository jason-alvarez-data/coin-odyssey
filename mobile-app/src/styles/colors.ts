// src/styles/colors.ts
export const Colors = {
  // Primary brand colors
  primary: {
    gold: '#FFD700',
    goldGradient: ['#FFD700', '#FFED4E'] as const,
    darkGold: '#E6C200',
  },

  // Background gradients
  background: {
    primary: ['#0f0f23', '#1a1a2e', '#16213e'] as const, // Main gradient
    secondary: 'rgba(255, 255, 255, 0.08)',
    card: 'rgba(255, 255, 255, 0.05)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.8)',
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
    accent: '#FFD700',
    success: '#4ADE80',
    error: '#EF4444',
  },
  
  // Status and notification colors
  status: {
    online: '#10B981',
    offline: '#6B7280',
    premium: '#FFD700',
    certified: '#3B82F6',
  }
};