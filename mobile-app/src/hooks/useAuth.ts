// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { Logger } from '../services/logger';
import { setUser as setCrashUser } from '../services/crashReporting';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      Logger.info('Initial session loaded', { hasUser: !!session?.user });
      setUser(session?.user ?? null);
      setCrashUser(session?.user?.id ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        Logger.info('Auth state changed', { event, hasUser: !!session?.user });
        setUser(session?.user ?? null);
        setCrashUser(session?.user?.id ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
      setUser(null);
      setCrashUser(null);
    },
  };
}