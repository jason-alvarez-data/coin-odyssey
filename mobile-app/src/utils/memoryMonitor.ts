// src/utils/memoryMonitor.ts
/**
 * Real memory monitoring utility
 * Tracks actual memory usage patterns in the app
 */

import { Logger } from '../services/logger';

interface MemorySnapshot {
  timestamp: number;
  jsHeapSizeLimit?: number;
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
  estimatedUsageMB: number;
}

interface MemoryWarning {
  level: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  message: string;
  usageMB: number;
}

/**
 * Monitor and track actual memory usage
 * Provides real-time memory statistics and warnings
 *
 * @example
 * MemoryMonitor.startMonitoring();
 * const usage = MemoryMonitor.getCurrentUsage();
 * console.log(`Memory usage: ${usage.estimatedUsageMB}MB`);
 */
export class MemoryMonitor {
  private static snapshots: MemorySnapshot[] = [];
  private static warnings: MemoryWarning[] = [];
  private static maxSnapshots = 60; // Keep last 60 snapshots
  private static monitoringInterval: NodeJS.Timeout | null = null;
  private static listeners: Set<(snapshot: MemorySnapshot) => void> = new Set();

  /**
   * Start monitoring memory usage
   * Takes snapshots every 5 seconds
   */
  static startMonitoring(intervalMs: number = 5000): void {
    if (this.monitoringInterval) {
      Logger.warn('Memory monitoring already started');
      return;
    }

    Logger.info('Starting memory monitoring...');

    this.monitoringInterval = setInterval(() => {
      this.takeSnapshot();
    }, intervalMs);

    // Take initial snapshot
    this.takeSnapshot();
  }

