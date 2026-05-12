// src/components/common/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing } from '../../styles';
import { Logger } from '../../services/logger';

interface Props {
  children: React.ReactElement | React.ReactElement[];
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Prevents the entire app from crashing when a component fails
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to our logging service
    Logger.error('Error boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    // Reset the error boundary
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { fallbackTitle, fallbackMessage } = this.props;
      const { error, errorInfo } = this.state;

      return (
        <LinearGradient colors={Colors.background.primary} style={styles.container}>
          <View style={styles.content}>
            <BlurView intensity={60} style={styles.errorCard}>
              {/* Error Icon */}
              <View style={styles.iconContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
              </View>

              {/* Error Title */}
              <Text style={styles.errorTitle}>
                {fallbackTitle || 'Oops! Something went wrong'}
              </Text>

              {/* Error Message */}
              <Text style={styles.errorMessage}>
                {fallbackMessage ||
                  "An unexpected error occurred. We've logged the issue and will look into it."}
              </Text>

              {/* Error Details (Development Only) */}
              {__DEV__ && error && (
                <ScrollView style={styles.errorDetails}>
                  <View style={styles.errorDetailsContent}>
                    <Text style={styles.errorDetailsTitle}>Error Details (Dev Mode):</Text>
                    <Text style={styles.errorDetailsText}>
                      {error.toString()}
                    </Text>
                    {error.stack && (
                      <>
                        <Text style={styles.errorDetailsTitle}>Stack Trace:</Text>
                        <Text style={styles.errorDetailsText}>{error.stack}</Text>
                      </>
                    )}
                    {errorInfo && errorInfo.componentStack && (
                      <>
                        <Text style={styles.errorDetailsTitle}>Component Stack:</Text>
                        <Text style={styles.errorDetailsText}>
                          {errorInfo.componentStack}
                        </Text>
                      </>
                    )}
                  </View>
                </ScrollView>
              )}

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={this.handleReset}
                >
                  <Text style={styles.primaryButtonText}>Try Again</Text>
                </TouchableOpacity>

                {__DEV__ && (
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => {
                      Logger.info('Error details exported');
                      Logger.debug('Error', error);
                      Logger.debug('Error Info', errorInfo);
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>Log to Console</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Help Text */}
              <Text style={styles.helpText}>
                If this problem persists, please contact support
              </Text>
            </BlurView>
          </View>
        </LinearGradient>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.background.cardBorder,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  errorDetails: {
    width: '100%',
    maxHeight: 200,
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: Spacing.md,
  },
  errorDetailsContent: {
    flex: 1,
  },
  errorDetailsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  errorDetailsText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary.gold,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary.gold,
  },
  secondaryButtonText: {
    color: Colors.primary.gold,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  helpText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});

export default ErrorBoundary;
