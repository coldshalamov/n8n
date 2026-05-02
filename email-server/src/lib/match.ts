import { supabase } from './supabase';

const EMAIL_RE = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;

export function extractEmail(from: string): string | null {
  const m = from.match(EMAIL_RE);
  return m ? m[1].toLowerCase() : null;
}

export type MatchedContractor = {
  id: string;
  company_name: string;
  email: string;
};

export type MatchedProperty = {
  id: string;
  address: string;
};

/** Find a contractor whose email matches the sender (case insensitive). */
export async function findContractorByEmail(
  email: string,
): Promise<MatchedContractor | null> {
  const { data, error } = await supabase()
    .from('contractors')
    .select('id, company_name, email')
    .ilike('email', email)
    .maybeSingle();
  if (error) {
    console.error('contractor lookup failed', error);
    return null;
  }
  return (data as MatchedContractor | null) ?? null;
}

/**
 * Find a property by scanning the subject for an address fragment.
 * Returns the longest matching property to handle "742 NW 43rd St Unit 5"
 * vs. "742 NW 43rd St" cleanly.
 */
export async function findPropertyFromText(
  text: string,
): Promise<MatchedProperty | null> {
  const { data, error } = await supabase()
    .from('properties')
    .select('id, address');
  if (error) {
    console.error('property lookup failed', error);
    return null;
  }
  if (!data) return null;
  const lower = text.toLowerCase();
  const matches = (data as MatchedProperty[]).filter((p) => {
    // Match on the street-number + street-name portion (first 3 words is usually enough)
    const fragment = p.address.split(',')[0].trim().toLowerCase();
    return lower.includes(fragment);
  });
  matches.sort((a, b) => b.address.length - a.address.length);
  return matches[0] ?? null;
}

/** Find an active job for the given contractor + property pair. */
export async function findActiveJob(
  contractorId: string,
  propertyId: string,
): Promise<string | null> {
  const { data, error } = await supabase()
    .from('jobs')
    .select('id, status, due_date')
    .eq('contractor_id', contractorId)
    .eq('property_id', propertyId)
    .not('status', 'in', '(paid,complete)')
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(1);
  if (error) {
    console.error('active job lookup failed', error);
    return null;
  }
  if (!data || data.length === 0) return null;
  return (data[0] as { id: string }).id;
}
