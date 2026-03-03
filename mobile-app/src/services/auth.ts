// src/services/auth.ts
import { supabase } from './supabase';
import { Logger } from './logger';

export class AuthService {
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