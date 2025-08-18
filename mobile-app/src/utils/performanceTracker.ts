// src/utils/performanceTracker.ts
import { InteractionManager, Platform } from 'react-native';

export interface PerformanceMetrics {
  animationFrameRate: number;
  jsFrameRate: number;
  uiFrameRate: number;
  memoryUsage: number;
  timestamp: number;
  interactionComplete: boolean;
}

export interface AnimationPerformanceResult {
  averageFrameRate: number;
  droppedFrames: number;
  smoothnessScore: number; // 0-100
  recommendation: string;
  metrics: PerformanceMetrics[];
}

export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: PerformanceMetrics[] = [];
  private isTracking = false;
  private trackingInterval: NodeJS.Timeout | null = null;
  private startTime = 0;
  
  // Performance thresholds
  private static readonly TARGET_FPS = 60;
  private static readonly MINIMUM_ACCEPTABLE_FPS = 45;
  private static readonly EXCELLENT_FPS = 55;

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  startTracking(testName: string = 'Animation Test'): void {
    if (this.isTracking) {
      this.stopTracking();
    }

    console.log(`🎬 Starting performance tracking: ${testName}`);
    this.isTracking = true;
    this.startTime = Date.now();
    this.metrics = [];

    // Track performance metrics every 16ms (60fps target)
    this.trackingInterval = setInterval(() => {
      this.captureMetrics();
    }, 16);
  }

  stopTracking(): AnimationPerformanceResult {
    if (!this.isTracking) {
      throw new Error('Performance tracking is not active');
    }

    this.isTracking = false;
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    const result = this.analyzeMetrics();
    console.log('📊 Performance tracking completed:', result);
    
    return result;
  }

  private captureMetrics(): void {
    const now = Date.now();
    
    // Simulate frame rate measurement (in a real implementation, you'd use native modules)
    const baseFrameRate = this.estimateFrameRate();
    
    const metrics: PerformanceMetrics = {
      animationFrameRate: baseFrameRate + this.getRandomVariation(5),
      jsFrameRate: baseFrameRate + this.getRandomVariation(3),
      uiFrameRate: baseFrameRate + this.getRandomVariation(2),
      memoryUsage: this.estimateMemoryUsage(),
      timestamp: now - this.startTime,
      interactionComplete: now - this.startTime > 1000, // Mark interaction as complete after 1s
    };

    this.metrics.push(metrics);
  }

  private estimateFrameRate(): number {
    // Simulate frame rate based on device performance and current load
    const basePerformance = Platform.OS === 'ios' ? 58 : 55;
    const memoryPressure = this.getMemoryPressure();
    const randomVariation = this.getRandomVariation(8);
    
    return Math.max(30, basePerformance - memoryPressure - randomVariation);
  }

  private estimateMemoryUsage(): number {
    // Simulate memory usage (MB)
    return 150 + Math.random() * 50;
  }

  private getMemoryPressure(): number {
    // Simulate memory pressure affecting performance
    return Math.random() * 10;
  }

  private getRandomVariation(range: number): number {
    return (Math.random() - 0.5) * range;
  }

  private analyzeMetrics(): AnimationPerformanceResult {
    if (this.metrics.length === 0) {
      throw new Error('No metrics captured during tracking');
    }

    const frameRates = this.metrics.map(m => m.animationFrameRate);
    const averageFrameRate = frameRates.reduce((a, b) => a + b, 0) / frameRates.length;
    
    const droppedFrames = frameRates.filter(
      fps => fps < PerformanceTracker.MINIMUM_ACCEPTABLE_FPS
    ).length;
    
    const smoothnessScore = this.calculateSmoothnessScore(frameRates);
    const recommendation = this.generateRecommendation(averageFrameRate, droppedFrames, smoothnessScore);

    return {
      averageFrameRate: Math.round(averageFrameRate * 100) / 100,
      droppedFrames,
      smoothnessScore: Math.round(smoothnessScore * 100) / 100,
      recommendation,
      metrics: [...this.metrics],
    };
  }

  private calculateSmoothnessScore(frameRates: number[]): number {
    const consistencyScore = this.calculateConsistency(frameRates);
    const performanceScore = this.calculatePerformanceScore(frameRates);
    
    return (consistencyScore * 0.4) + (performanceScore * 0.6);
  }

  private calculateConsistency(frameRates: number[]): number {
    const variance = this.calculateVariance(frameRates);
    const maxVariance = 100; // Maximum acceptable variance
    return Math.max(0, 100 - (variance / maxVariance) * 100);
  }

  private calculatePerformanceScore(frameRates: number[]): number {
    const averageFps = frameRates.reduce((a, b) => a + b, 0) / frameRates.length;
    
    if (averageFps >= PerformanceTracker.EXCELLENT_FPS) {
      return 100;
    } else if (averageFps >= PerformanceTracker.MINIMUM_ACCEPTABLE_FPS) {
      const range = PerformanceTracker.EXCELLENT_FPS - PerformanceTracker.MINIMUM_ACCEPTABLE_FPS;
      const position = averageFps - PerformanceTracker.MINIMUM_ACCEPTABLE_FPS;
      return 60 + (position / range) * 40;
    } else {
      return Math.max(0, (averageFps / PerformanceTracker.MINIMUM_ACCEPTABLE_FPS) * 60);
    }
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  private generateRecommendation(
    averageFps: number, 
    droppedFrames: number, 
    smoothnessScore: number
  ): string {
    if (smoothnessScore >= 90) {
      return '🟢 Excellent performance! Animations are smooth and responsive.';
    } else if (smoothnessScore >= 75) {
      return '🟡 Good performance with minor frame drops. Consider reducing animation complexity for slower devices.';
    } else if (smoothnessScore >= 60) {
      return '🟠 Moderate performance issues detected. Recommend optimizing animations or reducing effects.';
    } else if (averageFps < PerformanceTracker.MINIMUM_ACCEPTABLE_FPS) {
      return '🔴 Poor performance detected. Animations may appear choppy. Reduce blur intensity, simplify animations, or disable effects on low-end devices.';
    } else if (droppedFrames > this.metrics.length * 0.3) {
      return '🟠 Inconsistent performance with frequent frame drops. Check for expensive operations during animations.';
    } else {
      return '🟡 Performance needs improvement. Consider performance optimizations.';
    }
  }

  // Utility methods for testing specific animation scenarios
  async trackBlurAnimation(intensity: number, duration: number): Promise<AnimationPerformanceResult> {
    this.startTracking(`Blur Animation Test (intensity: ${intensity}, duration: ${duration}ms)`);
    
    // Simulate animation duration
    await new Promise(resolve => setTimeout(resolve, duration));
    
    return this.stopTracking();
  }

  async trackListScrolling(itemCount: number, scrollDuration: number): Promise<AnimationPerformanceResult> {
    this.startTracking(`List Scrolling Test (${itemCount} items, ${scrollDuration}ms)`);
    
    await new Promise(resolve => setTimeout(resolve, scrollDuration));
    
    return this.stopTracking();
  }

  async trackImageLoading(imageCount: number): Promise<AnimationPerformanceResult> {
    this.startTracking(`Image Loading Test (${imageCount} images)`);
    
    // Simulate image loading time
    const loadingTime = imageCount * 100; // 100ms per image
    await new Promise(resolve => setTimeout(resolve, loadingTime));
    
    return this.stopTracking();
  }

  // Generate performance report
  generatePerformanceReport(results: AnimationPerformanceResult[]): string {
    if (results.length === 0) {
      return 'No performance data available';
    }

    const averageScore = results.reduce((sum, result) => sum + result.smoothnessScore, 0) / results.length;
    const worstPerformance = Math.min(...results.map(r => r.smoothnessScore));
    const bestPerformance = Math.max(...results.map(r => r.smoothnessScore));

    let report = '📊 Performance Report Summary\n';
    report += '═'.repeat(40) + '\n';
    report += `Average Performance Score: ${averageScore.toFixed(1)}/100\n`;
    report += `Best Performance: ${bestPerformance.toFixed(1)}/100\n`;
    report += `Worst Performance: ${worstPerformance.toFixed(1)}/100\n`;
    report += `Tests Conducted: ${results.length}\n\n`;

    report += 'Individual Test Results:\n';
    report += '─'.repeat(40) + '\n';
    results.forEach((result, index) => {
      report += `Test ${index + 1}:\n`;
      report += `  Frame Rate: ${result.averageFrameRate.toFixed(1)} fps\n`;
      report += `  Dropped Frames: ${result.droppedFrames}\n`;
      report += `  Smoothness: ${result.smoothnessScore.toFixed(1)}/100\n`;
      report += `  ${result.recommendation}\n\n`;
    });

    return report;
  }

  // Clear all stored metrics
  clearMetrics(): void {
    this.metrics = [];
  }
}

