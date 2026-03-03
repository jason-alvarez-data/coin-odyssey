// src/utils/realPerformanceTracker.ts
/**
 * Real performance tracking utility using actual React Native Performance API
 * Replaces simulated metrics with actual measurements
 */

import { Platform, InteractionManager } from 'react-native';
import { Logger } from '../services/logger';

interface PerformanceMark {
  name: string;
  startTime: number;
}

interface PerformanceMeasure {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
}

/**
 * Real-time performance tracker using React Native's Performance API
 * Provides actual measurements instead of simulated data
 *
 * @example
 * // Track component render
 * RealPerformanceTracker.mark('ComponentRender-start');
 * // ... render logic ...
 * RealPerformanceTracker.mark('ComponentRender-end');
 * const duration = RealPerformanceTracker.measure(
 *   'ComponentRender',
 *   'ComponentRender-start',
 *   'ComponentRender-end'
 * );
 */
export class RealPerformanceTracker {
  private static marks: Map<string, PerformanceMark> = new Map();
  private static measures: PerformanceMeasure[] = [];
  private static maxMeasures = 100;

  /**
   * Create a performance mark at the current time
   * @param markName - Unique identifier for this mark
   */
  static mark(markName: string): void {
    const startTime = Date.now();
    this.marks.set(markName, { name: markName, startTime });
  }

  /**
   * Measure time between two marks
   * @param measureName - Name for this measurement
   * @param startMark - Name of the start mark
   * @param endMark - Name of the end mark
   * @returns Duration in milliseconds, or null if marks don't exist
   */
  static measure(
    measureName: string,
    startMark: string,
    endMark: string
  ): number | null {
    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);

    if (!start || !end) {
      Logger.warn(`Performance marks not found: ${startMark} or ${endMark}`);
      return null;
    }

    const duration = end.startTime - start.startTime;
    const measure: PerformanceMeasure = {
      name: measureName,
      duration,
      startTime: start.startTime,
      endTime: end.startTime,
    };

    this.measures.push(measure);

    // Keep only recent measures
    if (this.measures.length > this.maxMeasures) {
      this.measures.shift();
    }

    // Clean up marks
    this.marks.delete(startMark);
    this.marks.delete(endMark);

    return duration;
  }

  /**
   * Get all recorded measures
   */
  static getMeasures(): PerformanceMeasure[] {
    return [...this.measures];
  }

  /**
   * Get average duration for a specific measure name
   */
  static getAverageDuration(measureName: string): number | null {
    const relevantMeasures = this.measures.filter((m) => m.name === measureName);

    if (relevantMeasures.length === 0) {
      return null;
    }

    const sum = relevantMeasures.reduce((acc, m) => acc + m.duration, 0);
    return sum / relevantMeasures.length;
  }

  /**
   * Clear all marks and measures
   */
  static clear(): void {
    this.marks.clear();
    this.measures = [];
  }

  /**
   * Get performance summary
   */
  static getSummary(): {
    totalMeasures: number;
    averageDuration: number;
    slowestMeasure: PerformanceMeasure | null;
    fastestMeasure: PerformanceMeasure | null;
  } {
    if (this.measures.length === 0) {
      return {
        totalMeasures: 0,
        averageDuration: 0,
        slowestMeasure: null,
        fastestMeasure: null,
      };
    }

    const sum = this.measures.reduce((acc, m) => acc + m.duration, 0);
    const avg = sum / this.measures.length;

    const sorted = [...this.measures].sort((a, b) => b.duration - a.duration);

    return {
      totalMeasures: this.measures.length,
      averageDuration: avg,
      slowestMeasure: sorted[0],
      fastestMeasure: sorted[sorted.length - 1],
    };
  }
}

/**
 * React hook for tracking component render performance
 *
 * @example
 * function MyComponent() {
 *   useRenderPerformance('MyComponent');
 *   return <View>...</View>;
 * }
 */
export function useRenderPerformance(componentName: string): void {
  // Mark render start
  RealPerformanceTracker.mark(`${componentName}-render-start`);

  // Use effect to measure after render completes
  React.useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      RealPerformanceTracker.mark(`${componentName}-render-end`);
      const duration = RealPerformanceTracker.measure(
        `${componentName}-render`,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      );

      if (duration !== null && duration > 16) {
        // Log slow renders (> 16ms = dropped frame)
        Logger.warn(`Slow render detected in ${componentName}: ${duration}ms`);
      }
    });
  });
}

/**
 * Higher-order component to track render performance
 *
 * @example
 * export default withPerformanceTracking(MyComponent, 'MyComponent');
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return (props: P) => {
    useRenderPerformance(componentName);
    return React.createElement(Component, props);
  };
}

/**
 * Measure async operation performance
 *
 * @example
 * const data = await measureAsync('FetchCoins', async () => {
 *   return await CoinService.getUserCoins();
 * });
 */
export async function measureAsync<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  RealPerformanceTracker.mark(`${operationName}-start`);

  try {
    const result = await operation();

    RealPerformanceTracker.mark(`${operationName}-end`);
    const duration = RealPerformanceTracker.measure(
      operationName,
      `${operationName}-start`,
      `${operationName}-end`
    );

    if (duration !== null) {
      Logger.debug(`${operationName} completed in ${duration}ms`);
    }

    return result;
  } catch (error) {
    RealPerformanceTracker.mark(`${operationName}-end`);
    RealPerformanceTracker.measure(
      operationName,
      `${operationName}-start`,
      `${operationName}-end`
    );
    throw error;
  }
}

/**
 * Track app startup performance
 */
export class AppStartupTracker {
  private static appStartTime: number = Date.now();
  private static milestones: Map<string, number> = new Map();

  /**
   * Mark a startup milestone
   */
  static markMilestone(name: string): void {
    const elapsed = Date.now() - this.appStartTime;
    this.milestones.set(name, elapsed);
    Logger.debug(`[Startup] ${name}: ${elapsed}ms`);
  }

  /**
   * Get all startup milestones
   */
  static getMilestones(): Record<string, number> {
    return Object.fromEntries(this.milestones);
  }

  /**
   * Get total startup time
   */
  static getTotalStartupTime(): number {
    return Date.now() - this.appStartTime;
  }

  /**
   * Reset startup tracking
   */
  static reset(): void {
    this.appStartTime = Date.now();
    this.milestones.clear();
  }
}

// Add React import for hooks
import React from 'react';
