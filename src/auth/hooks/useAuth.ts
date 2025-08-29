import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      }
      
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    // Hardcoded admin user for testing
    if (email === 'admin' && password === 'admin') {
      // Create a mock user session for testing
      const mockUser = {
        id: 'admin-user-id',
        email: 'admin@test.com',
        created_at: new Date().toISOString(),
        user_metadata: {},
        app_metadata: {},
      } as User;
      
      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser,
      } as Session;
      
      // Store mock user in localStorage for service access
      localStorage.setItem('mock-admin-user', JSON.stringify(mockUser));
      
      setAuthState({
        user: mockUser,
        session: mockSession,
        loading: false,
      });
      
      return { user: mockUser, session: mockSession };
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    // Clear mock user data
    localStorage.removeItem('mock-admin-user');
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    ...authState,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}
