import { getSupabaseConfigStatus } from './config';

function configured(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (
    !trimmed ||
    trimmed === 'demo-placeholder' ||
    trimmed === 'YOUR-SERVICE-ROLE-KEY'
  ) {
    return undefined;
  }
  return trimmed;
}

export function getSupabaseSecretKey(): string {
  const key = configured(
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  if (!key) {
    throw new Error('SUPABASE_SECRET_KEY is not configured.');
  }
  return key;
}

export function getServerConfigStatus() {
  return {
    ...getSupabaseConfigStatus(),
    secretKey: Boolean(
      configured(
        process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
      ),
    ),
  };
}
