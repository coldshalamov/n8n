import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * OAuth / magic-link callback. Supabase redirects here with `?code=…`.
 * We exchange the code for a session, auto-link any contractor record
 * with a matching email, then send the user to /. The (dashboard) and
 * (contractor) layouts route by role from there.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) return NextResponse.redirect(`${origin}/login`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error?.message ?? 'Sign-in failed')}`,
    );
  }

  // Auto-link contractor by email if not already linked.
  if (data.user.email && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient();
      const { data: contractor } = await admin
        .from('contractors')
        .select('id, auth_user_id')
        .ilike('email', data.user.email)
        .maybeSingle();

      if (contractor && !contractor.auth_user_id) {
        await admin
          .from('contractors')
          .update({ auth_user_id: data.user.id })
          .eq('id', contractor.id);
      }
    } catch {
      // non-fatal — they'll still sign in, just unlinked
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
