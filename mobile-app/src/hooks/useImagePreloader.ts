// src/hooks/useImagePreloader.ts
import { useEffect, useRef, useState } from 'react';
import { ImageService } from '../services/imageService';

interface PreloadOptions {
  enabled?: boolean;
  priority?: 'high' | 'normal' | 'low';
  batchSize?: number;
  delay?: number;
}

interface PreloadState {
  preloaded: number;
  total: number;
  isPreloading: boolean;
  progress: number;
}

export const useImagePreloader = (
  imageUris: string[],
  options: PreloadOptions = {}
) => {
  const {
    enabled = true,
    priority = 'normal',
    batchSize = 5,
    delay = 100
  } = options;

  const [state, setState] = useState<PreloadState>({
    preloaded: 0,
    total: imageUris.length,
    isPreloading: false,
    progress: 0,
  });

  const preloadedUris = useRef(new Set<string>());
  const isPreloadingRef = useRef(false);

  useEffect(() => {
    setState(prev => ({
      ...prev,
      total: imageUris.length,
      progress: imageUris.length > 0 ? prev.preloaded / imageUris.length : 1,
    }));
  }, [imageUris.length]);

  useEffect(() => {
    if (!enabled || imageUris.length === 0 || isPreloadingRef.current) {
      return;
    }

    const newUris = imageUris.filter(uri => uri && !preloadedUris.current.has(uri));
    
    if (newUris.length === 0) {
      setState(prev => ({ ...prev, isPreloading: false, progress: 1 }));
      return;
    }

    preloadImages(newUris);
  }, [imageUris, enabled, batchSize, delay]);

  const preloadImages = async (uris: string[]) => {
    if (isPreloadingRef.current) return;

    isPreloadingRef.current = true;
    setState(prev => ({ ...prev, isPreloading: true }));

    try {
      // Process images in batches to avoid overwhelming the system
      for (let i = 0; i < uris.length; i += batchSize) {
        const batch = uris.slice(i, i + batchSize);
        
        // Preload batch with different priorities
        const preloadPromises = batch.map(async (uri, index) => {
          try {
            // Add delay for lower priority images
            if (priority === 'low') {
              await new Promise(resolve => setTimeout(resolve, delay * index));
            }

            await ImageService.getOptimizedImage(uri, true);
            preloadedUris.current.add(uri);
            
            setState(prev => ({
              ...prev,
              preloaded: prev.preloaded + 1,
              progress: (prev.preloaded + 1) / prev.total,
            }));
          } catch (error) {
            console.warn(`Failed to preload image: ${uri}`, error);
          }
        });

        await Promise.allSettled(preloadPromises);

        // Add delay between batches for low priority
        if (priority === 'low' && i + batchSize < uris.length) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } finally {
      isPreloadingRef.current = false;
      setState(prev => ({ ...prev, isPreloading: false }));
    }
  };

  const preloadSpecific = async (uris: string[]) => {
    try {
      await ImageService.preloadImages(uris);
      uris.forEach(uri => preloadedUris.current.add(uri));
      setState(prev => ({
        ...prev,
        preloaded: Math.min(prev.preloaded + uris.length, prev.total),
        progress: Math.min((prev.preloaded + uris.length) / prev.total, 1),
      }));
    } catch (error) {
      console.warn('Failed to preload specific images:', error);
    }
  };

  const reset = () => {
    preloadedUris.current.clear();
    setState({
      preloaded: 0,
      total: imageUris.length,
      isPreloading: false,
      progress: 0,
    });
  };

  return {
    ...state,
    preloadSpecific,
    reset,
  };
};

// Hook for preloading visible collection items
export const useCollectionImagePreloader = (
  coins: Array<{ obverseImage?: string | null; reverseImage?: string | null }>,
  enabled: boolean = true
) => {
  const imageUris = coins
    .flatMap(coin => [coin.obverseImage, coin.reverseImage])
    .filter((uri): uri is string => Boolean(uri));

  return useImagePreloader(imageUris, {
    enabled,
    priority: 'normal',
    batchSize: 3,
    delay: 50,
  });
};

// Hook for preloading viewport images (for FlatList optimization)
export const useViewportImagePreloader = (
  visibleItems: string[],
  upcomingItems: string[],
  enabled: boolean = true
) => {
  const visiblePreloader = useImagePreloader(visibleItems, {
    enabled,
    priority: 'high',
    batchSize: 10,
    delay: 0,
  });

  const upcomingPreloader = useImagePreloader(upcomingItems, {
    enabled: enabled && !visiblePreloader.isPreloading,
    priority: 'low',
    batchSize: 5,
    delay: 200,
  });

  return {
    visible: visiblePreloader,
    upcoming: upcomingPreloader,
    totalProgress: (visiblePreloader.progress + upcomingPreloader.progress) / 2,
  };
};