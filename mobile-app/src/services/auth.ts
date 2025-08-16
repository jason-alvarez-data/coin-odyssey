// src/services/auth.ts
import { supabase } from './supabase';
import * as SecureStore from 'expo-secure-store';

export class AuthService {
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (data.session) {
      await SecureStore.setItemAsync('session', JSON.stringify(data.session));
    }
    
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
    await supabase.auth.signOut();
    await SecureStore.deleteItemAsync('session');
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