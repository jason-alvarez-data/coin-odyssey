// src/services/logger.ts
/**
 * Centralized logging service for the application
 * Provides different log levels and can be configured for different environments
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableTimestamps: boolean;
  enableColors: boolean;
  prefix?: string;
}

class LoggerService {
  private static instance: LoggerService;
  private config: LoggerConfig;
  private logHistory: Array<{
    level: LogLevel;
    message: string;
    data?: any;
    timestamp: Date;
  }> = [];
  private maxHistorySize = 100;

  private constructor() {
    // Set logging level based on environment
    const isDevelopment = process.env.EXPO_PUBLIC_ENVIRONMENT !== 'production';

    this.config = {
      minLevel: isDevelopment ? LogLevel.DEBUG : LogLevel.WARN,
      enableTimestamps: true,
      enableColors: isDevelopment,
      prefix: '[CoinOdyssey]',
    };
  }

  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  /**
   * Configure the logger
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get the current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Log a debug message (development only)
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log an info message
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: any): void {
    this.log(LogLevel.ERROR, message, error);
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, data?: any): void {
    // Check if this log level should be shown
    if (level < this.config.minLevel) {
      return;
    }

    // Build the log message
    const timestamp = new Date();
    const timeStr = this.config.enableTimestamps
      ? `[${timestamp.toLocaleTimeString()}]`
      : '';

    const prefix = this.config.prefix || '';
    const levelStr = this.getLevelString(level);
    const fullMessage = `${timeStr} ${prefix} ${levelStr} ${message}`;

    // Store in history
    this.addToHistory(level, message, data, timestamp);

    // Output to console with appropriate method
    switch (level) {
      case LogLevel.DEBUG:
        console.log(fullMessage, data !== undefined ? data : '');
        break;
      case LogLevel.INFO:
        console.info(fullMessage, data !== undefined ? data : '');
        break;
      case LogLevel.WARN:
        console.warn(fullMessage, data !== undefined ? data : '');
        break;
      case LogLevel.ERROR:
        console.error(fullMessage, data !== undefined ? data : '');
        if (data instanceof Error) {
          console.error('Stack trace:', data.stack);
        }
        break;
    }
  }

  /**
   * Get string representation of log level
   */
  private getLevelString(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '🔍 [DEBUG]';
      case LogLevel.INFO:
        return 'ℹ️  [INFO]';
      case LogLevel.WARN:
        return '⚠️  [WARN]';
      case LogLevel.ERROR:
        return '❌ [ERROR]';
      default:
        return '[LOG]';
    }
  }

  /**
   * Add log to history
   */
  private addToHistory(level: LogLevel, message: string, data: any, timestamp: Date): void {
    this.logHistory.push({ level, message, data, timestamp });

    // Keep history size in check
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  /**
   * Get recent log history (useful for debugging)
   */
  getHistory(count?: number): Array<{
    level: LogLevel;
    message: string;
    data?: any;
    timestamp: Date;
  }> {
    if (count) {
      return this.logHistory.slice(-count);
    }
    return [...this.logHistory];
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * Export logs as JSON (useful for support/debugging)
   */
  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }

  /**
   * Performance logging - measure execution time
   */
  startTimer(label: string): () => void {
    const startTime = Date.now();
    this.debug(`Timer started: ${label}`);

    return () => {
      const duration = Date.now() - startTime;
      this.debug(`Timer completed: ${label}`, { duration: `${duration}ms` });
    };
  }

  /**
   * Log API calls
   */
  logApiCall(method: string, endpoint: string, status?: number, duration?: number): void {
    const message = `API ${method} ${endpoint}`;
    const data = {
      method,
      endpoint,
      status,
      duration: duration ? `${duration}ms` : undefined,
    };

    if (status && status >= 400) {
      this.error(message, data);
    } else {
      this.debug(message, data);
    }
  }

  /**
   * Log navigation events
   */
  logNavigation(screen: string, params?: any): void {
    this.debug(`Navigation: ${screen}`, params);
  }

  /**
   * Log user actions (analytics-style)
   */
  logUserAction(action: string, details?: any): void {
    this.info(`User action: ${action}`, details);
  }
}

// Export singleton instance
export const Logger = LoggerService.getInstance();

// Export convenience methods
export const logDebug = (message: string, data?: any) => Logger.debug(message, data);
export const logInfo = (message: string, data?: any) => Logger.info(message, data);
export const logWarn = (message: string, data?: any) => Logger.warn(message, data);
export const logError = (message: string, error?: any) => Logger.error(message, error);
