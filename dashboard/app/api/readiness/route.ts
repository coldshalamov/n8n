import { NextResponse } from 'next/server';
import { getServerConfigStatus } from '@/lib/supabase/server-config';

export async function GET() {
  const config = getServerConfigStatus();
  const ok =
    config.url && config.publishableKey && config.secretKey && config.n8nUrl;

  return NextResponse.json(
    {
      ok,
      config,
    },
    { status: ok ? 200 : 503 },
  );
}
