const PLACEHOLDER_VALUES = new Set([
  '',
  'demo-placeholder',
  'https://example.supabase.co',
  'https://YOUR-PROJECT.supabase.co',
  'YOUR-SERVICE-ROLE-KEY',
]);

function configured(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || PLACEHOLDER_VALUES.has(trimmed)) return undefined;
  return trimmed;
}

export function getSupabaseUrl(): string {
  const url = configured(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured.');
  }
  return url;
}

export function getSupabasePublishableKey(): string {
  const key = configured(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  if (!key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not configured.',
    );
  }
  return key;
}

export function getSupabaseConfigStatus() {
  return {
    url: Boolean(configured(process.env.NEXT_PUBLIC_SUPABASE_URL)),
    publishableKey: Boolean(
      configured(
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ),
    ),
    n8nUrl: Boolean(configured(process.env.NEXT_PUBLIC_N8N_URL)),
  };
}