// Hook for using performance tracking in React components
import React, { useCallback, useState } from 'react';

export const useAnimationPerformance = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [results, setResults] = useState<AnimationPerformanceResult[]>([]);
  const tracker = PerformanceTracker.getInstance();

  const startTracking = useCallback((testName?: string) => {
    tracker.startTracking(testName);
    setIsTracking(true);
  }, [tracker]);

  const stopTracking = useCallback(() => {
    const result = tracker.stopTracking();
    setResults(prev => [...prev, result]);
    setIsTracking(false);
    return result;
  }, [tracker]);

  const clearResults = useCallback(() => {
    setResults([]);
    tracker.clearMetrics();
  }, [tracker]);

  const trackBlurAnimation = useCallback(async (intensity: number, duration: number) => {
    const result = await tracker.trackBlurAnimation(intensity, duration);
    setResults(prev => [...prev, result]);
    return result;
  }, [tracker]);

  const trackListScrolling = useCallback(async (itemCount: number, scrollDuration: number) => {
    const result = await tracker.trackListScrolling(itemCount, scrollDuration);
    setResults(prev => [...prev, result]);
    return result;
  }, [tracker]);

  const trackImageLoading = useCallback(async (imageCount: number) => {
    const result = await tracker.trackImageLoading(imageCount);
    setResults(prev => [...prev, result]);
    return result;
  }, [tracker]);

  const generateReport = useCallback(() => {
    return tracker.generatePerformanceReport(results);
  }, [tracker, results]);

  return {
    isTracking,
    results,
    startTracking,
    stopTracking,
    clearResults,
    trackBlurAnimation,
    trackListScrolling,
    trackImageLoading,
    generateReport,
  };
};