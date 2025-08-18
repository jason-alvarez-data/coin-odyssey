import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { ImageService } from './src/services/imageService';
import { PerformanceService } from './src/services/performanceService';
import { MemoryService } from './src/services/memoryService';
import { OptimizedGlassmorphismStyles } from './src/styles/optimizedEffects';

export default function App() {
  useEffect(() => {
    // Initialize performance monitoring
    const initializeServices = async () => {
      try {
        // Initialize performance service first
        await PerformanceService.getInstance().initialize();
        
        // Initialize memory service
        MemoryService.getInstance().initialize();
        
        // Initialize optimized styles with performance awareness
        OptimizedGlassmorphismStyles.initialize();
        
        // Initialize image caching service
        await ImageService.initialize({
          maxCacheSize: 150, // 150MB cache
          maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
          compressionQuality: 0.8,
          thumbnailSize: { width: 200, height: 200 },
        });
        
        console.log('All services initialized successfully');
      } catch (error) {
        console.warn('Failed to initialize services:', error);
      }
    };

    initializeServices();
  }, []);

  return (
    <>
      <AppNavigator />
      <StatusBar style="light" />
    </>
  );
}
