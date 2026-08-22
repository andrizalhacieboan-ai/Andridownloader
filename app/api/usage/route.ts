import { NextResponse } from 'next/server';
import { getClientIp, hashIp } from '@/lib/utils';
import { getUsage } from '@/lib/rate-limit';

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const ipHash = hashIp(ip);
  const usage = await getUsage(ipHash);
  return NextResponse.json(usage);
}
