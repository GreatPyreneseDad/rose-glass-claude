import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          subscription_tier: 'signal' | 'coherence' | 'jade';
          subscription_status: 'active' | 'inactive' | 'trial';
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          subscription_tier?: 'signal' | 'coherence' | 'jade';
          subscription_status?: 'active' | 'inactive' | 'trial';
        };
        Update: {
          subscription_tier?: 'signal' | 'coherence' | 'jade';
          subscription_status?: 'active' | 'inactive' | 'trial';
        };
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          mode: string;
          started_at: string;
          last_active: string;
          message_count: number;
          avg_psi: number | null;
          avg_rho: number | null;
          avg_q: number | null;
          avg_f: number | null;
          final_distortion: number | null;
          coherence_trajectory: string | null;
        };
        Insert: {
          user_id: string;
          title?: string | null;
          mode: string;
        };
        Update: {
          title?: string | null;
          mode?: string;
          last_active?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          mode: string;
          psi: number | null;
          rho: number | null;
          q: number | null;
          f: number | null;
          distortion: number | null;
          truth_value: number | null;
          trs: number | null;
          meta_analysis: string | null;
          created_at: string;
        };
        Insert: {
          session_id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          mode: string;
          psi?: number | null;
          rho?: number | null;
          q?: number | null;
          f?: number | null;
          distortion?: number | null;
          truth_value?: number | null;
          trs?: number | null;
          meta_analysis?: string | null;
        };
      };
    };
  };
};
