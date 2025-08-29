import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { Database } from '../types/database.types.ts'

// Get environment variables with proper error handling
function getEnvVar(name: string): string {
  const value = Deno.env.get(name)
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`)
  }
  return value
}

// Create Supabase client for Edge Functions
export function createSupabaseClient() {
  const supabaseUrl = getEnvVar('SUPABASE_URL')
  const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY')
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Create client with user context (when auth token is available)
export function createSupabaseClientWithAuth(authToken: string) {
  const supabaseUrl = getEnvVar('SUPABASE_URL')
  const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY')
  
  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  })
  
  return client
}

// Helper to get user from auth token
export async function getUserFromToken(authToken: string) {
  const client = createSupabaseClientWithAuth(authToken)
  const { data: { user }, error } = await client.auth.getUser(authToken)
  
  if (error || !user) {
    throw new Error('Invalid or expired token')
  }
  
  return user
}

// Database types export for better type safety
export type { Database } from '../types/database.types.ts'
