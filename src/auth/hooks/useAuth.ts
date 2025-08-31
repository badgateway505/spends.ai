import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { isDevelopment, env } from '../../utils/env';
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

  const handleMockAuth = async () => {
    // Simulate loading delay for realistic testing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockUser = {
      id: 'debug-user-id-12345',
      email: 'debug@test.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_metadata: {
        full_name: 'Debug User',
        avatar_url: null,
      },
      app_metadata: {
        provider: 'mock',
        role: 'debug',
      },
      aud: 'authenticated',
      role: 'authenticated',
      email_confirmed_at: new Date().toISOString(),
      phone_confirmed_at: undefined,
      confirmation_sent_at: undefined,
      recovery_sent_at: undefined,
      email_change_sent_at: undefined,
      new_email: undefined,
      new_phone: undefined,
      invited_at: undefined,
      action_link: undefined,
      phone: undefined,
    } as User;
    
    const mockSession = {
      access_token: 'mock-access-token-' + Date.now(),
      refresh_token: 'mock-refresh-token-' + Date.now(),
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: mockUser,
    } as Session;
    
    // Store mock user in localStorage for service access
    localStorage.setItem('mock-debug-user', JSON.stringify(mockUser));
    localStorage.setItem('mock-debug-session', JSON.stringify(mockSession));
    
    setAuthState({
      user: mockUser,
      session: mockSession,
      loading: false,
    });
    
    console.log('Mock debug user authenticated successfully:', {
      id: mockUser.id,
      email: mockUser.email,
      provider: 'mock'
    });
    
    return { user: mockUser, session: mockSession };
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      // Auto-login in debug mode if enabled
      if (isDevelopment && env.debug.autoLogin) {
        await handleMockAuth();
        return;
      }

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
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };



  const signUpWithEmail = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      // Clear mock user data if in development
      if (isDevelopment) {
        localStorage.removeItem('mock-debug-user');
        localStorage.removeItem('mock-debug-session');
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Reset auth state after successful sign out
      setAuthState({
        user: null,
        session: null,
        loading: false,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  return {
    ...authState,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}
