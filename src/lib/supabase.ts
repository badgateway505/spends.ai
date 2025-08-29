import { createClient } from '@supabase/supabase-js';
import { env } from '../utils/env';

// Create Supabase client
export const supabase = createClient(
  env.supabaseUrl,
  env.supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
);
