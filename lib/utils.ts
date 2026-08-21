import crypto from 'crypto';

export function hashIp(ip: string): string {
  const secret = process.env.IP_HASH_SECRET || 'default-fallback-secret';
  return crypto.createHash('sha256').update(ip + secret).digest('hex');
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  
  if (forwarded) {
    const ips = forwarded.split(',');
    return ips[0].trim();
  }
  if (realIp) return realIp;
  
  return '127.0.0.1';
}
