import { NextResponse } from 'next/server';
import { getClientIp, hashIp } from '@/lib/utils';
import { checkAndIncrementRateLimit } from '@/lib/rate-limit';
import { processDownload } from '@/lib/scraper-manager';
import { db, ensureDbInitialized } from '@/lib/db';

export const maxDuration = 60;

// Fungsi verifikasi hCaptcha ke server mereka
async function verifyToken(token: string, ip: string): Promise<boolean> {
  const payload = {
    secret: process.env.HCAPTCHA_SECRET || "your_secret_key",
    response: token,
    remoteip: ip,
    sitekey: process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY || "c07c54d6-d866-402e-91e0-19528d52e66c",
  };
  
  const params = new URLSearchParams(payload);
  const res = await fetch("https://api.hcaptcha.com/siteverify", {
    method: "POST",
    body: params,
  });
  
  const j = await res.json();
  return j.success === true;
}

export async function POST(req: Request) {
  await ensureDbInitialized();
  
  try {
    const body = await req.json();
    const url = body.url;
    const captchaToken = body.captchaToken;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'URL tidak valid' }, { status: 400 });
    }

    // Validasi hCaptcha wajib dilakukan sebelum proses scrape
    if (!captchaToken || typeof captchaToken !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Verifikasi Captcha gagal.' }, 
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const isHuman = await verifyToken(captchaToken, ip);
    
    if (!isHuman) {
      return NextResponse.json(
        { success: false, error: 'Verifikasi Captcha gagal. Pastikan Anda bukan bot.' }, 
        { status: 403 }
      );
    }

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
