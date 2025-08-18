// src/services/performanceService.ts
import { Platform, Dimensions } from 'react-native';

export interface PerformanceMetrics {
  deviceInfo: DeviceInfo;
  renderMetrics: RenderMetrics;
  memoryMetrics: MemoryMetrics;
  recommendations: PerformanceRecommendations;
}

export interface DeviceInfo {
  platform: string;
  screenSize: { width: number; height: number };
  pixelDensity: number;
  estimatedPerformanceTier: 'high' | 'medium' | 'low';
}

export interface RenderMetrics {
  averageFrameTime: number;
  droppedFrames: number;
  blurRenderTime: number;
  imageLoadTime: number;
}

export interface MemoryMetrics {
  usedMemoryMB: number;
  availableMemoryMB: number;
  cacheUsageMB: number;
  memoryPressure: 'low' | 'medium' | 'high';
}

export interface PerformanceRecommendations {
  blurIntensity: number;
  imageQuality: number;
  animationDuration: number;
  enableLazyLoading: boolean;
  enableImageCaching: boolean;
  maxConcurrentAnimations: number;
}

export class PerformanceService {
  private static instance: PerformanceService;
  private metrics: Partial<PerformanceMetrics> = {};
  private renderTimes: number[] = [];
  private memoryReadings: number[] = [];
  private blurRenderTimes: number[] = [];
  private animationStartTime: number = 0;
  private frameCallbacks: (() => void)[] = [];

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  /**
   * Initialize performance monitoring
   */
  async initialize(): Promise<void> {
    this.detectDeviceCapabilities();
    this.startPerformanceMonitoring();
    console.log('PerformanceService initialized');
  }

  /**
   * Detect device capabilities and performance tier
   */
  private detectDeviceCapabilities(): void {
    const { width, height } = Dimensions.get('window');
    const pixelDensity = Dimensions.get('window').scale;
    
    // Estimate performance tier based on screen resolution and platform
    let performanceTier: 'high' | 'medium' | 'low' = 'medium';
    
    const totalPixels = width * height * pixelDensity;
    
    if (Platform.OS === 'ios') {
      // iOS devices generally have better performance
      if (totalPixels > 2000000) { // High-res devices
        performanceTier = 'high';
      } else if (totalPixels > 1000000) {
        performanceTier = 'high';
      } else {
        performanceTier = 'medium';
      }
    } else {
      // Android varies widely
      if (totalPixels > 2500000) {
        performanceTier = 'medium'; // High-res Android can struggle
      } else if (totalPixels > 1500000) {
        performanceTier = 'medium';
      } else {
        performanceTier = 'low';
      }
    }

    this.metrics.deviceInfo = {
      platform: Platform.OS,
      screenSize: { width, height },
      pixelDensity,
      estimatedPerformanceTier: performanceTier,
    };
  }

  /**
   * Start monitoring performance metrics
   */
  private startPerformanceMonitoring(): void {
    // Monitor frame drops (simplified)
    setInterval(() => {
      this.collectRenderMetrics();
      this.collectMemoryMetrics();
    }, 5000); // Every 5 seconds
  }

  /**
   * Collect render performance metrics
   */
  private collectRenderMetrics(): void {
    // In a real implementation, you'd use performance monitoring libraries
    // For now, we'll simulate based on device capabilities
    const deviceTier = this.metrics.deviceInfo?.estimatedPerformanceTier || 'medium';
    
    let frameTime = 16; // Target 60fps
    let droppedFrames = 0;
    
    switch (deviceTier) {
      case 'high':
        frameTime = 16 + Math.random() * 2; // Very stable
        droppedFrames = Math.random() < 0.1 ? 1 : 0;
        break;
      case 'medium':
        frameTime = 16 + Math.random() * 8; // Some variance
        droppedFrames = Math.random() < 0.2 ? Math.floor(Math.random() * 3) : 0;
        break;
      case 'low':
        frameTime = 16 + Math.random() * 16; // More variance
        droppedFrames = Math.random() < 0.4 ? Math.floor(Math.random() * 5) : 0;
        break;
    }
    
    this.renderTimes.push(frameTime);
    if (this.renderTimes.length > 100) {
      this.renderTimes.shift();
    }
    
    const avgBlurTime = this.blurRenderTimes.length > 0 
      ? this.blurRenderTimes.reduce((a, b) => a + b) / this.blurRenderTimes.length 
      : 0;
    
    this.metrics.renderMetrics = {
      averageFrameTime: this.renderTimes.reduce((a, b) => a + b) / this.renderTimes.length,
      droppedFrames,
      blurRenderTime: avgBlurTime,
      imageLoadTime: 200 + Math.random() * 300, // Simulated
    };
  }

