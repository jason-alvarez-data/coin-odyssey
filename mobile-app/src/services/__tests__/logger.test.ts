// src/services/__tests__/logger.test.ts
import { Logger, LogLevel } from '../logger';

describe('Logger Service', () => {
  beforeEach(() => {
    // Reset console mocks
    jest.clearAllMocks();
    // Clear logger history
    Logger.clearHistory();
  });

  describe('Log Levels', () => {
    it('should log debug messages in development', () => {
      Logger.configure({ minLevel: LogLevel.DEBUG });
      Logger.debug('Test debug message', { test: 'data' });
      expect(console.log).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      Logger.info('Test info message');
      expect(console.info).toHaveBeenCalled();
    });

    it('should log warnings', () => {
      Logger.warn('Test warning');
      expect(console.warn).toHaveBeenCalled();
    });

    it('should log errors', () => {
      Logger.error('Test error', new Error('Test'));
      expect(console.error).toHaveBeenCalled();
    });

    it('should not log messages below minimum level', () => {
      Logger.configure({ minLevel: LogLevel.ERROR });
      Logger.debug('Should not appear');
      Logger.info('Should not appear');
      Logger.warn('Should not appear');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();

      Logger.error('Should appear');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Log History', () => {
    it('should store logs in history', () => {
      Logger.info('Test message 1');
      Logger.warn('Test message 2');

      const history = Logger.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].message).toBe('Test message 1');
      expect(history[1].message).toBe('Test message 2');
    });

    it('should limit history size', () => {
      // Add more than max history size (100)
      for (let i = 0; i < 150; i++) {
        Logger.info(`Message ${i}`);
      }

      const history = Logger.getHistory();
      expect(history.length).toBeLessThanOrEqual(100);
    });

    it('should clear history', () => {
      Logger.info('Test message');
      expect(Logger.getHistory()).toHaveLength(1);

      Logger.clearHistory();
      expect(Logger.getHistory()).toHaveLength(0);
    });

    it('should get recent history with count', () => {
      for (let i = 0; i < 10; i++) {
        Logger.info(`Message ${i}`);
      }

      const recent = Logger.getHistory(5);
      expect(recent).toHaveLength(5);
    });
  });

  describe('Performance Timers', () => {
    it('should measure execution time', () => {
      const endTimer = Logger.startTimer('Test operation');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Timer started: Test operation'),
        expect.anything()
      );

      endTimer();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Timer completed: Test operation'),
        expect.objectContaining({ duration: expect.stringContaining('ms') })
      );
    });
  });

  describe('Specialized Logging', () => {
    it('should log API calls', () => {
      Logger.logApiCall('GET', '/api/coins', 200, 150);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('API GET /api/coins'),
        expect.objectContaining({
          method: 'GET',
          endpoint: '/api/coins',
          status: 200,
          duration: '150ms',
        })
      );
    });

    it('should log failed API calls as errors', () => {
      Logger.logApiCall('POST', '/api/coins', 500);

      expect(console.error).toHaveBeenCalled();
    });

    it('should log navigation events', () => {
      Logger.logNavigation('DashboardScreen', { userId: '123' });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Navigation: DashboardScreen'),
        { userId: '123' }
      );
    });

    it('should log user actions', () => {
      Logger.logUserAction('coin_added', { coinId: '456' });

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('User action: coin_added'),
        { coinId: '456' }
      );
    });
  });

  describe('Configuration', () => {
    it('should get current configuration', () => {
      Logger.configure({
        minLevel: LogLevel.WARN,
        enableTimestamps: false,
      });

      const config = Logger.getConfig();
      expect(config.minLevel).toBe(LogLevel.WARN);
      expect(config.enableTimestamps).toBe(false);
    });
  });

  describe('Export Logs', () => {
    it('should export logs as JSON', () => {
      Logger.info('Test message 1');
      Logger.warn('Test message 2');

      const exported = Logger.exportLogs();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
    });
  });
});
