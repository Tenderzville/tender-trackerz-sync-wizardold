import { useState, useCallback } from 'react';

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
      // Build redirect URL
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      // In production, this would call Stytch's OAuth API
      // For now, we'll use edge function to handle OAuth flow
      const response = await fetch('/api/stytch-oauth-init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          redirect_url: redirectUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate OAuth flow');
      }

      const { oauth_url } = await response.json();
      
      // Redirect to OAuth provider
      window.location.href = oauth_url;
      
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
