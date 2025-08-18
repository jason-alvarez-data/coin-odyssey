// src/hooks/usePerformanceMonitor.ts
import { useState, useEffect, useCallback } from 'react';
import { PerformanceService, PerformanceMetrics } from '../services/performanceService';

export interface PerformanceMonitorHookResult {
  metrics: PerformanceMetrics | null;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  getRecommendations: () => any;
  shouldUseReducedEffects: boolean;
  optimalBlurIntensity: number;
}

export const usePerformanceMonitor = (autoStart: boolean = false): PerformanceMonitorHookResult => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [performanceService] = useState(() => PerformanceService.getInstance());

  const updateMetrics = useCallback(() => {
    try {
      const currentMetrics = performanceService.getMetrics();
      setMetrics(currentMetrics);
    } catch (error) {
      console.warn('Failed to get performance metrics:', error);
    }
  }, [performanceService]);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    updateMetrics();
  }, [updateMetrics]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  const getRecommendations = useCallback(() => {
    return performanceService.getRecommendations();
  }, [performanceService]);

  useEffect(() => {
    if (autoStart) {
      startMonitoring();
    }
  }, [autoStart, startMonitoring]);

  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(updateMetrics, 2000); // Update every 2 seconds

    return () => {
      clearInterval(interval);
    };
  }, [isMonitoring, updateMetrics]);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getRecommendations,
    shouldUseReducedEffects: performanceService.shouldUseReducedEffects(),
    optimalBlurIntensity: performanceService.getOptimalBlurIntensity(),
  };
};

// Hook for component-level performance optimization
export const useComponentPerformance = () => {
  const [performanceService] = useState(() => PerformanceService.getInstance());

  const shouldReduceEffects = performanceService.shouldUseReducedEffects();
  const optimalBlurIntensity = performanceService.getOptimalBlurIntensity();
  const optimalImageQuality = performanceService.getOptimalImageQuality();

  const recordBlurRender = useCallback((timeMs: number) => {
    performanceService.recordBlurRenderTime(timeMs);
  }, [performanceService]);

  return {
    shouldReduceEffects,
    optimalBlurIntensity,
    optimalImageQuality,
    recordBlurRender,
  };
};

// Development-only performance overlay hook
export const usePerformanceOverlay = (enabled: boolean = __DEV__) => {
  const { metrics, isMonitoring, startMonitoring } = usePerformanceMonitor(enabled);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (enabled && !isMonitoring) {
      startMonitoring();
    }
  }, [enabled, isMonitoring, startMonitoring]);

  const toggleOverlay = useCallback(() => {
    setShowOverlay(prev => !prev);
  }, []);

  return {
    metrics,
    showOverlay,
    toggleOverlay,
    enabled: enabled && isMonitoring,
  };
};