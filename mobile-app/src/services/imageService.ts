// src/services/imageService.ts
import * as FileSystem from 'expo-file-system';
import { Image } from 'react-native';

export interface ImageCacheOptions {
  maxCacheSize: number; // in MB
  maxAge: number; // in milliseconds
  compressionQuality: number; // 0-1
  thumbnailSize: { width: number; height: number };
}

export interface CachedImage {
  uri: string;
  localPath: string;
  thumbnailPath?: string;
  size: number;
  lastAccessed: number;
  createdAt: number;
}

export class ImageService {
  private static readonly DEFAULT_OPTIONS: ImageCacheOptions = {
    maxCacheSize: 100, // 100MB
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    compressionQuality: 0.8,
    thumbnailSize: { width: 150, height: 150 },
  };

  private static readonly CACHE_DIR = `${FileSystem.cacheDirectory}images/`;
  private static readonly THUMBNAIL_DIR = `${FileSystem.cacheDirectory}thumbnails/`;
  private static readonly METADATA_FILE = `${FileSystem.cacheDirectory}image_cache_metadata.json`;
  
  private static cache = new Map<string, CachedImage>();
  private static initialized = false;
  private static options = ImageService.DEFAULT_OPTIONS;

  /**
   * Initialize the image cache system
   */
  static async initialize(options?: Partial<ImageCacheOptions>): Promise<void> {
    if (this.initialized) return;

    this.options = { ...this.DEFAULT_OPTIONS, ...options };

    // Create cache directories
    await this.ensureDirectoryExists(this.CACHE_DIR);
    await this.ensureDirectoryExists(this.THUMBNAIL_DIR);

    // Load existing cache metadata
    await this.loadCacheMetadata();

    // Clean up old/oversized cache
    await this.cleanupCache();

    this.initialized = true;
    console.log('ImageService initialized with cache size:', this.cache.size);
  }

  /**
   * Get optimized image URI with caching and thumbnail support
   */
  static async getOptimizedImage(
    originalUri: string,
    useThumbnail: boolean = false
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!originalUri) return '';

    const cacheKey = this.getCacheKey(originalUri);
    const cachedImage = this.cache.get(cacheKey);

    // Return cached version if available and valid
    if (cachedImage && await this.isCacheValid(cachedImage)) {
      // Update last accessed time
      cachedImage.lastAccessed = Date.now();
      await this.saveCacheMetadata();

      const imagePath = useThumbnail && cachedImage.thumbnailPath 
        ? cachedImage.thumbnailPath 
        : cachedImage.localPath;

      // Verify file still exists
      if (await FileSystem.getInfoAsync(imagePath).then(info => info.exists)) {
        return imagePath;
      } else {
        // File was deleted, remove from cache
        this.cache.delete(cacheKey);
      }
    }

