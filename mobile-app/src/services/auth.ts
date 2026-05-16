// src/services/auth.ts
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { Logger } from './logger';

export class AuthService {
  static async isAppleAuthAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch {
      return false;
    }
  }

  static async signInWithApple() {
    Logger.info('AuthService: Initiating Apple sign in');
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Apple sign in did not return an identity token.');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    Logger.info('AuthService: Apple sign in result', {
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      error: error?.message,
    });

    return { data, error };
  }

  static async signIn(email: string, password: string) {
    Logger.info('AuthService: Attempting sign in');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    Logger.info('AuthService: Sign in result', {
      hasUser: !!data.user,
      hasSession: !!data.session,
      error: error?.message
    });
    
    return { data, error };
  }

  static async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    return { data, error };
  }

  static async signOut() {
    Logger.info('AuthService: Signing out');
    const { error } = await supabase.auth.signOut();
    if (error) {
      Logger.error('AuthService: Sign out error', error);
    }
    return { error };
  }

  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  static async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  }
}