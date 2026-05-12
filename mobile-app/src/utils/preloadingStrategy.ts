// src/utils/preloadingStrategy.ts
import { Logger } from '../services/logger';

/**
 * PreloadingStrategy manages screen-level preloading tasks
 * that run after app startup to warm caches and prepare data.
 */
export class PreloadingStrategy {
  private static tasks: Array<{ name: string; task: () => Promise<void> }> = [];
  private static hasRunStartup = false;

  static register(name: string, task: () => Promise<void>) {
    this.tasks.push({ name, task });
  }

  static async preloadAfterStartup() {
    if (this.hasRunStartup) return;
    this.hasRunStartup = true;

    for (const { name, task } of this.tasks) {
      try {
        await task();
        Logger.debug(`Preload task completed: ${name}`);
      } catch (error) {
        Logger.warn(`Preload task failed: ${name}`, error);
      }
    }
  }
}

/**
 * Register screen preload tasks.
 * Called during app initialization to queue tasks that should
 * run shortly after startup (e.g., warming caches, prefetching data).
 */
export function registerScreenPreloads() {
  // Placeholder — individual screens can register their own preload tasks
  // via PreloadingStrategy.register() as needed.
  Logger.debug('Screen preloads registered');
}
