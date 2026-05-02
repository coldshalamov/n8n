import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Contractor } from '@/lib/db.types';

export type Role = 'owner' | 'contractor';

export type AuthedUser = {
  id: string;
  email: string | null;
  role: Role;
  contractor: Contractor | null;
};

/**
 * Returns the current user with their resolved role.
 * Redirects to /login if there is no user.
 */
export async function requireUser(): Promise<AuthedUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: contractor } = await supabase
    .from('contractors')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    role: contractor ? 'contractor' : 'owner',
    contractor: (contractor as Contractor | null) ?? null,
  };
}

/** Owner-only routes redirect contractors to the portal. */
export async function requireOwner(): Promise<AuthedUser> {
  const u = await requireUser();
  if (u.role !== 'owner') redirect('/portal');
  return u;
}

/** Contractor-only routes redirect owners to the dashboard. */
export async function requireContractor(): Promise<AuthedUser> {
  const u = await requireUser();
  if (u.role !== 'contractor') redirect('/');
  return u;
}
