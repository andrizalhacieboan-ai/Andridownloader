import { NextResponse } from 'next/server';
import { getClientIp, hashIp } from '@/lib/utils';
import { checkAndIncrementRateLimit } from '@/lib/rate-limit';
import { processDownload } from '@/lib/scraper-manager';
import { db } from '@/lib/db';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = body.url;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'URL tidak valid' }, { status: 400 });
    }

    const ip = getClientIp(req);
    const ipHash = hashIp(ip);

    // 1. Check Limit (Atomic)
    const usage = await checkAndIncrementRateLimit(ipHash);
    
    if (usage.limitReached) {
      return NextResponse.json(
        { success: false, error: 'Daily limit reached', usage },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(usage.limit),
            'X-RateLimit-Remaining': String(usage.remaining),
            'X-RateLimit-Reset': String(new Date(usage.resetAt).getTime()),
            'Retry-After': String(Math.ceil((new Date(usage.resetAt).getTime() - Date.now()) / 1000))
          }
        }
      );
    }

    // 2. Process Download
    const data = await processDownload(url);

    // 3. Log Success
    await db.execute({
      sql: `INSERT INTO download_logs (ip_hash, platform, url, status, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [ipHash, data.platform, url, 'success', Date.now()]
    });

    return NextResponse.json({ success: true, ...data, usage });

  } catch (error: any) {
    console.error('Download Error:', error);
    
    const status = error.type === 'INVALID_URL' ? 400 :
                   error.type === 'UNSUPPORTED_PLATFORM' ? 400 :
                   error.type === 'SCRAPER_ERROR' ? 502 : 500;

    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status }
    );
  }
}