  /**
   * Collect memory usage metrics
   */
  private collectMemoryMetrics(): void {
    // Simulated memory metrics (in a real app, you'd use native modules)
    const deviceTier = this.metrics.deviceInfo?.estimatedPerformanceTier || 'medium';
    
    let usedMemoryMB = 50 + Math.random() * 100;
    let availableMemoryMB = 1000;
    
    switch (deviceTier) {
      case 'high':
        availableMemoryMB = 3000 + Math.random() * 1000;
        break;
      case 'medium':
        availableMemoryMB = 1500 + Math.random() * 500;
        break;
      case 'low':
        availableMemoryMB = 800 + Math.random() * 200;
        usedMemoryMB += 50; // Lower-end devices use more memory
        break;
    }
    
    const memoryUsagePercent = usedMemoryMB / availableMemoryMB;
    let memoryPressure: 'low' | 'medium' | 'high' = 'low';
    
    if (memoryUsagePercent > 0.8) memoryPressure = 'high';
    else if (memoryUsagePercent > 0.6) memoryPressure = 'medium';
    
    this.memoryReadings.push(usedMemoryMB);
    if (this.memoryReadings.length > 50) {
      this.memoryReadings.shift();
    }
    
    this.metrics.memoryMetrics = {
      usedMemoryMB,
      availableMemoryMB,
      cacheUsageMB: 25 + Math.random() * 50, // Simulated cache usage
      memoryPressure,
    };
  }

  /**
   * Record blur render time
   */
  recordBlurRenderTime(timeMs: number): void {
    this.blurRenderTimes.push(timeMs);
    if (this.blurRenderTimes.length > 20) {
      this.blurRenderTimes.shift();
    }
  }

  /**
   * Start tracking animation performance
   */
  startAnimationTracking(animationType: string = 'generic'): void {
    this.animationStartTime = Date.now();
    console.log(`📊 Started tracking animation: ${animationType}`);
  }

  /**
   * Stop tracking animation and return performance data
   */
  stopAnimationTracking(): { duration: number; recommendation: string } {
    const duration = Date.now() - this.animationStartTime;
    const recommendations = this.getAnimationRecommendations(duration);
    
    console.log(`📊 Animation completed in ${duration}ms`);
    return { duration, recommendation: recommendations };
  }

  /**
   * Get animation-specific recommendations
   */
  private getAnimationRecommendations(duration: number): string {
    const deviceTier = this.metrics.deviceInfo?.estimatedPerformanceTier || 'medium';
    
    if (duration > 1000) {
      return `🔴 Animation too slow (${duration}ms). Consider reducing complexity or disabling on ${deviceTier}-end devices.`;
    } else if (duration > 500) {
      return `🟡 Animation could be smoother. Consider optimizing for ${deviceTier}-end devices.`;
    } else if (duration > 250) {
      return `🟢 Good animation performance, acceptable for ${deviceTier}-end devices.`;
    } else {
      return `🟢 Excellent animation performance on ${deviceTier}-end devices.`;
    }
  }

  /**
   * Test blur performance across different intensities
   */
  async testBlurPerformance(): Promise<{ intensity: number; score: number }[]> {
    const testIntensities = [20, 40, 60, 80, 100];
    const results: { intensity: number; score: number }[] = [];
    
    for (const intensity of testIntensities) {
      this.startAnimationTracking(`blur-test-${intensity}`);
      
      // Simulate blur render time based on device and intensity
      const deviceTier = this.metrics.deviceInfo?.estimatedPerformanceTier || 'medium';
      let baseTime = 50;
      
      switch (deviceTier) {
        case 'high': baseTime = 30; break;
        case 'medium': baseTime = 50; break;
        case 'low': baseTime = 80; break;
      }
      
      const renderTime = baseTime + (intensity * 2) + (Math.random() * 20);
      await new Promise(resolve => setTimeout(resolve, renderTime));
      
      const { duration } = this.stopAnimationTracking();
      this.recordBlurRenderTime(duration);
      
      // Calculate performance score (higher is better)
      const score = Math.max(0, 100 - (duration / 10));
      results.push({ intensity, score: Math.round(score) });
    }
    
    return results;
  }

