import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl } from './config';
import { getSupabaseSecretKey } from './server-config';

/**
 * Admin client for server-side operations that need to bypass RLS
 * (e.g., auto-linking a contractor record to a freshly-authenticated user).
 *
 * Uses SUPABASE_SECRET_KEY — never expose this to the browser.
 */
export function createAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
