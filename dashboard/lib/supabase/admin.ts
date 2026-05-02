import { createClient } from '@supabase/supabase-js';

/**
 * Admin client for server-side operations that need to bypass RLS
 * (e.g., auto-linking a contractor record to a freshly-authenticated user).
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY — never expose this to the browser.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local for admin operations.',
    );
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