    // Download and cache the image
    return await this.downloadAndCacheImage(originalUri, useThumbnail);
  }

  /**
   * Preload images for better performance
   */
  static async preloadImages(uris: string[]): Promise<void> {
    const preloadPromises = uris.map(uri => 
      this.getOptimizedImage(uri, true).catch(error => {
        console.warn('Failed to preload image:', uri, error);
        return null;
      })
    );

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Get image dimensions without loading the full image
   */
  static async getImageDimensions(uri: string): Promise<{ width: number; height: number } | null> {
    try {
      return await new Promise((resolve, reject) => {
        Image.getSize(
          uri,
          (width, height) => resolve({ width, height }),
          (error) => reject(error)
        );
      });
    } catch (error) {
      console.warn('Failed to get image dimensions:', error);
      return null;
    }
  }

  /**
   * Download and cache an image
   */
  private static async downloadAndCacheImage(
    originalUri: string,
    createThumbnail: boolean = false
  ): Promise<string> {
    try {
      const cacheKey = this.getCacheKey(originalUri);
      const fileName = `${cacheKey}.jpg`;
      const localPath = `${this.CACHE_DIR}${fileName}`;

      // Download the image
      const downloadResult = await FileSystem.downloadAsync(originalUri, localPath);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      const size = fileInfo.size || 0;

      // Create thumbnail if requested
      let thumbnailPath: string | undefined;
      if (createThumbnail) {
        thumbnailPath = await this.createThumbnail(localPath, cacheKey);
      }

      // Add to cache
      const cachedImage: CachedImage = {
        uri: originalUri,
        localPath,
        thumbnailPath,
        size,
        lastAccessed: Date.now(),
        createdAt: Date.now(),
      };

      this.cache.set(cacheKey, cachedImage);
      await this.saveCacheMetadata();

      console.log(`Cached image: ${originalUri} -> ${localPath}`);
      return createThumbnail && thumbnailPath ? thumbnailPath : localPath;

    } catch (error) {
      console.error('Failed to download and cache image:', error);
      return originalUri; // Fallback to original URI
    }
  }

  /**
   * Create a thumbnail version of an image
   */
  private static async createThumbnail(
    sourcePath: string,
    cacheKey: string
  ): Promise<string | undefined> {
    try {
      // For React Native, we'd typically use a library like react-native-image-resizer
      // For now, we'll copy the original (in a real implementation, you'd resize it)
      const thumbnailFileName = `thumb_${cacheKey}.jpg`;
      const thumbnailPath = `${this.THUMBNAIL_DIR}${thumbnailFileName}`;
      
      // Copy file as placeholder (would be actual resizing in production)
      await FileSystem.copyAsync({
        from: sourcePath,
        to: thumbnailPath,
      });

      return thumbnailPath;
    } catch (error) {
      console.warn('Failed to create thumbnail:', error);
      return undefined;
    }
  }

  /**
   * Clean up old and oversized cache
   */
  private static async cleanupCache(): Promise<void> {
    const now = Date.now();
    const maxAgeMs = this.options.maxAge;
    const maxSizeBytes = this.options.maxCacheSize * 1024 * 1024;

    let totalSize = 0;
    const imagesToDelete: string[] = [];
    const imagesByAge: Array<{ key: string; age: number; size: number }> = [];

    // Calculate total size and identify old images
    for (const [key, image] of this.cache.entries()) {
      const age = now - image.createdAt;
      
      // Mark old images for deletion
      if (age > maxAgeMs) {
        imagesToDelete.push(key);
        continue;
      }

      totalSize += image.size;
      imagesByAge.push({ key, age, size: image.size });
    }

    // Delete old images
    for (const key of imagesToDelete) {
      await this.deleteCachedImage(key);
    }

    // If still over size limit, delete oldest images
    if (totalSize > maxSizeBytes) {
      imagesByAge.sort((a, b) => b.age - a.age); // Sort by age (oldest first)
      
      for (const { key, size } of imagesByAge) {
        if (totalSize <= maxSizeBytes) break;
        
        await this.deleteCachedImage(key);
        totalSize -= size;
      }
    }

    console.log(`Cache cleanup completed. Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
  }

  /**
   * Delete a cached image and its thumbnail
   */
  private static async deleteCachedImage(cacheKey: string): Promise<void> {
    const cachedImage = this.cache.get(cacheKey);
    if (!cachedImage) return;

    try {
      // Delete main image
      if (await FileSystem.getInfoAsync(cachedImage.localPath).then(info => info.exists)) {
        await FileSystem.deleteAsync(cachedImage.localPath);
      }

      // Delete thumbnail
      if (cachedImage.thumbnailPath && 
          await FileSystem.getInfoAsync(cachedImage.thumbnailPath).then(info => info.exists)) {
        await FileSystem.deleteAsync(cachedImage.thumbnailPath);
      }

      this.cache.delete(cacheKey);
      console.log(`Deleted cached image: ${cacheKey}`);
    } catch (error) {
      console.warn(`Failed to delete cached image ${cacheKey}:`, error);
    }
  }

  /**
   * Check if cached image is still valid
   */
  private static async isCacheValid(cachedImage: CachedImage): Promise<boolean> {
    const now = Date.now();
    const age = now - cachedImage.createdAt;
    
    // Check age
    if (age > this.options.maxAge) {
      return false;
    }

    // Check if file exists
    const fileExists = await FileSystem.getInfoAsync(cachedImage.localPath)
      .then(info => info.exists)
      .catch(() => false);

    return fileExists;
  }

  /**
   * Generate cache key from URI
   */
  private static getCacheKey(uri: string): string {
    return uri.split('/').pop()?.split('?')[0] || 
           uri.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  }

  /**
   * Ensure directory exists
   */
  private static async ensureDirectoryExists(dir: string): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  }

  /**
   * Load cache metadata from disk
   */
  private static async loadCacheMetadata(): Promise<void> {
    try {
      const metadataExists = await FileSystem.getInfoAsync(this.METADATA_FILE)
        .then(info => info.exists);

      if (metadataExists) {
        const metadataJson = await FileSystem.readAsStringAsync(this.METADATA_FILE);
        const metadata = JSON.parse(metadataJson);
        
        this.cache = new Map(Object.entries(metadata));
        console.log(`Loaded ${this.cache.size} cached images from metadata`);
      }
    } catch (error) {
      console.warn('Failed to load cache metadata:', error);
      this.cache = new Map();
    }
  }

  /**
   * Save cache metadata to disk
   */
  private static async saveCacheMetadata(): Promise<void> {
    try {
      const metadata = Object.fromEntries(this.cache);
      await FileSystem.writeAsStringAsync(
        this.METADATA_FILE,
        JSON.stringify(metadata, null, 2)
      );
    } catch (error) {
      console.warn('Failed to save cache metadata:', error);
    }
  }

  /**
   * Clear all cached images
   */
  static async clearCache(): Promise<void> {
    try {
      // Delete cache directories
      await FileSystem.deleteAsync(this.CACHE_DIR, { idempotent: true });
      await FileSystem.deleteAsync(this.THUMBNAIL_DIR, { idempotent: true });
      await FileSystem.deleteAsync(this.METADATA_FILE, { idempotent: true });

      // Clear in-memory cache
      this.cache.clear();

      // Recreate directories
      await this.ensureDirectoryExists(this.CACHE_DIR);
      await this.ensureDirectoryExists(this.THUMBNAIL_DIR);

      console.log('Image cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    totalImages: number;
    totalSizeMB: number;
    oldestImageAge: number;
    newestImageAge: number;
  } {
    const now = Date.now();
    let totalSize = 0;
    let oldestAge = 0;
    let newestAge = Infinity;

    for (const image of this.cache.values()) {
      totalSize += image.size;
      const age = now - image.createdAt;
      oldestAge = Math.max(oldestAge, age);
      newestAge = Math.min(newestAge, age);
    }

    return {
      totalImages: this.cache.size,
      totalSizeMB: totalSize / 1024 / 1024,
      oldestImageAge: oldestAge,
      newestImageAge: newestAge === Infinity ? 0 : newestAge,
    };
  }
}