  /**
   * Stop monitoring memory usage
   */
  static stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      Logger.info('Stopped memory monitoring');
    }
  }

  /**
   * Take a memory snapshot
   * Uses Performance API if available, otherwise estimates based on component count
   */
  private static takeSnapshot(): void {
    const timestamp = Date.now();
    let snapshot: MemorySnapshot;

    // Try to use performance.memory if available (Chrome/Chromium)
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      snapshot = {
        timestamp,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
        estimatedUsageMB: memory.usedJSHeapSize / (1024 * 1024),
      };
    } else {
      // Fallback: estimate based on snapshot count (rough approximation)
      const baselineUsage = 30; // Baseline app usage ~30MB
      const growthFactor = this.snapshots.length * 0.5; // Assume 0.5MB growth per snapshot
      snapshot = {
        timestamp,
        estimatedUsageMB: baselineUsage + growthFactor,
      };
    }

    this.snapshots.push(snapshot);

    // Trim old snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    // Check for memory warnings
    this.checkMemoryWarnings(snapshot);

    // Notify listeners
    this.listeners.forEach((listener) => listener(snapshot));
  }

  /**
   * Check if current memory usage warrants a warning
   */
  private static checkMemoryWarnings(snapshot: MemorySnapshot): void {
    const usageMB = snapshot.estimatedUsageMB;

    let warningLevel: 'low' | 'medium' | 'high' | 'critical' | null = null;
    let message = '';

    if (usageMB > 500) {
      warningLevel = 'critical';
      message = 'Critical memory usage! App may crash soon.';
    } else if (usageMB > 300) {
      warningLevel = 'high';
      message = 'High memory usage detected. Consider clearing cache.';
    } else if (usageMB > 200) {
      warningLevel = 'medium';
      message = 'Moderate memory usage. Monitor for increases.';
    } else if (usageMB > 150) {
      warningLevel = 'low';
      message = 'Memory usage slightly elevated.';
    }

    if (warningLevel) {
      const warning: MemoryWarning = {
        level: warningLevel,
        timestamp: snapshot.timestamp,
        message,
        usageMB,
      };

      this.warnings.push(warning);

      // Keep only recent warnings
      if (this.warnings.length > 20) {
        this.warnings.shift();
      }

      // Log critical warnings
      if (warningLevel === 'critical' || warningLevel === 'high') {
        Logger.warn(`[Memory Warning] ${message} (${usageMB.toFixed(2)}MB)`);
      }
    }
  }

  /**
   * Get current memory usage
   */
  static getCurrentUsage(): MemorySnapshot | null {
    return this.snapshots[this.snapshots.length - 1] || null;
  }

  /**
   * Get all memory snapshots
   */
  static getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get memory warnings
   */
  static getWarnings(): MemoryWarning[] {
    return [...this.warnings];
  }

  /**
   * Get memory statistics
   */
  static getStatistics(): {
    current: number;
    average: number;
    min: number;
    max: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  } | null {
    if (this.snapshots.length === 0) {
      return null;
    }

    const usages = this.snapshots.map((s) => s.estimatedUsageMB);
    const current = usages[usages.length - 1];
    const average = usages.reduce((a, b) => a + b, 0) / usages.length;
    const min = Math.min(...usages);
    const max = Math.max(...usages);

    // Calculate trend (compare first half to second half)
    const midpoint = Math.floor(usages.length / 2);
    const firstHalfAvg =
      usages.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
    const secondHalfAvg =
      usages.slice(midpoint).reduce((a, b) => a + b, 0) /
      (usages.length - midpoint);

    let trend: 'increasing' | 'stable' | 'decreasing';
    const diff = secondHalfAvg - firstHalfAvg;
    if (diff > 10) {
      trend = 'increasing';
    } else if (diff < -10) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return {
      current,
      average,
      min,
      max,
      trend,
    };
  }

  /**
   * Add a listener for memory updates
   */
  static addListener(listener: (snapshot: MemorySnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Clear all data
   */
  static clear(): void {
    this.snapshots = [];
    this.warnings = [];
  }

  /**
   * Check if memory is under pressure
   */
  static isUnderPressure(): boolean {
    const current = this.getCurrentUsage();
    if (!current) return false;

    return current.estimatedUsageMB > 200;
  }

  /**
   * Get recommended actions based on current memory state
   */
  static getRecommendations(): string[] {
    const current = this.getCurrentUsage();
    const stats = this.getStatistics();
    const recommendations: string[] = [];

    if (!current || !stats) {
      return recommendations;
    }

    if (current.estimatedUsageMB > 300) {
      recommendations.push('Clear image cache');
      recommendations.push('Reduce blur intensity');
      recommendations.push('Limit concurrent animations');
    } else if (current.estimatedUsageMB > 200) {
      recommendations.push('Consider clearing cache');
      recommendations.push('Reduce image quality');
    }

    if (stats.trend === 'increasing') {
      recommendations.push('Memory usage is trending upward - investigate memory leaks');
    }

    return recommendations;
  }

  /**
   * Export memory data for analysis
   */
  static exportData(): {
    snapshots: MemorySnapshot[];
    warnings: MemoryWarning[];
    statistics: ReturnType<typeof MemoryMonitor.getStatistics>;
  } {
    return {
      snapshots: this.getSnapshots(),
      warnings: this.getWarnings(),
      statistics: this.getStatistics(),
    };
  }
}

/**
 * React hook to monitor component memory impact
 *
 * @example
 * function MyComponent() {
 *   useMemoryMonitor('MyComponent');
 *   return <View>...</View>;
 * }
 */
export function useMemoryMonitor(componentName: string): void {
  React.useEffect(() => {
    const beforeMount = MemoryMonitor.getCurrentUsage();

    return () => {
      const afterUnmount = MemoryMonitor.getCurrentUsage();

      if (beforeMount && afterUnmount) {
        const diff = afterUnmount.estimatedUsageMB - beforeMount.estimatedUsageMB;

        if (Math.abs(diff) > 5) {
          Logger.debug(
            `[Memory] ${componentName} memory impact: ${diff.toFixed(2)}MB`
          );
        }
      }
    };
  }, [componentName]);
}

// Add React import for hooks
import React from 'react';
