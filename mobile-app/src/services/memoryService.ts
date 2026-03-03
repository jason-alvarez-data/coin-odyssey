// src/services/memoryService.ts
import { Platform } from 'react-native';
import { Logger } from './logger';

export interface MemoryStats {
  usedMemoryMB: number;
  availableMemoryMB: number;
  memoryPressure: 'low' | 'medium' | 'high' | 'critical';
  recommendations: MemoryRecommendations;
}

export interface MemoryRecommendations {
  maxItemsToRender: number;
  enableImageCaching: boolean;
  enableBlurEffects: boolean;
  useVirtualization: boolean;
  maxConcurrentImages: number;
  compressionQuality: number;
}

export class MemoryService {
  private static instance: MemoryService;
  private memoryWarnings: number = 0;
  private isMonitoring: boolean = false;
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private callbacks: Array<(stats: MemoryStats) => void> = [];

  static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  /**
   * Initialize memory monitoring
   */
  initialize(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.startMemoryMonitoring();
    Logger.info('MemoryService initialized');
  }

  /**
   * Start monitoring memory usage
   */
  private startMemoryMonitoring(): void {
    // Monitor memory every 10 seconds
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryPressure();
    }, 10000);

    // Listen for memory warnings (iOS)
    if (Platform.OS === 'ios') {
      // In a real implementation, you'd listen to native memory warnings
      // For now, simulate based on usage patterns
    }
  }

  /**
   * Check current memory pressure
   */
  private checkMemoryPressure(): void {
    const stats = this.getMemoryStats();
    
    // Notify callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(stats);
      } catch (error) {
        Logger.warn('Memory callback error', error);
      }
    });

    // Handle critical memory situations
    if (stats.memoryPressure === 'critical') {
      this.handleCriticalMemory();
    }
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats {
    // Simulate memory stats (in production, use native modules)
    const estimatedUsage = this.estimateMemoryUsage();
    const availableMemory = this.getAvailableMemory();
    const memoryPressure = this.calculateMemoryPressure(estimatedUsage, availableMemory);

    return {
      usedMemoryMB: estimatedUsage,
      availableMemoryMB: availableMemory,
      memoryPressure,
      recommendations: this.getMemoryRecommendations(memoryPressure),
    };
  }

  /**
   * Estimate current memory usage
   */
  private estimateMemoryUsage(): number {
    // Base app memory usage
    let estimatedMB = 50;

    // Increase estimate based on accumulated memory warnings
    estimatedMB += this.memoryWarnings * 10;

    // Increase based on number of registered callbacks (proxy for active components)
    estimatedMB += this.callbacks.length * 5;

    return estimatedMB;
  }

  /**
   * Get available memory based on device
   */
  private getAvailableMemory(): number {
    // Conservative estimate based on platform
    if (Platform.OS === 'ios') {
      return 3000; // 3GB typical for iOS devices
    } else {
      return 2000; // 2GB typical for Android devices
    }
  }

  /**
   * Calculate memory pressure level
   */
  private calculateMemoryPressure(used: number, available: number): 'low' | 'medium' | 'high' | 'critical' {
    const usagePercent = used / available;

    if (usagePercent > 0.9) return 'critical';
    if (usagePercent > 0.7) return 'high';
    if (usagePercent > 0.5) return 'medium';
    return 'low';
  }

  /**
   * Get memory-based recommendations
   */
  private getMemoryRecommendations(pressure: string): MemoryRecommendations {
    switch (pressure) {
      case 'critical':
        return {
          maxItemsToRender: 10,
          enableImageCaching: false,
          enableBlurEffects: false,
          useVirtualization: true,
          maxConcurrentImages: 3,
          compressionQuality: 0.5,
        };
      case 'high':
        return {
          maxItemsToRender: 20,
          enableImageCaching: true,
          enableBlurEffects: false,
          useVirtualization: true,
          maxConcurrentImages: 5,
          compressionQuality: 0.6,
        };
      case 'medium':
        return {
          maxItemsToRender: 50,
          enableImageCaching: true,
          enableBlurEffects: true,
          useVirtualization: true,
          maxConcurrentImages: 8,
          compressionQuality: 0.7,
        };
      default: // low
        return {
          maxItemsToRender: 100,
          enableImageCaching: true,
          enableBlurEffects: true,
          useVirtualization: false,
          maxConcurrentImages: 15,
          compressionQuality: 0.8,
        };
    }
  }

  /**
   * Handle critical memory situations
   */
  private handleCriticalMemory(): void {
    Logger.warn('Critical memory pressure detected');
    
    // Force garbage collection if possible
    if (global.gc) {
      global.gc();
    }

    // Clear image caches
    this.requestCacheClearance();

    // Increment warning counter
    this.memoryWarnings++;
  }

  /**
   * Request cache clearance from other services
   */
  private requestCacheClearance(): void {
    // Emit event for other services to clear caches
    // In a real implementation, you'd use an event emitter
    Logger.info('Requesting cache clearance due to memory pressure');
  }

  /**
   * Register callback for memory changes
   */
  onMemoryChange(callback: (stats: MemoryStats) => void): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Stop monitoring and clean up resources
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    this.callbacks = [];
  }

  /**
   * Force memory cleanup
   */
  forceCleanup(): void {
    Logger.info('Forcing memory cleanup');
    
    if (global.gc) {
      global.gc();
    }

    this.requestCacheClearance();
  }

  /**
   * Get collection size recommendations based on memory
   */
  getCollectionSizeRecommendations(itemCount: number): {
    shouldVirtualize: boolean;
    batchSize: number;
    enableLazyLoading: boolean;
    enableImagePreloading: boolean;
  } {
    const stats = this.getMemoryStats();
    const recommendations = stats.recommendations;

    return {
      shouldVirtualize: itemCount > 20 || recommendations.useVirtualization,
      batchSize: Math.min(recommendations.maxItemsToRender, 20),
      enableLazyLoading: itemCount > 10,
      enableImagePreloading: stats.memoryPressure === 'low' && itemCount < 100,
    };
  }

  /**
   * Check if large collection optimizations should be enabled
   */
  shouldOptimizeForLargeCollection(itemCount: number): boolean {
    if (itemCount < 50) return false;
    
    const stats = this.getMemoryStats();
    return stats.memoryPressure !== 'low' || itemCount > 200;
  }

  /**
   * Get optimal image quality based on memory pressure
   */
  getOptimalImageQuality(): number {
    const stats = this.getMemoryStats();
    return stats.recommendations.compressionQuality;
  }
}