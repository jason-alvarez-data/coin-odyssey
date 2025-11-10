// src/services/errorService.ts
/**
 * Centralized error handling service
 * Converts technical errors into user-friendly messages
 */

import { Alert } from 'react-native';
import { Logger } from './logger';

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: string;
  technical?: string;
}

/**
 * Common error types that can occur in the app
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION = 'PERMISSION',
  STORAGE = 'STORAGE',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Error Service for handling and displaying errors consistently
 */
export class ErrorService {
  /**
   * Convert an error into a user-friendly format
   */
  static getUserFriendlyError(error: any, context?: string): UserFriendlyError {
    // Handle Supabase errors
    if (error?.message?.includes('JWT') || error?.message?.includes('token')) {
      return {
        title: 'Session Expired',
        message: 'Your session has expired. Please sign in again.',
        action: 'Sign In',
        technical: error.message,
      };
    }

    if (error?.message?.includes('network') || error?.code === 'NETWORK_ERROR') {
      return {
        title: 'Connection Problem',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        action: 'Retry',
        technical: error.message,
      };
    }

    if (error?.message?.includes('permission') || error?.code === 'PERMISSION_DENIED') {
      return {
        title: 'Permission Required',
        message: 'This action requires additional permissions. Please grant the necessary permissions in your device settings.',
        action: 'Settings',
        technical: error.message,
      };
    }

    if (error?.message?.includes('not found') || error?.status === 404) {
      return {
        title: 'Not Found',
        message: 'The requested item could not be found. It may have been deleted or moved.',
        action: 'Go Back',
        technical: error.message,
      };
    }

    // Handle storage/quota errors
    if (error?.message?.includes('quota') || error?.message?.includes('storage')) {
      return {
        title: 'Storage Full',
        message: 'Your device storage is full. Please free up some space and try again.',
        action: 'OK',
        technical: error.message,
      };
    }

    // Handle image/media errors
    if (error?.message?.includes('image') || error?.message?.includes('media')) {
      return {
        title: 'Image Error',
        message: 'There was a problem processing the image. Please try with a different image.',
        action: 'Try Again',
        technical: error.message,
      };
    }

    // Handle validation errors
    if (error?.message?.includes('validation') || error?.message?.includes('invalid')) {
      return {
        title: 'Invalid Input',
        message: error.message || 'Please check your input and try again.',
        action: 'OK',
        technical: error.message,
      };
    }

    // Handle authentication errors
    if (error?.message?.includes('auth') || error?.message?.includes('unauthorized')) {
      return {
        title: 'Authentication Error',
        message: 'Unable to verify your identity. Please sign in again.',
        action: 'Sign In',
        technical: error.message,
      };
    }

    // Handle database errors
    if (error?.message?.includes('database') || error?.code?.includes('PGRST')) {
      return {
        title: 'Database Error',
        message: 'There was a problem saving your data. Please try again.',
        action: 'Retry',
        technical: error.message,
      };
    }

    // Default unknown error
    return {
      title: 'Unexpected Error',
      message: context
        ? `An error occurred while ${context}. Please try again.`
        : 'An unexpected error occurred. Please try again.',
      action: 'OK',
      technical: error?.message || String(error),
    };
  }

  /**
   * Show an alert with user-friendly error message
   */
  static showError(error: any, context?: string): void {
    const friendlyError = this.getUserFriendlyError(error, context);

    // Log technical details
    Logger.error(`Error in ${context || 'unknown context'}`, {
      title: friendlyError.title,
      message: friendlyError.message,
      technical: friendlyError.technical,
    });

    // Show user-friendly alert
    Alert.alert(
      friendlyError.title,
      friendlyError.message,
      [
        {
          text: friendlyError.action || 'OK',
          style: 'default',
        },
      ],
      { cancelable: true }
    );
  }

  /**
   * Show an alert with custom title and message
   */
  static showCustomError(title: string, message: string, actionText: string = 'OK'): void {
    Logger.warn(`Custom error shown: ${title}`, { message });

    Alert.alert(
      title,
      message,
      [
        {
          text: actionText,
          style: 'default',
        },
      ],
      { cancelable: true }
    );
  }

  /**
   * Show a success message
   */
  static showSuccess(title: string, message: string, actionText: string = 'OK'): void {
    Logger.info(`Success message: ${title}`, { message });

    Alert.alert(
      title,
      message,
      [
        {
          text: actionText,
          style: 'default',
        },
      ],
      { cancelable: true }
    );
  }

  /**
   * Show a confirmation dialog
   */
  static showConfirmation(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ): void {
    Alert.alert(
      title,
      message,
      [
        {
          text: cancelText,
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: confirmText,
          style: 'default',
          onPress: onConfirm,
        },
      ],
      { cancelable: true }
    );
  }

  /**
   * Format validation errors for display
   */
  static formatValidationError(field: string, message: string): string {
    const fieldName = field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

    return `${fieldName}: ${message}`;
  }

  /**
   * Get error type from error object
   */
  static getErrorType(error: any): ErrorType {
    const errorMessage = error?.message?.toLowerCase() || '';

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
      return ErrorType.AUTH;
    }
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    if (errorMessage.includes('not found') || error?.status === 404) {
      return ErrorType.NOT_FOUND;
    }
    if (errorMessage.includes('permission')) {
      return ErrorType.PERMISSION;
    }
    if (errorMessage.includes('storage') || errorMessage.includes('quota')) {
      return ErrorType.STORAGE;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Check if error is recoverable
   */
  static isRecoverable(error: any): boolean {
    const errorType = this.getErrorType(error);
    return [
      ErrorType.NETWORK,
      ErrorType.VALIDATION,
      ErrorType.STORAGE,
    ].includes(errorType);
  }

  /**
   * Get suggested action for error
   */
  static getSuggestedAction(error: any): string {
    const errorType = this.getErrorType(error);

    switch (errorType) {
      case ErrorType.NETWORK:
        return 'Check your internet connection and try again';
      case ErrorType.AUTH:
        return 'Please sign in again';
      case ErrorType.VALIDATION:
        return 'Please check your input and try again';
      case ErrorType.NOT_FOUND:
        return 'The item you\'re looking for doesn\'t exist';
      case ErrorType.PERMISSION:
        return 'Grant the required permissions in Settings';
      case ErrorType.STORAGE:
        return 'Free up storage space on your device';
      default:
        return 'Please try again or contact support if the problem persists';
    }
  }
}

// Export convenience functions
export const showError = (error: any, context?: string) =>
  ErrorService.showError(error, context);

export const showSuccess = (title: string, message: string, actionText?: string) =>
  ErrorService.showSuccess(title, message, actionText);

export const showConfirmation = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) => ErrorService.showConfirmation(title, message, onConfirm, onCancel);
