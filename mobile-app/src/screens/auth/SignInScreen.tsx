// src/screens/auth/SignInScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing } from '../../styles';
import { Card, Input, Button } from '../../components/common';
import { AuthService } from '../../services/auth';
import { AuthStackScreenProps } from '../../types/navigation';

type Props = AuthStackScreenProps<'SignIn'>;

export default function SignInScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await AuthService.signIn(email, password);
      
      if (error) {
        Alert.alert('Sign In Failed', error.message);
      } else if (data.user) {
        console.log('Sign in successful');
        // Give auth state a moment to propagate
        setTimeout(() => {
          console.log('Auth state should have updated by now');
        }, 1000);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Sign in error:', error);
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
            <Text style={styles.subtitle}>Welcome back to your collection</Text>
          </View>

          {/* Sign In Form */}
          <BlurView intensity={60} style={styles.formContainer}>
            <View style={styles.form}>
              <Text style={styles.formTitle}>Sign In</Text>
              
              <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
              />
              
              <Input
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                style={styles.input}
              />

              <Button
                title={loading ? "Signing In..." : "Sign In"}
                onPress={handleSignIn}
                disabled={loading}
                style={styles.signInButton}
              />

              {/* Navigation Links */}
              <View style={styles.linkContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.linkText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                  <Text style={styles.signUpLink}>Sign Up</Text>
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
    marginBottom: Spacing['2xl'],
  },
  input: {
    marginBottom: Spacing.lg,
  },
  signInButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  linkContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  linkText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.gold,
    fontWeight: Typography.fontWeight.medium,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  signUpLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.gold,
    fontWeight: Typography.fontWeight.bold,
  },
});