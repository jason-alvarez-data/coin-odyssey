// src/screens/auth/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing } from '../../styles';
import { Input, Button } from '../../components/common';
import { AuthService } from '../../services/auth';
import { AuthStackScreenProps } from '../../types/navigation';

type Props = AuthStackScreenProps<'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await AuthService.resetPassword(email);
      
      if (error) {
        Alert.alert('Reset Failed', error.message);
      } else {
        setEmailSent(true);
        Alert.alert(
          'Reset Email Sent!', 
          'Please check your email for password reset instructions.',
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Password reset error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient 
      colors={Colors.background.primary}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo and Title Section */}
          <View style={styles.header}>
            <Text style={styles.coinEmoji}>🪙</Text>
            <Text style={styles.appName}>Coin Odyssey</Text>
            <Text style={styles.subtitle}>Reset your password</Text>
          </View>

          {/* Reset Password Form */}
          <BlurView intensity={60} style={styles.formContainer}>
            <View style={styles.form}>
              <Text style={styles.formTitle}>Forgot Password</Text>
              
              {!emailSent ? (
                <>
                  <Text style={styles.instructions}>
                    Enter your email address and we'll send you instructions to reset your password.
                  </Text>

                  <Input
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    style={styles.input}
                  />

                  <Button
                    title={loading ? "Sending..." : "Send Reset Email"}
                    onPress={handleResetPassword}
                    disabled={loading}
                    style={styles.resetButton}
                  />
                </>
              ) : (
                <View style={styles.successContainer}>
                  <Text style={styles.successEmoji}>📧</Text>
                  <Text style={styles.successTitle}>Email Sent!</Text>
                  <Text style={styles.successText}>
                    We've sent password reset instructions to {email}
                  </Text>
                  <Button
                    title="Send Again"
                    onPress={() => {
                      setEmailSent(false);
                      handleResetPassword();
                    }}
                    style={styles.resendButton}
                  />
                </View>
              )}

              {/* Navigation Links */}
              <View style={styles.linkContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                  <Text style={styles.linkText}>← Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing['4xl'],
    paddingVertical: Spacing['6xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['4xl'],
  },
  coinEmoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  form: {
    padding: Spacing['2xl'],
  },
  formTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  instructions: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    lineHeight: 20,
  },
  input: {
    marginBottom: Spacing.lg,
  },
  resetButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.gold,
    marginBottom: Spacing.md,
  },
  successText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    lineHeight: 20,
  },
  resendButton: {
    marginBottom: Spacing.lg,
  },
  linkContainer: {
    alignItems: 'center',
  },
  linkText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.gold,
    fontWeight: Typography.fontWeight.medium,
  },
});