  /**
   * Test list scrolling performance
   */
  async testScrollPerformance(itemCount: number): Promise<{ itemCount: number; score: number; recommendation: string }> {
    this.startAnimationTracking(`scroll-test-${itemCount}`);
    
    // Simulate scroll performance based on item count and device
    const deviceTier = this.metrics.deviceInfo?.estimatedPerformanceTier || 'medium';
    let baseTime = 100;
    
    switch (deviceTier) {
      case 'high': baseTime = 80; break;
      case 'medium': baseTime = 120; break;
      case 'low': baseTime = 200; break;
    }
    
    const scrollTime = baseTime + (itemCount * 2) + (Math.random() * 50);
    await new Promise(resolve => setTimeout(resolve, scrollTime));
    
    const { duration, recommendation } = this.stopAnimationTracking();
    const score = Math.max(0, 100 - (duration / 20));
    
    return {
      itemCount,
      score: Math.round(score),
      recommendation,
    };
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): PerformanceRecommendations {
    const deviceTier = this.metrics.deviceInfo?.estimatedPerformanceTier || 'medium';
    const memoryPressure = this.metrics.memoryMetrics?.memoryPressure || 'low';
    const avgFrameTime = this.metrics.renderMetrics?.averageFrameTime || 16;
    
    let recommendations: PerformanceRecommendations;
    
    switch (deviceTier) {
      case 'high':
        recommendations = {
          blurIntensity: memoryPressure === 'high' ? 60 : 80,
          imageQuality: 0.9,
          animationDuration: 300,
          enableLazyLoading: true,
          enableImageCaching: true,
          maxConcurrentAnimations: 10,
        };
        break;
      case 'medium':
        recommendations = {
          blurIntensity: memoryPressure === 'high' ? 40 : 60,
          imageQuality: 0.8,
          animationDuration: avgFrameTime > 20 ? 200 : 250,
          enableLazyLoading: true,
          enableImageCaching: true,
          maxConcurrentAnimations: 6,
        };
        break;
      case 'low':
        recommendations = {
          blurIntensity: 30,
          imageQuality: 0.6,
          animationDuration: 150,
          enableLazyLoading: true,
          enableImageCaching: true,
          maxConcurrentAnimations: 3,
        };
        break;
    }
    
    // Adjust for memory pressure
    if (memoryPressure === 'high') {
      recommendations.blurIntensity = Math.min(recommendations.blurIntensity, 40);
      recommendations.imageQuality *= 0.8;
      recommendations.maxConcurrentAnimations = Math.floor(recommendations.maxConcurrentAnimations * 0.6);
    }
    
    this.metrics.recommendations = recommendations;
    return recommendations;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      deviceInfo: this.metrics.deviceInfo!,
      renderMetrics: this.metrics.renderMetrics!,
      memoryMetrics: this.metrics.memoryMetrics!,
      recommendations: this.getRecommendations(),
    };
  }

  /**
   * Check if device should use reduced effects
   */
  shouldUseReducedEffects(): boolean {
    const recommendations = this.getRecommendations();
    return recommendations.blurIntensity < 50 || 
           this.metrics.memoryMetrics?.memoryPressure === 'high';
  }

  /**
   * Get optimal blur intensity for current conditions
   */
  getOptimalBlurIntensity(): number {
    return this.getRecommendations().blurIntensity;
  }

  /**
   * Get optimal image quality for current conditions
   */
  getOptimalImageQuality(): number {
    return this.getRecommendations().imageQuality;
  }

  /**
   * Clear performance history
   */
  clearHistory(): void {
    this.renderTimes = [];
    this.memoryReadings = [];
    this.blurRenderTimes = [];
  }
}