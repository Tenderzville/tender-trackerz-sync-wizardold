import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StytchConfig {
  projectId: string;
  publicToken?: string;
}

interface StytchAuthResult {
  success: boolean;
  error?: string;
  session?: any;
}

export function useStytch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Stytch OAuth
  const initiateOAuth = useCallback(async (provider: 'google' | 'microsoft' | 'github') => {
    setIsLoading(true);
    setError(null);

    try {
      // NOTE:
      // This project currently authenticates users via Supabase Auth sessions.
      // The previous Stytch flow relied on /api/* routes that don't exist in this codebase.
      // We route social OAuth through Supabase providers so the user ends up with a valid
      // Supabase session (required by the rest of the app).

      const redirectUrl = `${window.location.origin}/auth`;
      const supabaseProvider = provider === 'microsoft' ? 'azure' : provider;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: supabaseProvider as any,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      // Some environments require explicit navigation.
      if (data?.url) {
        window.location.href = data.url;
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OAuth initiation failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle OAuth callback
  const handleOAuthCallback = useCallback(async (token: string): Promise<StytchAuthResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Exchange token for session via edge function
      const response = await fetch('/api/stytch-oauth-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete OAuth flow');
      }

      const session = await response.json();
      
      return { success: true, session };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OAuth callback failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign in with magic link via Stytch
  const sendStytchMagicLink = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stytch-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          login_magic_link_url: `${window.location.origin}/auth/magic-link`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send magic link');
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Magic link failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    initiateOAuth,
    handleOAuthCallback,
    sendStytchMagicLink,
  };
}
