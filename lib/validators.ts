import { SUPPORTED_PLATFORMS } from './config';

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    if (parsed.hostname === 'localhost' || parsed.hostname.startsWith('127.') || parsed.hostname.startsWith('192.168.')) return false;
    if (['file:', 'data:', 'javascript:'].includes(parsed.protocol)) return false;
    return true;
  } catch {
    return false;
  }
}
