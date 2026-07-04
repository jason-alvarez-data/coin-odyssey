// src/services/__tests__/errorService.test.ts
import { ErrorService, ErrorType } from '../errorService';
import { Alert } from 'react-native';

// Mock Alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('ErrorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserFriendlyError', () => {
    it('should handle network errors', () => {
      const error = new Error('network request failed');
      const result = ErrorService.getUserFriendlyError(error);

      expect(result.title).toBe('Connection Problem');
      expect(result.message).toContain('internet connection');
      expect(result.action).toBe('Retry');
    });

    it('should handle authentication errors', () => {
      const error = new Error('JWT expired');
      const result = ErrorService.getUserFriendlyError(error);

      expect(result.title).toBe('Session Expired');
      expect(result.message).toContain('sign in again');
      expect(result.action).toBe('Sign In');
    });

    it('should handle permission errors', () => {
      const error = new Error('permission denied');
      const result = ErrorService.getUserFriendlyError(error);

      expect(result.title).toBe('Permission Required');
      expect(result.message).toContain('permissions');
      expect(result.action).toBe('Settings');
    });

    it('should handle not found errors', () => {
      const error = { message: 'not found', status: 404 };
      const result = ErrorService.getUserFriendlyError(error);

      expect(result.title).toBe('Not Found');
      expect(result.message).toContain('could not be found');
    });

    it('should handle storage errors', () => {
      const error = new Error('quota exceeded');
      const result = ErrorService.getUserFriendlyError(error);

      expect(result.title).toBe('Storage Full');
      expect(result.message).toContain('storage is full');
    });

    it('should handle validation errors', () => {
      const error = new Error('validation failed');
      const result = ErrorService.getUserFriendlyError(error);

      // The service passes the original message through when present and
      // only falls back to generic copy when the error has no message.
      expect(result.title).toBe('Invalid Input');
      expect(result.message).toBe('validation failed');
    });

    it('should handle unknown errors with context', () => {
      const error = new Error('Something went wrong');
      const result = ErrorService.getUserFriendlyError(error, 'saving your coin');

      expect(result.title).toBe('Unexpected Error');
      expect(result.message).toContain('saving your coin');
    });

    it('should include technical details', () => {
      const error = new Error('Technical error message');
      const result = ErrorService.getUserFriendlyError(error);

      expect(result.technical).toBe('Technical error message');
    });
  });

  describe('getErrorType', () => {
    it('should identify network errors', () => {
      const error = new Error('network error');
      expect(ErrorService.getErrorType(error)).toBe(ErrorType.NETWORK);
    });

    it('should identify auth errors', () => {
      const error = new Error('unauthorized access');
      expect(ErrorService.getErrorType(error)).toBe(ErrorType.AUTH);
    });

    it('should identify validation errors', () => {
      const error = new Error('invalid input data');
      expect(ErrorService.getErrorType(error)).toBe(ErrorType.VALIDATION);
    });

    it('should identify not found errors', () => {
      const error = { message: 'not found', status: 404 };
      expect(ErrorService.getErrorType(error)).toBe(ErrorType.NOT_FOUND);
    });

    it('should identify permission errors', () => {
      const error = new Error('permission denied');
      expect(ErrorService.getErrorType(error)).toBe(ErrorType.PERMISSION);
    });

    it('should identify storage errors', () => {
      const error = new Error('storage quota exceeded');
      expect(ErrorService.getErrorType(error)).toBe(ErrorType.STORAGE);
    });

    it('should return UNKNOWN for unrecognized errors', () => {
      const error = new Error('Some random error');
      expect(ErrorService.getErrorType(error)).toBe(ErrorType.UNKNOWN);
    });
  });

  describe('isRecoverable', () => {
    it('should mark network errors as recoverable', () => {
      const error = new Error('network error');
      expect(ErrorService.isRecoverable(error)).toBe(true);
    });

    it('should mark validation errors as recoverable', () => {
      const error = new Error('validation failed');
      expect(ErrorService.isRecoverable(error)).toBe(true);
    });

    it('should mark storage errors as recoverable', () => {
      const error = new Error('storage full');
      expect(ErrorService.isRecoverable(error)).toBe(true);
    });

    it('should mark auth errors as not recoverable', () => {
      const error = new Error('unauthorized');
      expect(ErrorService.isRecoverable(error)).toBe(false);
    });
  });

  describe('getSuggestedAction', () => {
    it('should suggest checking connection for network errors', () => {
      const error = new Error('network error');
      const suggestion = ErrorService.getSuggestedAction(error);
      expect(suggestion).toContain('internet connection');
    });

    it('should suggest signing in for auth errors', () => {
      const error = new Error('unauthorized');
      const suggestion = ErrorService.getSuggestedAction(error);
      expect(suggestion).toContain('sign in');
    });

    it('should suggest checking input for validation errors', () => {
      const error = new Error('validation failed');
      const suggestion = ErrorService.getSuggestedAction(error);
      expect(suggestion).toContain('check your input');
    });
  });

  describe('showError', () => {
    it('should display an alert with user-friendly message', () => {
      const error = new Error('network error');
      ErrorService.showError(error, 'loading data');

      expect(Alert.alert).toHaveBeenCalledWith(
        'Connection Problem',
        expect.stringContaining('internet connection'),
        expect.any(Array),
        expect.any(Object)
      );
    });
  });

  describe('showSuccess', () => {
    it('should display a success alert', () => {
      ErrorService.showSuccess('Success', 'Operation completed');

      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Operation completed',
        expect.any(Array),
        expect.any(Object)
      );
    });
  });

  describe('showConfirmation', () => {
    it('should display a confirmation dialog', () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      ErrorService.showConfirmation(
        'Confirm Action',
        'Are you sure?',
        onConfirm,
        onCancel
      );

      expect(Alert.alert).toHaveBeenCalledWith(
        'Confirm Action',
        'Are you sure?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel' }),
          expect.objectContaining({ text: 'Confirm' }),
        ]),
        expect.any(Object)
      );
    });
  });

  describe('formatValidationError', () => {
    it('should format field names properly', () => {
      const formatted = ErrorService.formatValidationError(
        'emailAddress',
        'is required'
      );
      expect(formatted).toBe('Email Address: is required');
    });

    it('should handle camelCase field names', () => {
      const formatted = ErrorService.formatValidationError(
        'firstName',
        'must be at least 2 characters'
      );
      expect(formatted).toBe('First Name: must be at least 2 characters');
    });
  });
});
