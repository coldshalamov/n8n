import { NextResponse } from 'next/server';
import { externalUrl } from '@/lib/format';

export const dynamic = 'force-dynamic';

const N8N_TIMEOUT_MS = 12_000;

export async function GET() {
  const baseUrl = externalUrl(process.env.NEXT_PUBLIC_N8N_URL);

  if (!baseUrl) {
    return NextResponse.json(
      { ok: false, status: 'missing_config', url: null },
      { status: 503 },
    );
  }

  const healthUrl = new URL('/healthz', baseUrl);

  try {
    const response = await fetch(healthUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(N8N_TIMEOUT_MS),
    });

    return NextResponse.json(
      {
        ok: response.ok,
        status: response.ok ? 'ready' : 'starting',
        statusCode: response.status,
        url: baseUrl,
      },
      { status: response.ok ? 200 : 202 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: 'starting',
        error: error instanceof Error ? error.message : 'n8n is not ready yet',
        url: baseUrl,
      },
      { status: 202 },
    );
  }
}
