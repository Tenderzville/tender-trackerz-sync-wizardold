import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export type UserType = 'buyer' | 'supplier' | null;

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  userRole: 'admin' | 'moderator' | 'user' | null;
  userType: UserType;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAdmin: false,
    userRole: null,
    userType: null,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));
      
      if (session?.user) {
        checkUserRole(session.user.id);
        fetchUserType(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false,
        }));
        
        if (session?.user) {
          checkUserRole(session.user.id);
          fetchUserType(session.user.id);
        } else {
          setAuthState(prev => ({
            ...prev,
            isAdmin: false,
            userRole: null,
            userType: null,
          }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        setAuthState(prev => ({
          ...prev,
          userRole: data.role as 'admin' | 'moderator' | 'user',
          isAdmin: data.role === 'admin',
        }));
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchUserType = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('business_type')
        .eq('id', userId)
        .single();

      if (data && !error) {
        const businessType = data.business_type?.toLowerCase();
        const userType: UserType = 
          businessType === 'buyer' ? 'buyer' : 
          businessType === 'supplier' ? 'supplier' : null;
        
        setAuthState(prev => ({
          ...prev,
          userType,
        }));
      }
    } catch (error) {
      console.error('Error fetching user type:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, metadata?: { first_name?: string; last_name?: string; user_type?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
  };
}
