// src/utils/preloadingStrategy.ts
/**
 * Strategic preloading utility for lazy-loaded screens
 * Intelligently preloads screens based on user behavior and priority
 */

import { InteractionManager } from 'react-native';
import { Logger } from '../services/logger';

interface PreloadTask {
  name: string;
  priority: 'high' | 'medium' | 'low';
  loader: () => Promise<any>;
  loaded: boolean;
}

/**
 * Manages preloading of lazy-loaded components
 * Prioritizes based on likelihood of user navigation
 *
 * @example
 * // Preload high-priority screens after app startup
 * PreloadingStrategy.preloadAfterStartup();
 *
 * // Preload specific screen
 * PreloadingStrategy.preload('AddCoinScreen', 'high');
 */
export class PreloadingStrategy {
  private static tasks: Map<string, PreloadTask> = new Map();
  private static isPreloading = false;

  /**
   * Register a preload task
   * @param name - Unique identifier for the task
   * @param loader - Function that returns the import promise
   * @param priority - Priority level ('high' | 'medium' | 'low')
   */
  static register(
    name: string,
    loader: () => Promise<any>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): void {
    if (!this.tasks.has(name)) {
      this.tasks.set(name, {
        name,
        priority,
        loader,
        loaded: false,
      });
    }
  }

  /**
   * Preload a specific task by name
   */
  static async preload(name: string): Promise<void> {
    const task = this.tasks.get(name);

    if (!task) {
      Logger.warn(`Preload task not found: ${name}`);
      return;
    }

    if (task.loaded) {
      Logger.debug(`Already loaded: ${name}`);
      return;
    }

    try {
      Logger.debug(`Preloading: ${name}`);
      await task.loader();
      task.loaded = true;
      Logger.info(`Preloaded successfully: ${name}`);
    } catch (error) {
      Logger.error(`Failed to preload ${name}`, error);
    }
  }

  /**
   * Preload all registered tasks in priority order
   */
  static async preloadAll(): Promise<void> {
    if (this.isPreloading) {
      Logger.warn('Preloading already in progress');
      return;
    }

    this.isPreloading = true;
    Logger.info('Starting preload of all tasks');

    // Sort tasks by priority
    const sortedTasks = Array.from(this.tasks.values()).sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Preload each task
    for (const task of sortedTasks) {
      if (!task.loaded) {
        await this.preload(task.name);

        // Small delay between preloads to avoid blocking UI
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    this.isPreloading = false;
    Logger.info('Completed preloading all tasks');
  }

  /**
   * Preload only high-priority tasks
   */
  static async preloadHighPriority(): Promise<void> {
    const highPriorityTasks = Array.from(this.tasks.values()).filter(
      (task) => task.priority === 'high' && !task.loaded
    );

    Logger.info(`Preloading ${highPriorityTasks.length} high-priority tasks`);

    for (const task of highPriorityTasks) {
      await this.preload(task.name);
    }
  }

  /**
   * Preload tasks after app startup completes
   * Uses InteractionManager to avoid blocking startup
   */
  static preloadAfterStartup(): void {
    InteractionManager.runAfterInteractions(() => {
      Logger.info('App startup complete, beginning strategic preloading');

      // Wait a bit longer to ensure UI is stable
      setTimeout(() => {
        // First, preload high-priority screens
        this.preloadHighPriority().then(() => {
          // Then preload medium priority after a delay
          setTimeout(() => {
            const mediumPriorityTasks = Array.from(this.tasks.values()).filter(
              (task) => task.priority === 'medium' && !task.loaded
            );

            mediumPriorityTasks.forEach((task) => {
              this.preload(task.name);
            });
          }, 2000); // Wait 2 seconds before medium priority

          // Finally, low priority screens
          setTimeout(() => {
            const lowPriorityTasks = Array.from(this.tasks.values()).filter(
              (task) => task.priority === 'low' && !task.loaded
            );

            lowPriorityTasks.forEach((task) => {
              this.preload(task.name);
            });
          }, 5000); // Wait 5 seconds before low priority
        });
      }, 1000); // Wait 1 second after startup
    });
  }

  /**
   * Preload screens likely to be visited next
   * @param currentScreen - The screen the user is currently on
   */
  static preloadNextLikely(currentScreen: string): void {
    const navigationPaths: Record<string, string[]> = {
      Dashboard: ['AddCoin', 'Collection', 'Analytics'],
      Collection: ['CoinDetail', 'AddCoin', 'EditCoin'],
      AddCoin: ['Collection', 'Camera'],
      CoinDetail: ['EditCoin', 'Collection'],
      Analytics: ['Dashboard', 'Collection'],
      Profile: ['Dashboard'],
      SignIn: ['SignUp', 'ForgotPassword', 'Dashboard'],
      SignUp: ['SignIn', 'Dashboard'],
    };

    const nextScreens = navigationPaths[currentScreen] || [];

    Logger.debug(`Preloading likely next screens from ${currentScreen}`, { nextScreens });

    nextScreens.forEach((screenName) => {
      this.preload(screenName);
    });
  }

  /**
   * Get preloading statistics
   */
  static getStats(): {
    total: number;
    loaded: number;
    pending: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
  } {
    const tasks = Array.from(this.tasks.values());

    return {
      total: tasks.length,
      loaded: tasks.filter((t) => t.loaded).length,
      pending: tasks.filter((t) => !t.loaded).length,
      highPriority: tasks.filter((t) => t.priority === 'high').length,
      mediumPriority: tasks.filter((t) => t.priority === 'medium').length,
      lowPriority: tasks.filter((t) => t.priority === 'low').length,
    };
  }

  /**
   * Reset all preload tasks
   */
  static reset(): void {
    this.tasks.clear();
    this.isPreloading = false;
  }
}

/**
 * Register common screen preload tasks
 * Call this once during app initialization
 */
export function registerScreenPreloads(): void {
  // High priority - User likely to visit soon after startup
  PreloadingStrategy.register(
    'AddCoin',
    () => import('../screens/collection/AddCoinScreen'),
    'high'
  );

  PreloadingStrategy.register(
    'Collection',
    () => import('../screens/collection/CollectionListScreen'),
    'high'
  );

  // Medium priority - Common navigation targets
  PreloadingStrategy.register(
    'CoinDetail',
    () => import('../screens/collection/CoinDetailScreen'),
    'medium'
  );

  PreloadingStrategy.register(
    'Analytics',
    () => import('../screens/analytics/AnalyticsScreen'),
    'medium'
  );

  PreloadingStrategy.register(
    'Profile',
    () => import('../screens/profile/ProfileScreen'),
    'medium'
  );

  // Low priority - Less frequently used
  PreloadingStrategy.register(
    'EditCoin',
    () => import('../screens/collection/EditCoinScreen'),
    'low'
  );

  PreloadingStrategy.register(
    'Camera',
    () => import('../screens/camera/CameraScreen'),
    'low'
  );

  PreloadingStrategy.register(
    'Map',
    () => import('../screens/MapScreen'),
    'low'
  );

  PreloadingStrategy.register(
    'ForgotPassword',
    () => import('../screens/auth/ForgotPasswordScreen'),
    'low'
  );

  Logger.info('Screen preload tasks registered', PreloadingStrategy.getStats());
}
