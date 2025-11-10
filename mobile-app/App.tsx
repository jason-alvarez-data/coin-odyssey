import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { ImageService } from './src/services/imageService';
import { PerformanceService } from './src/services/performanceService';
import { MemoryService } from './src/services/memoryService';
import { OptimizedGlassmorphismStyles } from './src/styles/optimizedEffects';
import { Logger } from './src/services/logger';
import { ErrorBoundary } from './src/components/common';
import { AppStartupTracker, RealPerformanceTracker } from './src/utils/realPerformanceTracker';
import { MemoryMonitor } from './src/utils/memoryMonitor';
import { registerScreenPreloads, PreloadingStrategy } from './src/utils/preloadingStrategy';

export default function App() {
  useEffect(() => {
    // Mark app start
    AppStartupTracker.markMilestone('App component mounted');

    // Register screen preloads
    registerScreenPreloads();
    AppStartupTracker.markMilestone('Preload tasks registered');

    // Initialize performance monitoring
    const initializeServices = async () => {
      try {
        Logger.info('Initializing application services...');
        RealPerformanceTracker.mark('services-init-start');

        // Start real memory monitoring
        MemoryMonitor.startMonitoring();
        AppStartupTracker.markMilestone('Memory monitoring started');

        // Initialize performance service first
        await PerformanceService.getInstance().initialize();
        AppStartupTracker.markMilestone('Performance service initialized');

        // Initialize memory service
        MemoryService.getInstance().initialize();
        AppStartupTracker.markMilestone('Memory service initialized');

        // Initialize optimized styles with performance awareness
        OptimizedGlassmorphismStyles.initialize();
        AppStartupTracker.markMilestone('Optimized styles initialized');

        // Initialize image caching service
        await ImageService.initialize({
          maxCacheSize: 150, // 150MB cache
          maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
          compressionQuality: 0.8,
          thumbnailSize: { width: 200, height: 200 },
        });
        AppStartupTracker.markMilestone('Image service initialized');

        RealPerformanceTracker.mark('services-init-end');
        const initDuration = RealPerformanceTracker.measure(
          'ServicesInitialization',
          'services-init-start',
          'services-init-end'
        );

        Logger.info('All services initialized successfully', {
          duration: `${initDuration}ms`,
          totalStartupTime: `${AppStartupTracker.getTotalStartupTime()}ms`,
          milestones: AppStartupTracker.getMilestones(),
        });

        // Start strategic preloading after startup
        PreloadingStrategy.preloadAfterStartup();
        AppStartupTracker.markMilestone('Preloading started');
      } catch (error) {
        Logger.error('Failed to initialize services', error);
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      MemoryMonitor.stopMonitoring();
    };
  }, []);

  return (
    <ErrorBoundary
      fallbackTitle="App Error"
      fallbackMessage="The app encountered an unexpected error. Please restart the app."
    >
      <AppNavigator />
      <StatusBar style="light" />
    </ErrorBoundary>
  );
}
