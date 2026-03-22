import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const FREE_TIER_LIMIT = 3;

interface Profile {
  subscription_status: 'trial' | 'active' | 'expired' | 'canceled' | 'free' | 'inactive';
  trial_ends_at: string | null;
  monthly_analyses_used: number;
  monthly_analyses_reset: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  hasAccess: boolean;
  isFreeTier: boolean;
  analysesRemaining: number;
  refreshProfile: () => Promise<void>;
  incrementUsage: () => Promise<{ allowed: boolean; remaining: number }>;
  signUp: (email: string, password: string, tier: 'signal' | 'coherence' | 'jade') => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, monthly_analyses_used, monthly_analyses_reset')
      .eq('id', userId)
      .single();
    if (data) setProfile(data as Profile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Free tier: always has access but limited analyses
  // Trial: has access if trial hasn't expired
  // Active: always has access
  // Canceled/expired/inactive: no access (paywall)
  const isFreeTier = profile?.subscription_status === 'free';

  const hasAccess = (() => {
    if (!profile) return false;
    if (profile.subscription_status === 'active') return true;
    if (profile.subscription_status === 'free') return true;
    if (profile.subscription_status === 'trial' && profile.trial_ends_at) {
      return new Date(profile.trial_ends_at) > new Date();
    }
    return false;
  })();

  const analysesRemaining = (() => {
    if (!profile) return 0;
    if (profile.subscription_status === 'active' || profile.subscription_status === 'trial') return 999;
    if (profile.subscription_status === 'free') {
      // Check if we need a reset (client-side hint)
      if (profile.monthly_analyses_reset && new Date(profile.monthly_analyses_reset) <= new Date()) {
        return FREE_TIER_LIMIT;
      }
      return Math.max(0, FREE_TIER_LIMIT - profile.monthly_analyses_used);
    }
    return 0;
  })();

  // Call the DB function to atomically increment and check
  const incrementUsage = useCallback(async (): Promise<{ allowed: boolean; remaining: number }> => {
    if (!user) return { allowed: false, remaining: 0 };
    if (profile?.subscription_status === 'active' || profile?.subscription_status === 'trial') {
      return { allowed: true, remaining: 999 };
    }

    const { data, error } = await supabase.rpc('increment_analysis_usage', {
      user_uuid: user.id,
    });

    if (error || !data || data.length === 0) {
      return { allowed: false, remaining: 0 };
    }

    const result = data[0];
    // Refresh profile to get updated count
    await fetchProfile(user.id);
    return { allowed: result.is_allowed, remaining: result.analyses_remaining };
  }, [user, profile, fetchProfile]);

  const signUp = async (email: string, password: string, tier: 'signal' | 'coherence' | 'jade') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { subscription_tier: tier } },
    });
    if (data.user && !error) setUser(data.user);
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data.user && !error) {
      setUser(data.user);
      fetchProfile(data.user.id);
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading, hasAccess, isFreeTier, analysesRemaining,
      refreshProfile, incrementUsage, signUp, signIn, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
