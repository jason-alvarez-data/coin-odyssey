// src/styles/optimizedEffects.ts
import { ViewStyle } from 'react-native';
import { PerformanceService } from '../services/performanceService';

// Performance-aware glassmorphism styles
export class OptimizedGlassmorphismStyles {
  private static performanceService: PerformanceService;

  static initialize() {
    this.performanceService = PerformanceService.getInstance();
  }

  static getCardStyle(): ViewStyle {
    const shouldReduce = this.performanceService?.shouldUseReducedEffects() ?? false;
    
    if (shouldReduce) {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 16,
        overflow: 'hidden',
      };
    }

    return {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 16,
      overflow: 'hidden',
    };
  }

  static getNavigationStyle(): ViewStyle {
    const shouldReduce = this.performanceService?.shouldUseReducedEffects() ?? false;
    
    if (shouldReduce) {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 25,
        overflow: 'hidden',
      };
    }

    return {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 25,
      overflow: 'hidden',
    };
  }

  static getPremiumCardStyle(): ViewStyle {
    const shouldReduce = this.performanceService?.shouldUseReducedEffects() ?? false;
    
    if (shouldReduce) {
      return {
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.25)',
        borderRadius: 16,
        overflow: 'hidden',
      };
    }

    return {
      backgroundColor: 'rgba(255, 215, 0, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 215, 0, 0.2)',
      borderRadius: 16,
      overflow: 'hidden',
    };
  }

  static getOverlayStyle(): ViewStyle {
    const shouldReduce = this.performanceService?.shouldUseReducedEffects() ?? false;
    
    if (shouldReduce) {
      return {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 12,
        overflow: 'hidden',
      };
    }

    return {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: 12,
      overflow: 'hidden',
    };
  }

  static getOptimalBlurIntensity(): number {
    return this.performanceService?.getOptimalBlurIntensity() ?? 60;
  }
}

// Static styles for backwards compatibility
export const GlassmorphismStyles = {
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    overflow: 'hidden',
  } as ViewStyle,
  
  navigation: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    overflow: 'hidden',
  } as ViewStyle,
  
  premiumCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 16,
    overflow: 'hidden',
  } as ViewStyle,
};