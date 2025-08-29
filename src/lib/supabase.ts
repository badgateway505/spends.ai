import { createClient } from '@supabase/supabase-js';
import { Database } from '../../supabase/types/database.types';
import { env } from '../utils/env';

// Create Supabase client
export const supabase = createClient<Database>(
  env.supabaseUrl,
  env.supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
);

// Export types for convenience
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Expense = Tables<'spends'>;
export type Group = Tables<'groups'>;
export type Tag = Tables<'tags'>;
export type ExpenseWithConversions = Database['public']['Views']['spends_with_conversions']['Row'];
