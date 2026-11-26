/**
 * Better Auth browser client — the ONLY authentication client for BuildTrack.
 *
 * Uses Better Auth's official React client with cross-origin credentials support.
 * All sessions are managed via secure HttpOnly cookies — no localStorage, no JWT.
 */

import { createAuthClient } from 'better-auth/react';

const betterAuthUrl =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:5000';

export const authClient = createAuthClient({
  baseURL: betterAuthUrl,
  /**
   * fetchOptions ensures `credentials: 'include'` is sent with every request.
   * Required for cross-origin cookie handling (client on :3000, server on :5000).
   * Without this, the browser won't send the session cookie to the Express backend.
   */
  fetchOptions: {
    credentials: 'include',
  },
});

// Re-export convenience hooks and methods for use across the app
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
