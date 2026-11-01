import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      service: 'civic-pulse',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
    },
    { status: 200 }
  );
}

