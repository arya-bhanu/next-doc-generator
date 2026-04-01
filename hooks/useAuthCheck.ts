'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UseAuthCheckOptions {
  /**
   * Where to redirect if the user is not authenticated.
   * Defaults to '/login'.
   */
  redirectTo?: string;
  /**
   * Whether to skip the redirect and just return the auth state.
   * Useful for pages that handle the redirect themselves.
   * Defaults to false.
   */
  skipRedirect?: boolean;
}

interface UseAuthCheckResult {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

/**
 * Hook that verifies the user's authentication state using Supabase.
 *
 * Checks are performed:
 *  - On initial mount (covers page load / hard refresh)
 *  - Whenever the browser tab regains focus (visibilitychange → visible)
 *  - Whenever the window regains focus (focus event)
 *
 * If the session has expired or the user is not signed in and `skipRedirect`
 * is false, the hook automatically redirects to `redirectTo` (default: '/login').
 */
export function useAuthCheck({
  redirectTo = '/login',
  skipRedirect = false,
}: UseAuthCheckOptions = {}): UseAuthCheckResult {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const verifySession = useCallback(async () => {
    try {
      // getUser() makes a network request to Supabase and validates the JWT,
      // which is more secure than getSession() which only reads the local cache.
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        setUser(null);
        if (!skipRedirect) {
          router.push(redirectTo);
        }
      } else {
        setUser(user);
      }
    } catch (err) {
      console.error('[useAuthCheck] Unexpected error verifying session:', err);
      setUser(null);
      if (!skipRedirect) {
        router.push(redirectTo);
      }
    } finally {
      setLoading(false);
    }
  }, [redirectTo, router, skipRedirect]);

  useEffect(() => {
    // 1. Check immediately on mount (page load / hard refresh)
    verifySession();

    // 2. Re-check when the tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        verifySession();
      }
    };

    // 3. Re-check when the browser window regains focus
    const handleWindowFocus = () => {
      verifySession();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [verifySession]);

  return {
    user,
    loading,
    isAuthenticated: user !== null,
  };
}
